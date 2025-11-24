import { useEffect, useRef, useCallback } from 'react'
import { useNotifications } from '@/store/notifications'

/**
 * Hook para verificar e criar lembretes automáticos periodicamente
 *
 * Funcionalidades:
 * - Verifica estoque baixo
 * - Verifica pagamentos atrasados
 * - Verifica procedimentos planejados não realizados
 *
 * Executa:
 * - Ao montar o componente
 * - A cada 5 minutos
 */
export function useNotificationChecker() {
  const { checkAndCreateReminders, fetchNotifications, fetchPreferences } = useNotifications()
  const hasCheckedRef = useRef(false)
  const isInitializedRef = useRef(false)

  // Memoizar as funções para evitar re-renders desnecessários
  const initialize = useCallback(async () => {
    if (isInitializedRef.current) return
    isInitializedRef.current = true

    console.log('🔔 Inicializando sistema de notificações...')
    await fetchPreferences()
    await fetchNotifications()

    // Verificar lembretes na primeira vez
    if (!hasCheckedRef.current) {
      hasCheckedRef.current = true
      console.log('🔔 Primeira verificação de lembretes...')
      await checkAndCreateReminders()
    }
  }, [fetchPreferences, fetchNotifications, checkAndCreateReminders])

  const checkReminders = useCallback(async () => {
    console.log('🔔 Verificação periódica de lembretes...')
    await checkAndCreateReminders()
    await fetchNotifications()
  }, [checkAndCreateReminders, fetchNotifications])

  useEffect(() => {
    initialize()

    // Configurar verificação periódica (a cada 5 minutos)
    const interval = setInterval(checkReminders, 5 * 60 * 1000) // 5 minutos

    return () => clearInterval(interval)
  }, [initialize, checkReminders])
}
