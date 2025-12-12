/**
 * Provider de Realtime
 *
 * Inicializa e gerencia as conexoes realtime da aplicacao
 */

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { useAuth } from '@/store/auth'
import { useSchedule } from '@/store/schedule'
import { useNotifications } from '@/store/notifications'
import { realtimeService, subscribeToAppointments, subscribeToNotifications, RealtimeEvent } from '@/services/realtime'

// ============================================
// TIPOS
// ============================================

interface RealtimeContextValue {
  isConnected: boolean
  lastScheduleUpdate: Date | null
  lastNotificationUpdate: Date | null
  connectionError: string | null
  reconnect: () => void
}

const RealtimeContext = createContext<RealtimeContextValue>({
  isConnected: false,
  lastScheduleUpdate: null,
  lastNotificationUpdate: null,
  connectionError: null,
  reconnect: () => {},
})

// ============================================
// PROVIDER
// ============================================

interface RealtimeProviderProps {
  children: ReactNode
  /** Ativar notificacoes sonoras */
  enableSounds?: boolean
  /** Ativar notificacoes do browser */
  enableBrowserNotifications?: boolean
}

export function RealtimeProvider({
  children,
  enableSounds = false,
  enableBrowserNotifications = false,
}: RealtimeProviderProps) {
  const { user } = useAuth()
  const { fetchAppointments, fetchWaitlist } = useSchedule()
  const { fetchNotifications, createNotification } = useNotifications()

  const [isConnected, setIsConnected] = useState(false)
  const [lastScheduleUpdate, setLastScheduleUpdate] = useState<Date | null>(null)
  const [lastNotificationUpdate, setLastNotificationUpdate] = useState<Date | null>(null)
  const [connectionError, setConnectionError] = useState<string | null>(null)

  // Funcao para tocar som de notificacao
  const playNotificationSound = useCallback(() => {
    if (!enableSounds) return

    try {
      // Criar som usando Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.value = 800
      oscillator.type = 'sine'
      gainNode.gain.value = 0.3

      oscillator.start()
      oscillator.stop(audioContext.currentTime + 0.15)
    } catch (e) {
      console.warn('Could not play notification sound:', e)
    }
  }, [enableSounds])

  // Funcao para mostrar notificacao do browser
  const showBrowserNotification = useCallback((title: string, body: string) => {
    if (!enableBrowserNotifications) return
    if (!('Notification' in window)) return
    if (Notification.permission !== 'granted') return

    new Notification(title, {
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
    })
  }, [enableBrowserNotifications])

  // Solicitar permissao para notificacoes do browser
  useEffect(() => {
    if (enableBrowserNotifications && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission()
      }
    }
  }, [enableBrowserNotifications])

  // Inicializar realtime quando usuario logar
  useEffect(() => {
    if (!user) {
      setIsConnected(false)
      setConnectionError(null)
      return
    }

    let appointmentsUnsubscribe: (() => void) | null = null
    let notificationsUnsubscribe: (() => void) | null = null

    const initRealtime = async () => {
      try {
        // Inicializar servico
        await realtimeService.initialize()

        // Subscription para appointments
        appointmentsUnsubscribe = subscribeToAppointments((payload) => {
          console.log('[REALTIME] Schedule update:', payload.eventType)
          setLastScheduleUpdate(new Date())
          setIsConnected(true)
          setConnectionError(null)

          // Atualizar dados
          fetchAppointments()
          fetchWaitlist()

          // Notificar sobre novos agendamentos
          if (payload.eventType === 'INSERT' && payload.new) {
            const appointment = payload.new
            playNotificationSound()
            showBrowserNotification(
              'Novo Agendamento',
              `${appointment.patient_name} - ${appointment.procedure}`
            )
          }

          // Notificar sobre cancelamentos
          if (payload.eventType === 'UPDATE' && payload.new?.status === 'cancelled') {
            const appointment = payload.new
            playNotificationSound()
            showBrowserNotification(
              'Agendamento Cancelado',
              `${appointment.patient_name} cancelou o agendamento`
            )
          }
        })

        // Subscription para notifications
        notificationsUnsubscribe = subscribeToNotifications((payload) => {
          console.log('[REALTIME] Notification update:', payload.eventType)
          setLastNotificationUpdate(new Date())

          // Atualizar contador de notificacoes
          fetchNotifications()

          // Notificar sobre novas notificacoes
          if (payload.eventType === 'INSERT' && payload.new) {
            playNotificationSound()
            showBrowserNotification(
              payload.new.title,
              payload.new.message
            )
          }
        })

        setIsConnected(true)
        console.log('[REALTIME] Provider initialized successfully')
      } catch (error) {
        console.error('[REALTIME] Failed to initialize:', error)
        setIsConnected(false)
        setConnectionError('Falha ao conectar em tempo real')
      }
    }

    initRealtime()

    // Cleanup ao deslogar ou desmontar
    return () => {
      if (appointmentsUnsubscribe) appointmentsUnsubscribe()
      if (notificationsUnsubscribe) notificationsUnsubscribe()
      realtimeService.unsubscribeAll()
      setIsConnected(false)
    }
  }, [user, fetchAppointments, fetchWaitlist, fetchNotifications, playNotificationSound, showBrowserNotification])

  // Funcao para reconectar manualmente
  const reconnect = useCallback(async () => {
    if (!user) return

    setConnectionError(null)
    realtimeService.unsubscribeAll()

    try {
      await realtimeService.initialize()
      setIsConnected(true)
    } catch (error) {
      setConnectionError('Falha ao reconectar')
    }
  }, [user])

  return (
    <RealtimeContext.Provider
      value={{
        isConnected,
        lastScheduleUpdate,
        lastNotificationUpdate,
        connectionError,
        reconnect,
      }}
    >
      {children}
    </RealtimeContext.Provider>
  )
}

// ============================================
// HOOK
// ============================================

export function useRealtimeContext() {
  return useContext(RealtimeContext)
}

export default RealtimeProvider
