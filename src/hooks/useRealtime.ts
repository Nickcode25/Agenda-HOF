/**
 * Hooks para Realtime
 *
 * Facilita o uso do Supabase Realtime em componentes React
 */

import { useEffect, useRef, useCallback, useState } from 'react'
import { useAuth } from '@/store/auth'
import {
  realtimeService,
  subscribeToAppointments,
  subscribeToNotifications,
  subscribeToWaitlist,
  RealtimeCallback,
  RealtimeEvent,
} from '@/services/realtime'
import { useSchedule } from '@/store/schedule'

// ============================================
// HOOK PRINCIPAL
// ============================================

/**
 * Hook para inicializar o servico de realtime
 * Deve ser usado no componente raiz da aplicacao
 */
export function useRealtimeInit() {
  const { user } = useAuth()
  const initialized = useRef(false)

  useEffect(() => {
    if (user && !initialized.current) {
      realtimeService.initialize()
      initialized.current = true
      console.log('[REALTIME] Service initialized for user:', user.id)
    }

    // Cleanup ao deslogar
    if (!user && initialized.current) {
      realtimeService.unsubscribeAll()
      initialized.current = false
      console.log('[REALTIME] Service cleaned up')
    }

    return () => {
      if (initialized.current) {
        realtimeService.unsubscribeAll()
        initialized.current = false
      }
    }
  }, [user])
}

// ============================================
// HOOK PARA AGENDA
// ============================================

interface UseRealtimeScheduleOptions {
  /** Se deve atualizar automaticamente o store */
  autoRefresh?: boolean
  /** Callback quando houver mudanca */
  onUpdate?: (event: RealtimeEvent) => void
}

/**
 * Hook para sincronizar a agenda em tempo real
 */
export function useRealtimeSchedule(options: UseRealtimeScheduleOptions = {}) {
  const { autoRefresh = true, onUpdate } = options
  const { user } = useAuth()
  const { fetchAppointments } = useSchedule()
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (!user) return

    // Inicializar servico se necessario
    realtimeService.initialize()

    const unsubscribe = subscribeToAppointments((payload) => {
      console.log('[REALTIME] Appointment change:', payload.eventType)
      setLastUpdate(new Date())
      setIsConnected(true)

      // Atualizar store automaticamente
      if (autoRefresh) {
        fetchAppointments()
      }

      // Callback customizado
      if (onUpdate) {
        onUpdate(payload.eventType)
      }
    })

    setIsConnected(true)

    return () => {
      unsubscribe()
      setIsConnected(false)
    }
  }, [user, autoRefresh, onUpdate, fetchAppointments])

  return {
    isConnected,
    lastUpdate,
  }
}

// ============================================
// HOOK PARA LISTA DE ESPERA
// ============================================

/**
 * Hook para sincronizar a lista de espera em tempo real
 */
export function useRealtimeWaitlist(options: UseRealtimeScheduleOptions = {}) {
  const { autoRefresh = true, onUpdate } = options
  const { user } = useAuth()
  const { fetchWaitlist } = useSchedule()
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (!user) return

    realtimeService.initialize()

    const unsubscribe = subscribeToWaitlist((payload) => {
      console.log('[REALTIME] Waitlist change:', payload.eventType)
      setLastUpdate(new Date())

      if (autoRefresh) {
        fetchWaitlist()
      }

      if (onUpdate) {
        onUpdate(payload.eventType)
      }
    })

    setIsConnected(true)

    return () => {
      unsubscribe()
      setIsConnected(false)
    }
  }, [user, autoRefresh, onUpdate, fetchWaitlist])

  return {
    isConnected,
    lastUpdate,
  }
}

// ============================================
// HOOK PARA NOTIFICACOES
// ============================================

export interface RealtimeNotification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error' | 'appointment'
  read: boolean
  createdAt: string
  metadata?: Record<string, unknown>
}

interface UseRealtimeNotificationsOptions {
  /** Callback quando receber nova notificacao */
  onNewNotification?: (notification: RealtimeNotification) => void
}

/**
 * Hook para receber notificacoes em tempo real
 */
export function useRealtimeNotifications(options: UseRealtimeNotificationsOptions = {}) {
  const { onNewNotification } = options
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (!user) return

    realtimeService.initialize()

    const unsubscribe = subscribeToNotifications((payload) => {
      if (payload.eventType === 'INSERT' && payload.new) {
        const newNotification: RealtimeNotification = {
          id: payload.new.id,
          title: payload.new.title,
          message: payload.new.message,
          type: (payload.new.type as RealtimeNotification['type']) || 'info',
          read: payload.new.read,
          createdAt: payload.new.created_at,
        }

        setNotifications((prev) => [newNotification, ...prev])
        setUnreadCount((prev) => prev + 1)

        if (onNewNotification) {
          onNewNotification(newNotification)
        }
      }

      if (payload.eventType === 'UPDATE' && payload.new) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === payload.new?.id
              ? { ...n, read: payload.new.read }
              : n
          )
        )

        // Recalcular unread count
        setNotifications((prev) => {
          setUnreadCount(prev.filter((n) => !n.read).length)
          return prev
        })
      }

      if (payload.eventType === 'DELETE' && payload.old) {
        setNotifications((prev) =>
          prev.filter((n) => n.id !== payload.old?.id)
        )
      }
    })

    setIsConnected(true)

    return () => {
      unsubscribe()
      setIsConnected(false)
    }
  }, [user, onNewNotification])

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
    setUnreadCount((prev) => Math.max(0, prev - 1))
  }, [])

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnreadCount(0)
  }, [])

  const clearNotifications = useCallback(() => {
    setNotifications([])
    setUnreadCount(0)
  }, [])

  return {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  }
}

// ============================================
// HOOK GENERICO
// ============================================

interface UseRealtimeOptions<T> {
  table: string
  filter?: string
  onInsert?: (data: T) => void
  onUpdate?: (data: T, old: T | null) => void
  onDelete?: (old: T) => void
}

/**
 * Hook generico para qualquer tabela
 */
export function useRealtime<T = unknown>(options: UseRealtimeOptions<T>) {
  const { table, filter, onInsert, onUpdate, onDelete } = options
  const { user } = useAuth()
  const [isConnected, setIsConnected] = useState(false)
  const [lastEvent, setLastEvent] = useState<{
    type: RealtimeEvent
    data: T | null
    timestamp: Date
  } | null>(null)

  useEffect(() => {
    if (!user) return

    realtimeService.initialize()

    const channelName = `${table}-${user.id}-${Date.now()}`

    const unsubscribe = realtimeService.subscribe<T>(
      channelName,
      {
        table,
        filter: filter || `user_id=eq.${user.id}`,
      },
      (payload) => {
        setLastEvent({
          type: payload.eventType,
          data: payload.new || payload.old,
          timestamp: new Date(),
        })

        switch (payload.eventType) {
          case 'INSERT':
            if (onInsert && payload.new) {
              onInsert(payload.new)
            }
            break
          case 'UPDATE':
            if (onUpdate && payload.new) {
              onUpdate(payload.new, payload.old)
            }
            break
          case 'DELETE':
            if (onDelete && payload.old) {
              onDelete(payload.old)
            }
            break
        }
      }
    )

    setIsConnected(true)

    return () => {
      unsubscribe()
      setIsConnected(false)
    }
  }, [user, table, filter, onInsert, onUpdate, onDelete])

  return {
    isConnected,
    lastEvent,
  }
}

export default useRealtime
