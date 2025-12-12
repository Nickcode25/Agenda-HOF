/**
 * Utilitarios para operacoes em lote (batch)
 *
 * Otimiza queries e operacoes no banco de dados
 */

import { supabase } from '@/lib/supabase'
import { logger } from '@/utils/logger'

// ============================================
// TIPOS
// ============================================

export interface BatchResult<T> {
  success: boolean
  data?: T[]
  errors?: Array<{ index: number; error: string }>
  totalProcessed: number
  totalSuccess: number
  totalErrors: number
}

export interface BatchOptions {
  /** Tamanho de cada lote */
  batchSize?: number
  /** Delay entre lotes em ms (para evitar rate limiting) */
  delayBetweenBatches?: number
  /** Se deve continuar em caso de erro */
  continueOnError?: boolean
  /** Callback de progresso */
  onProgress?: (processed: number, total: number) => void
}

const DEFAULT_BATCH_SIZE = 50
const DEFAULT_DELAY = 100

// ============================================
// HELPERS
// ============================================

/**
 * Divide um array em chunks de tamanho especifico
 */
export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

/**
 * Aguarda um tempo especificado
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ============================================
// BATCH INSERT
// ============================================

/**
 * Insere multiplos registros em lotes
 *
 * @example
 * const result = await batchInsert('patients', patients, {
 *   batchSize: 100,
 *   onProgress: (processed, total) => console.log(`${processed}/${total}`)
 * })
 */
export async function batchInsert<T extends Record<string, unknown>>(
  table: string,
  records: T[],
  options: BatchOptions = {}
): Promise<BatchResult<T>> {
  const {
    batchSize = DEFAULT_BATCH_SIZE,
    delayBetweenBatches = DEFAULT_DELAY,
    continueOnError = true,
    onProgress
  } = options

  const batches = chunk(records, batchSize)
  const results: T[] = []
  const errors: Array<{ index: number; error: string }> = []
  let processedCount = 0

  logger.info(`[BatchInsert] Iniciando insercao de ${records.length} registros em ${batches.length} lotes`)

  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex]
    const startIndex = batchIndex * batchSize

    try {
      const { data, error } = await supabase
        .from(table)
        .insert(batch)
        .select()

      if (error) {
        logger.error(`[BatchInsert] Erro no lote ${batchIndex + 1}:`, error)

        if (!continueOnError) {
          return {
            success: false,
            data: results,
            errors: [{ index: startIndex, error: error.message }],
            totalProcessed: processedCount,
            totalSuccess: results.length,
            totalErrors: 1
          }
        }

        // Marcar todos os itens do lote como erro
        batch.forEach((_, i) => {
          errors.push({ index: startIndex + i, error: error.message })
        })
      } else if (data) {
        results.push(...(data as T[]))
      }

      processedCount += batch.length
      onProgress?.(processedCount, records.length)

      // Delay entre lotes para evitar sobrecarga
      if (batchIndex < batches.length - 1 && delayBetweenBatches > 0) {
        await delay(delayBetweenBatches)
      }
    } catch (err) {
      logger.error(`[BatchInsert] Excecao no lote ${batchIndex + 1}:`, err)

      if (!continueOnError) {
        throw err
      }

      batch.forEach((_, i) => {
        errors.push({
          index: startIndex + i,
          error: err instanceof Error ? err.message : 'Erro desconhecido'
        })
      })
    }
  }

  logger.info(`[BatchInsert] Concluido: ${results.length} sucesso, ${errors.length} erros`)

  return {
    success: errors.length === 0,
    data: results,
    errors: errors.length > 0 ? errors : undefined,
    totalProcessed: processedCount,
    totalSuccess: results.length,
    totalErrors: errors.length
  }
}

// ============================================
// BATCH UPDATE
// ============================================

/**
 * Atualiza multiplos registros em lotes
 *
 * @example
 * const result = await batchUpdate('patients', updates, 'id')
 */
export async function batchUpdate<T extends Record<string, unknown>>(
  table: string,
  records: Array<{ id: string; data: Partial<T> }>,
  options: BatchOptions = {}
): Promise<BatchResult<T>> {
  const {
    batchSize = DEFAULT_BATCH_SIZE,
    delayBetweenBatches = DEFAULT_DELAY,
    continueOnError = true,
    onProgress
  } = options

  const batches = chunk(records, batchSize)
  const results: T[] = []
  const errors: Array<{ index: number; error: string }> = []
  let processedCount = 0

  logger.info(`[BatchUpdate] Iniciando atualizacao de ${records.length} registros`)

  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex]
    const startIndex = batchIndex * batchSize

    // Processar cada item do lote em paralelo
    const batchPromises = batch.map(async (record, i) => {
      try {
        const { data, error } = await supabase
          .from(table)
          .update(record.data)
          .eq('id', record.id)
          .select()
          .single()

        if (error) {
          return { success: false, error: error.message, index: startIndex + i }
        }

        return { success: true, data: data as T, index: startIndex + i }
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Erro desconhecido',
          index: startIndex + i
        }
      }
    })

    const batchResults = await Promise.all(batchPromises)

    for (const result of batchResults) {
      if (result.success && result.data) {
        results.push(result.data)
      } else if (!result.success) {
        errors.push({ index: result.index, error: result.error || 'Erro desconhecido' })

        if (!continueOnError) {
          return {
            success: false,
            data: results,
            errors,
            totalProcessed: processedCount + batchResults.indexOf(result) + 1,
            totalSuccess: results.length,
            totalErrors: errors.length
          }
        }
      }
    }

    processedCount += batch.length
    onProgress?.(processedCount, records.length)

    if (batchIndex < batches.length - 1 && delayBetweenBatches > 0) {
      await delay(delayBetweenBatches)
    }
  }

  return {
    success: errors.length === 0,
    data: results,
    errors: errors.length > 0 ? errors : undefined,
    totalProcessed: processedCount,
    totalSuccess: results.length,
    totalErrors: errors.length
  }
}

// ============================================
// BATCH DELETE
// ============================================

/**
 * Deleta multiplos registros em lotes
 *
 * @example
 * const result = await batchDelete('patients', ids)
 */
export async function batchDelete(
  table: string,
  ids: string[],
  options: BatchOptions = {}
): Promise<BatchResult<{ id: string }>> {
  const {
    batchSize = DEFAULT_BATCH_SIZE,
    delayBetweenBatches = DEFAULT_DELAY,
    continueOnError = true,
    onProgress
  } = options

  const batches = chunk(ids, batchSize)
  const results: Array<{ id: string }> = []
  const errors: Array<{ index: number; error: string }> = []
  let processedCount = 0

  logger.info(`[BatchDelete] Iniciando delecao de ${ids.length} registros`)

  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex]
    const startIndex = batchIndex * batchSize

    try {
      const { error } = await supabase
        .from(table)
        .delete()
        .in('id', batch)

      if (error) {
        logger.error(`[BatchDelete] Erro no lote ${batchIndex + 1}:`, error)

        if (!continueOnError) {
          return {
            success: false,
            data: results,
            errors: [{ index: startIndex, error: error.message }],
            totalProcessed: processedCount,
            totalSuccess: results.length,
            totalErrors: 1
          }
        }

        batch.forEach((_, i) => {
          errors.push({ index: startIndex + i, error: error.message })
        })
      } else {
        batch.forEach(id => results.push({ id }))
      }

      processedCount += batch.length
      onProgress?.(processedCount, ids.length)

      if (batchIndex < batches.length - 1 && delayBetweenBatches > 0) {
        await delay(delayBetweenBatches)
      }
    } catch (err) {
      logger.error(`[BatchDelete] Excecao no lote ${batchIndex + 1}:`, err)

      if (!continueOnError) {
        throw err
      }

      batch.forEach((_, i) => {
        errors.push({
          index: startIndex + i,
          error: err instanceof Error ? err.message : 'Erro desconhecido'
        })
      })
    }
  }

  return {
    success: errors.length === 0,
    data: results,
    errors: errors.length > 0 ? errors : undefined,
    totalProcessed: processedCount,
    totalSuccess: results.length,
    totalErrors: errors.length
  }
}

// ============================================
// BATCH FETCH
// ============================================

/**
 * Busca multiplos registros por IDs em lotes
 *
 * @example
 * const patients = await batchFetch('patients', patientIds, ['id', 'name', 'email'])
 */
export async function batchFetch<T>(
  table: string,
  ids: string[],
  select: string = '*',
  options: Omit<BatchOptions, 'continueOnError'> = {}
): Promise<T[]> {
  const {
    batchSize = DEFAULT_BATCH_SIZE,
    delayBetweenBatches = 0,
    onProgress
  } = options

  const batches = chunk(ids, batchSize)
  const results: T[] = []
  let processedCount = 0

  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex]

    const { data, error } = await supabase
      .from(table)
      .select(select)
      .in('id', batch)

    if (error) {
      logger.error(`[BatchFetch] Erro no lote ${batchIndex + 1}:`, error)
    } else if (data) {
      results.push(...(data as T[]))
    }

    processedCount += batch.length
    onProgress?.(processedCount, ids.length)

    if (batchIndex < batches.length - 1 && delayBetweenBatches > 0) {
      await delay(delayBetweenBatches)
    }
  }

  return results
}

// ============================================
// PARALLEL QUERIES
// ============================================

/**
 * Executa multiplas queries em paralelo
 *
 * @example
 * const [patients, appointments, procedures] = await parallelQueries([
 *   () => supabase.from('patients').select('*'),
 *   () => supabase.from('appointments').select('*'),
 *   () => supabase.from('procedures').select('*')
 * ])
 */
export async function parallelQueries<T extends unknown[]>(
  queries: { [K in keyof T]: () => Promise<{ data: T[K] | null; error: unknown }> }
): Promise<T> {
  const results = await Promise.all(queries.map(q => q()))

  return results.map((result, index) => {
    if (result.error) {
      logger.error(`[ParallelQueries] Erro na query ${index}:`, result.error)
      return null
    }
    return result.data
  }) as T
}
