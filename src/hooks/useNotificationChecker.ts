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
 * - Após 3 segundos do mount (para não bloquear carregamento inicial)
 * - A cada 5 minutos
 */
export function useNotificationChecker() {
  const { checkAndCreateReminders, fetchNotifications, fetchPreferences } = useNotifications()
  const isInitializedRef = useRef(false)

  // Memoizar as funções para evitar re-renders desnecessários
  const initialize = useCallback(async () => {
    if (isInitializedRef.current) return
    isInitializedRef.current = true

    // Não bloqueia - executar em background
    fetchPreferences().catch(() => {})
    fetchNotifications().catch(() => {})

    // Verificar lembretes com delay para não afetar o carregamento inicial
    setTimeout(() => {
      checkAndCreateReminders().catch(() => {})
    }, 5000) // 5 segundos após inicialização
  }, [fetchPreferences, fetchNotifications, checkAndCreateReminders])

  const checkReminders = useCallback(async () => {
    // Executar em background sem bloquear
    checkAndCreateReminders().catch(() => {})
    fetchNotifications().catch(() => {})
  }, [checkAndCreateReminders, fetchNotifications])

  useEffect(() => {
    // Delay inicial para não afetar o carregamento da página
    const initTimeout = setTimeout(initialize, 2000)

    // Configurar verificação periódica (a cada 5 minutos)
    const interval = setInterval(checkReminders, 5 * 60 * 1000)

    return () => {
      clearTimeout(initTimeout)
      clearInterval(interval)
    }
  }, [initialize, checkReminders])
}
