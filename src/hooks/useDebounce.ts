import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { SEARCH_DEBOUNCE_MS } from '@/constants'

/**
 * Hook para debounce de valores
 *
 * Retorna o valor com atraso, evitando atualizacoes frequentes
 *
 * @param value - Valor a ser debounciado
 * @param delay - Tempo de espera em ms (padrao: SEARCH_DEBOUNCE_MS)
 *
 * @example
 * const [search, setSearch] = useState('')
 * const debouncedSearch = useDebounce(search, 300)
 *
 * useEffect(() => {
 *   // Esta chamada so acontece 300ms apos o usuario parar de digitar
 *   fetchResults(debouncedSearch)
 * }, [debouncedSearch])
 */
export function useDebounce<T>(value: T, delay: number = SEARCH_DEBOUNCE_MS): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * Hook para debounce de funcoes (callbacks)
 *
 * Retorna uma funcao debounciada que so executa apos o delay
 *
 * @param callback - Funcao a ser debounciada
 * @param delay - Tempo de espera em ms
 *
 * @example
 * const debouncedSearch = useDebouncedCallback((term: string) => {
 *   fetchResults(term)
 * }, 300)
 *
 * <input onChange={(e) => debouncedSearch(e.target.value)} />
 */
export function useDebouncedCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number = SEARCH_DEBOUNCE_MS
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const callbackRef = useRef(callback)

  // Manter referencia atualizada do callback
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  // Limpar timeout no unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      callbackRef.current(...args)
    }, delay)
  }, [delay])
}

/**
 * Hook para throttle de valores
 *
 * Limita a frequencia de atualizacao do valor
 *
 * @param value - Valor a ser limitado
 * @param interval - Intervalo minimo entre atualizacoes em ms
 */
export function useThrottle<T>(value: T, interval: number = 100): T {
  const [throttledValue, setThrottledValue] = useState<T>(value)
  const lastUpdated = useRef<number>(Date.now())

  useEffect(() => {
    const now = Date.now()

    if (now - lastUpdated.current >= interval) {
      lastUpdated.current = now
      setThrottledValue(value)
    } else {
      const timer = setTimeout(() => {
        lastUpdated.current = Date.now()
        setThrottledValue(value)
      }, interval - (now - lastUpdated.current))

      return () => clearTimeout(timer)
    }
  }, [value, interval])

  return throttledValue
}

/**
 * Hook para busca com debounce integrado
 *
 * Combina estado de busca com debounce e loading
 *
 * @example
 * const { searchTerm, setSearchTerm, debouncedTerm, isSearching } = useSearch()
 *
 * useEffect(() => {
 *   if (debouncedTerm) {
 *     fetchResults(debouncedTerm)
 *   }
 * }, [debouncedTerm])
 */
export function useSearch(initialValue: string = '', delay: number = SEARCH_DEBOUNCE_MS) {
  const [searchTerm, setSearchTerm] = useState(initialValue)
  const debouncedTerm = useDebounce(searchTerm, delay)
  const isSearching = searchTerm !== debouncedTerm

  const clearSearch = useCallback(() => {
    setSearchTerm('')
  }, [])

  return {
    searchTerm,
    setSearchTerm,
    debouncedTerm,
    isSearching,
    clearSearch
  }
}

/**
 * Hook para filtrar listas com debounce
 *
 * @example
 * const { filteredItems, searchTerm, setSearchTerm } = useFilteredList(
 *   patients,
 *   (patient, term) => patient.name.toLowerCase().includes(term.toLowerCase())
 * )
 */
export function useFilteredList<T>(
  items: T[],
  filterFn: (item: T, searchTerm: string) => boolean,
  delay: number = SEARCH_DEBOUNCE_MS
) {
  const { searchTerm, setSearchTerm, debouncedTerm, isSearching, clearSearch } = useSearch('', delay)

  const filteredItems = useMemo(() => {
    if (!debouncedTerm.trim()) return items
    return items.filter(item => filterFn(item, debouncedTerm))
  }, [items, debouncedTerm, filterFn])

  return {
    filteredItems,
    searchTerm,
    setSearchTerm,
    debouncedTerm,
    isSearching,
    clearSearch,
    totalItems: items.length,
    filteredCount: filteredItems.length
  }
}

export default useDebounce
