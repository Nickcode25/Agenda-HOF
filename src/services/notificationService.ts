import { supabase } from '@/lib/supabase'
import { useNotifications } from '@/store/notifications'

/**
 * Verifica agendamentos nas próximas X horas e cria notificações
 */
export async function checkUpcomingAppointments() {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Buscar preferências
    const { data: prefs } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!prefs || !prefs.appointment_reminders) return

    const hoursAhead = prefs.appointment_reminder_hours || 24
    const now = new Date()
    const futureTime = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000)

    // Buscar agendamentos futuros
    const { data: appointments } = await supabase
      .from('appointments')
      .select('*')
      .eq('user_id', user.id)
      .gte('start', now.toISOString())
      .lte('start', futureTime.toISOString())
      .eq('status', 'scheduled')

    if (!appointments || appointments.length === 0) return

    // Verificar quais já têm notificação criada
    const appointmentIds = appointments.map(a => a.id)
    const { data: existingNotifications } = await supabase
      .from('notifications')
      .select('related_id')
      .eq('user_id', user.id)
      .eq('type', 'appointment_reminder')
      .in('related_id', appointmentIds)

    const notifiedIds = new Set(existingNotifications?.map(n => n.related_id) || [])

    // Criar notificações para agendamentos sem notificação
    const { notifyAppointmentReminder } = useNotifications.getState()

    for (const appointment of appointments) {
      if (!notifiedIds.has(appointment.id)) {
        await notifyAppointmentReminder(
          appointment.id,
          appointment.patient_name,
          appointment.start
        )
      }
    }
  } catch (error) {
    console.error('Erro ao verificar agendamentos:', error)
  }
}

/**
 * Verifica produtos com estoque baixo e cria alertas
 */
export async function checkLowStock() {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Buscar preferências
    const { data: prefs } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!prefs || !prefs.low_stock_alerts) return

    // Buscar produtos com estoque baixo
    const { data: stockItems } = await supabase
      .from('stock_items')
      .select('*')
      .eq('user_id', user.id)
      .or('quantity.lte.min_quantity,quantity.eq.0')

    if (!stockItems || stockItems.length === 0) return

    // Verificar quais já têm alerta criado (nas últimas 24h)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { data: recentAlerts } = await supabase
      .from('notifications')
      .select('message')
      .eq('user_id', user.id)
      .in('type', ['low_stock', 'stock_out'])
      .gte('created_at', oneDayAgo)

    const recentAlertMessages = new Set(recentAlerts?.map(n => n.message) || [])

    const { notifyLowStock, notifyStockOut } = useNotifications.getState()

    for (const item of stockItems) {
      const message = item.quantity === 0
        ? `${item.name} está ESGOTADO! Reponha o estoque urgentemente.`
        : `${item.name} está com estoque baixo (${item.quantity}/${item.min_quantity})`

      // Só notificar se não houver alerta recente
      if (!recentAlertMessages.has(message)) {
        if (item.quantity === 0) {
          await notifyStockOut(item.name)
        } else {
          await notifyLowStock(item.name, item.quantity, item.min_quantity)
        }
      }
    }
  } catch (error) {
    console.error('Erro ao verificar estoque:', error)
  }
}

/**
 * Inicia verificação periódica de notificações
 */
export function startNotificationPolling() {
  // Executar imediatamente
  checkUpcomingAppointments()
  checkLowStock()

  // Verificar a cada 30 minutos
  const interval = setInterval(() => {
    checkUpcomingAppointments()
    checkLowStock()
  }, 30 * 60 * 1000)

  return () => clearInterval(interval)
}
