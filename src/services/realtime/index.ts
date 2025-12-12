/**
 * @fileoverview Servico de Realtime usando Supabase Realtime
 * @module services/realtime
 *
 * @description
 * Este modulo gerencia subscriptions para atualizacoes em tempo real
 * usando o Supabase Realtime. Permite que a aplicacao receba
 * notificacoes instantaneas quando dados mudam no banco.
 *
 * @example
 * import { realtimeService, subscribeToAppointments } from '@/services/realtime'
 *
 * // Inicializar servico
 * await realtimeService.initialize()
 *
 * // Subscribir para atualizacoes de agendamentos
 * const unsubscribe = subscribeToAppointments((payload) => {
 *   if (payload.eventType === 'INSERT') {
 *     console.log('Novo agendamento:', payload.new)
 *   }
 * })
 *
 * // Cleanup quando nao precisar mais
 * unsubscribe()
 */

import { supabase, getCachedUser } from '@/lib/supabase'
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'

// ============================================
// TIPOS
// ============================================

/**
 * Tipos de eventos suportados pelo Supabase Realtime
 */
export type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE'

/**
 * Callback para eventos realtime
 *
 * @template T - Tipo do registro da tabela
 * @param payload - Dados do evento
 * @param payload.eventType - Tipo de evento (INSERT, UPDATE, DELETE)
 * @param payload.new - Novo registro (null em DELETE)
 * @param payload.old - Registro anterior (null em INSERT)
 */
export interface RealtimeCallback<T = unknown> {
  (payload: {
    eventType: RealtimeEvent
    new: T | null
    old: T | null
  }): void
}

/**
 * Opcoes para criar uma subscription
 */
export interface SubscriptionOptions {
  /** Nome da tabela para observar */
  table: string
  /** Tipo de evento especifico (opcional - padrao: todos) */
  event?: RealtimeEvent | '*'
  /** Filtro por coluna no formato "coluna=eq.valor" */
  filter?: string
  /** Schema do banco de dados (padrao: public) */
  schema?: string
}

// ============================================
// GERENCIADOR DE SUBSCRIPTIONS
// ============================================

/**
 * Servico singleton para gerenciar conexoes realtime com Supabase
 *
 * @description
 * Gerencia o ciclo de vida de channels e subscriptions,
 * garantindo cleanup adequado e evitando memory leaks.
 *
 * @example
 * // Uso direto do servico
 * realtimeService.subscribe('meu-canal', {
 *   table: 'minha_tabela',
 *   filter: 'user_id=eq.123'
 * }, (payload) => {
 *   console.log('Mudanca detectada:', payload)
 * })
 */
class RealtimeService {
  /** Mapa de canais ativos por nome */
  private channels: Map<string, RealtimeChannel> = new Map()

  /** ID do usuario autenticado atual */
  private userId: string | null = null

  /**
   * Inicializa o servico com dados do usuario atual
   *
   * @description
   * Deve ser chamado apos o login do usuario para
   * que as subscriptions filtradas por user_id funcionem.
   *
   * @returns Promise<void>
   *
   * @example
   * await realtimeService.initialize()
   */
  async initialize(): Promise<void> {
    const user = await getCachedUser()
    this.userId = user?.id || null
  }

  /**
   * Cria uma subscription para uma tabela do banco
   *
   * @template T - Tipo do registro da tabela
   * @param channelName - Nome unico para identificar o canal
   * @param options - Configuracoes da subscription
   * @param callback - Funcao chamada quando houver mudancas
   * @returns Funcao para cancelar a subscription
   *
   * @example
   * const unsubscribe = realtimeService.subscribe(
   *   'agendamentos-user-123',
   *   {
   *     table: 'appointments',
   *     filter: 'user_id=eq.123',
   *     event: 'INSERT'
   *   },
   *   (payload) => console.log('Novo agendamento:', payload.new)
   * )
   *
   * // Quando nao precisar mais:
   * unsubscribe()
   */
  subscribe<T = unknown>(
    channelName: string,
    options: SubscriptionOptions,
    callback: RealtimeCallback<T>
  ): () => void {
    // Remover subscription anterior se existir
    this.unsubscribe(channelName)

    const { table, event = '*', filter, schema = 'public' } = options

    // Criar canal
    const channel = supabase.channel(channelName)

    // Configurar listener
    channel.on(
      'postgres_changes' as any,
      {
        event,
        schema,
        table,
        filter,
      },
      (payload: RealtimePostgresChangesPayload<T>) => {
        callback({
          eventType: payload.eventType as RealtimeEvent,
          new: payload.new as T | null,
          old: payload.old as T | null,
        })
      }
    )

    // Iniciar subscription
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`[REALTIME] Subscribed to ${channelName}`)
      } else if (status === 'CHANNEL_ERROR') {
        console.error(`[REALTIME] Error subscribing to ${channelName}`)
      }
    })

    // Armazenar referencia
    this.channels.set(channelName, channel)

    // Retornar funcao de cleanup
    return () => this.unsubscribe(channelName)
  }

  /**
   * Remove uma subscription especifica
   *
   * @param channelName - Nome do canal a ser removido
   *
   * @example
   * realtimeService.unsubscribe('agendamentos-user-123')
   */
  unsubscribe(channelName: string): void {
    const channel = this.channels.get(channelName)
    if (channel) {
      supabase.removeChannel(channel)
      this.channels.delete(channelName)
      console.log(`[REALTIME] Unsubscribed from ${channelName}`)
    }
  }

  /**
   * Remove todas as subscriptions ativas
   *
   * @description
   * Util para cleanup ao fazer logout ou
   * ao desmontar componentes principais.
   *
   * @example
   * // No logout
   * realtimeService.unsubscribeAll()
   */
  unsubscribeAll(): void {
    this.channels.forEach((_, name) => {
      this.unsubscribe(name)
    })
  }

  /**
   * Verifica se um canal esta ativo
   *
   * @param channelName - Nome do canal
   * @returns true se o canal esta ativo
   *
   * @example
   * if (realtimeService.isSubscribed('agendamentos')) {
   *   console.log('Ja esta inscrito')
   * }
   */
  isSubscribed(channelName: string): boolean {
    return this.channels.has(channelName)
  }

  /**
   * Retorna o ID do usuario autenticado
   *
   * @returns ID do usuario ou null se nao autenticado
   */
  getUserId(): string | null {
    return this.userId
  }
}

/** Instancia singleton do servico de realtime */
export const realtimeService = new RealtimeService()

// ============================================
// FUNCOES UTILITARIAS
// ============================================

/**
 * Tipo para registro de agendamento
 */
interface AppointmentRecord {
  id: string
  user_id: string
  patient_name: string
  procedure: string
  start: string
  end: string
  status: string
  [key: string]: unknown
}

/**
 * Tipo para registro de notificacao
 */
interface NotificationRecord {
  id: string
  user_id: string
  title: string
  message: string
  type: string
  read: boolean
  created_at: string
  [key: string]: unknown
}

/**
 * Tipo para registro de lista de espera
 */
interface WaitlistRecord {
  id: string
  user_id: string
  patient_name: string
  phone: string | null
  desired_procedure: string | null
  created_at: string
  [key: string]: unknown
}

/**
 * Cria subscription para agendamentos do usuario atual
 *
 * @description
 * Escuta mudancas na tabela `appointments` filtradas pelo
 * user_id do usuario autenticado. Notifica sobre novos
 * agendamentos, atualizacoes e cancelamentos.
 *
 * @param callback - Funcao chamada quando houver mudancas
 * @returns Funcao para cancelar a subscription
 *
 * @example
 * const unsubscribe = subscribeToAppointments((payload) => {
 *   switch (payload.eventType) {
 *     case 'INSERT':
 *       toast.success(`Novo agendamento: ${payload.new.patient_name}`)
 *       break
 *     case 'UPDATE':
 *       if (payload.new?.status === 'cancelled') {
 *         toast.info('Agendamento cancelado')
 *       }
 *       break
 *   }
 *   // Recarregar lista de agendamentos
 *   fetchAppointments()
 * })
 */
export function subscribeToAppointments(
  callback: RealtimeCallback<AppointmentRecord>
): () => void {
  const userId = realtimeService.getUserId()

  if (!userId) {
    console.warn('[REALTIME] Cannot subscribe to appointments: no user ID')
    return () => {}
  }

  return realtimeService.subscribe(
    `appointments-${userId}`,
    {
      table: 'appointments',
      filter: `user_id=eq.${userId}`,
    },
    callback
  )
}

/**
 * Cria subscription para notificacoes do usuario atual
 *
 * @description
 * Escuta mudancas na tabela `notifications` filtradas pelo
 * user_id. Notifica sobre novas notificacoes do sistema.
 *
 * @param callback - Funcao chamada quando houver mudancas
 * @returns Funcao para cancelar a subscription
 *
 * @example
 * const unsubscribe = subscribeToNotifications((payload) => {
 *   if (payload.eventType === 'INSERT' && payload.new) {
 *     showToast(payload.new.title, payload.new.message)
 *     playNotificationSound()
 *   }
 * })
 */
export function subscribeToNotifications(
  callback: RealtimeCallback<NotificationRecord>
): () => void {
  const userId = realtimeService.getUserId()

  if (!userId) {
    console.warn('[REALTIME] Cannot subscribe to notifications: no user ID')
    return () => {}
  }

  return realtimeService.subscribe(
    `notifications-${userId}`,
    {
      table: 'notifications',
      filter: `user_id=eq.${userId}`,
    },
    callback
  )
}

/**
 * Cria subscription para lista de espera do usuario atual
 *
 * @description
 * Escuta mudancas na tabela `waitlist` filtradas pelo
 * user_id. Notifica quando pacientes sao adicionados ou
 * removidos da lista de espera.
 *
 * @param callback - Funcao chamada quando houver mudancas
 * @returns Funcao para cancelar a subscription
 *
 * @example
 * const unsubscribe = subscribeToWaitlist((payload) => {
 *   if (payload.eventType === 'INSERT') {
 *     toast.info(`${payload.new.patient_name} adicionado a lista de espera`)
 *   }
 *   // Atualizar lista
 *   fetchWaitlist()
 * })
 */
export function subscribeToWaitlist(
  callback: RealtimeCallback<WaitlistRecord>
): () => void {
  const userId = realtimeService.getUserId()

  if (!userId) {
    console.warn('[REALTIME] Cannot subscribe to waitlist: no user ID')
    return () => {}
  }

  return realtimeService.subscribe(
    `waitlist-${userId}`,
    {
      table: 'waitlist',
      filter: `user_id=eq.${userId}`,
    },
    callback
  )
}

export default realtimeService
