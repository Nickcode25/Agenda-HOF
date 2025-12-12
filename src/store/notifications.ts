import { create } from 'zustand'
import { supabase, getCachedUser } from '@/lib/supabase'
import type { Notification, NotificationPreferences, NotificationType, NotificationPriority } from '@/types/notification'
import { createISOFromDateTimeBR, getTodayInSaoPaulo, getCurrentTimeInSaoPaulo } from '@/utils/timezone'

type NotificationsState = {
  notifications: Notification[]
  preferences: NotificationPreferences | null
  loading: boolean
  error: string | null
  unreadCount: number

  // Ações
  fetchNotifications: () => Promise<void>
  fetchPreferences: () => Promise<void>
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (id: string) => Promise<void>
  createNotification: (data: {
    type: NotificationType
    priority: NotificationPriority
    title: string
    message: string
    actionUrl?: string
    relatedId?: string
  }) => Promise<void>
  updatePreferences: (prefs: Partial<NotificationPreferences>) => Promise<void>

  // Helpers para criar notificações específicas
  notifyAppointmentReminder: (appointmentId: string, patientName: string, date: string) => Promise<void>
  notifyLowStock: (itemName: string, quantity: number, minQuantity: number) => Promise<void>
  notifyStockOut: (itemName: string) => Promise<void>

  // Sistema de lembretes automáticos
  checkAndCreateReminders: () => Promise<void>
  checkLowStock: () => Promise<void>
  checkOverduePayments: () => Promise<void>
  checkPlannedProcedures: () => Promise<void>
}

export const useNotifications = create<NotificationsState>((set, get) => ({
  notifications: [],
  preferences: null,
  loading: false,
  error: null,
  unreadCount: 0,

  fetchNotifications: async () => {
    try {
      set({ loading: true, error: null })
      const user = await getCachedUser()
      if (!user) throw new Error('Usuário não autenticado')

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error

      const notifications: Notification[] = (data || []).map(n => ({
        id: n.id,
        userId: n.user_id,
        type: n.type,
        priority: n.priority,
        title: n.title,
        message: n.message,
        isRead: n.is_read,
        actionUrl: n.action_url,
        relatedId: n.related_id,
        createdAt: n.created_at,
        readAt: n.read_at,
      }))

      const unreadCount = notifications.filter(n => !n.isRead).length

      set({ notifications, unreadCount, loading: false })
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },

  fetchPreferences: async () => {
    try {
      const user = await getCachedUser()
      if (!user) throw new Error('Usuário não autenticado')

      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      // Ignora erros de "não encontrado" (PGRST116) ou "não aceitável" (406)
      if (error && error.code !== 'PGRST116') {
        console.warn('⚠️ Erro ao buscar preferências (será ignorado):', error)
        return
      }

      if (data) {
        const preferences: NotificationPreferences = {
          userId: data.user_id,
          emailNotifications: data.email_notifications,
          whatsappNotifications: data.whatsapp_notifications,
          appointmentReminders: data.appointment_reminders,
          appointmentReminderHours: data.appointment_reminder_hours,
          lowStockAlerts: data.low_stock_alerts,
          subscriptionAlerts: data.subscription_alerts,
        }
        set({ preferences })
      }
    } catch (error: any) {
      // Silenciosamente ignora erros de preferências para não poluir o console
      console.warn('⚠️ Não foi possível carregar preferências de notificação')
    }
  },

  markAsRead: async (id: string) => {
    try {
      const nowISO = createISOFromDateTimeBR(getTodayInSaoPaulo(), getCurrentTimeInSaoPaulo())
      const { error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: nowISO
        })
        .eq('id', id)

      if (error) throw error

      set(state => ({
        notifications: state.notifications.map(n =>
          n.id === id ? { ...n, isRead: true, readAt: nowISO } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1)
      }))
    } catch (error: any) {
      console.error('Erro ao marcar notificação como lida:', error)
    }
  },

  markAllAsRead: async () => {
    try {
      const user = await getCachedUser()
      if (!user) throw new Error('Usuário não autenticado')

      const nowISO = createISOFromDateTimeBR(getTodayInSaoPaulo(), getCurrentTimeInSaoPaulo())
      const { error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: nowISO
        })
        .eq('user_id', user.id)
        .eq('is_read', false)

      if (error) throw error

      set(state => ({
        notifications: state.notifications.map(n => ({
          ...n,
          isRead: true,
          readAt: nowISO
        })),
        unreadCount: 0
      }))
    } catch (error: any) {
      console.error('Erro ao marcar todas como lidas:', error)
    }
  },

  deleteNotification: async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id)

      if (error) throw error

      set(state => {
        const notification = state.notifications.find(n => n.id === id)
        return {
          notifications: state.notifications.filter(n => n.id !== id),
          unreadCount: notification && !notification.isRead
            ? Math.max(0, state.unreadCount - 1)
            : state.unreadCount
        }
      })
    } catch (error: any) {
      console.error('Erro ao deletar notificação:', error)
    }
  },

  createNotification: async (data) => {
    try {
      const user = await getCachedUser()
      if (!user) throw new Error('Usuário não autenticado')

      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          type: data.type,
          priority: data.priority,
          title: data.title,
          message: data.message,
          action_url: data.actionUrl,
          related_id: data.relatedId,
          is_read: false,
        })

      if (error) throw error

      // Recarregar notificações
      await get().fetchNotifications()
    } catch (error: any) {
      console.error('Erro ao criar notificação:', error)
    }
  },

  updatePreferences: async (prefs) => {
    try {
      const user = await getCachedUser()
      if (!user) throw new Error('Usuário não autenticado')

      const updateData: any = {}
      if (prefs.emailNotifications !== undefined) updateData.email_notifications = prefs.emailNotifications
      if (prefs.whatsappNotifications !== undefined) updateData.whatsapp_notifications = prefs.whatsappNotifications
      if (prefs.appointmentReminders !== undefined) updateData.appointment_reminders = prefs.appointmentReminders
      if (prefs.appointmentReminderHours !== undefined) updateData.appointment_reminder_hours = prefs.appointmentReminderHours
      if (prefs.lowStockAlerts !== undefined) updateData.low_stock_alerts = prefs.lowStockAlerts
      if (prefs.subscriptionAlerts !== undefined) updateData.subscription_alerts = prefs.subscriptionAlerts

      const { error } = await supabase
        .from('notification_preferences')
        .update(updateData)
        .eq('user_id', user.id)

      if (error) throw error

      set(state => ({
        preferences: state.preferences ? { ...state.preferences, ...prefs } : null
      }))
    } catch (error: any) {
      console.error('Erro ao atualizar preferências:', error)
    }
  },

  // Helpers
  notifyAppointmentReminder: async (appointmentId, patientName, date) => {
    const formattedDate = new Date(date).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })

    await get().createNotification({
      type: 'appointment_reminder',
      priority: 'high',
      title: 'Agendamento Próximo',
      message: `${patientName} tem agendamento em ${formattedDate}`,
      actionUrl: '/app/agenda',
      relatedId: appointmentId
    })
  },

  notifyLowStock: async (itemName, quantity, minQuantity) => {
    await get().createNotification({
      type: 'low_stock',
      priority: 'medium',
      title: 'Estoque Baixo',
      message: `${itemName} está com estoque baixo (${quantity}/${minQuantity})`,
      actionUrl: '/app/estoque',
    })
  },

  notifyStockOut: async (itemName) => {
    await get().createNotification({
      type: 'stock_out',
      priority: 'urgent',
      title: 'Produto Esgotado',
      message: `${itemName} está ESGOTADO! Reponha o estoque urgentemente.`,
      actionUrl: '/app/estoque',
    })
  },

  // Função para verificar e criar lembretes automáticos
  checkAndCreateReminders: async () => {
    console.log('🔔 Verificando lembretes automáticos...')

    try {
      const user = await getCachedUser()
      if (!user) return

      // 1. Verificar estoque baixo
      await get().checkLowStock()

      // 2. Verificar pagamentos atrasados
      await get().checkOverduePayments()

      // 3. Verificar procedimentos planejados não realizados
      await get().checkPlannedProcedures()

    } catch (error) {
      console.error('❌ Erro ao verificar lembretes:', error)
    }
  },

  checkLowStock: async () => {
    try {
      const user = await getCachedUser()
      if (!user) return

      const prefs = get().preferences
      if (!prefs?.lowStockAlerts) return

      // Buscar produtos com estoque baixo
      const { data: items } = await supabase
        .from('stock')
        .select('*')
        .eq('user_id', user.id)
        .lte('quantity', 5) // threshold padrão

      if (items && items.length > 0) {
        for (const item of items) {
          // Verificar se já existe notificação recente para este item
          const { data: existingNotif } = await supabase
            .from('notifications')
            .select('id')
            .eq('user_id', user.id)
            .eq('type', 'low_stock')
            .eq('related_id', item.id)
            .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // últimas 24h
            .single()

          if (!existingNotif) {
            await get().notifyLowStock(item.name, item.quantity, item.min_quantity || 5)
          }
        }
      }
    } catch (error) {
      console.error('Erro ao verificar estoque baixo:', error)
    }
  },

  checkOverduePayments: async () => {
    try {
      const user = await getCachedUser()
      if (!user) return

      // Buscar vendas com pagamento pendente e vencidas
      const { data: sales } = await supabase
        .from('sales')
        .select('*')
        .eq('user_id', user.id)
        .eq('payment_status', 'pending')
        .not('due_date', 'is', null)
        .lt('due_date', new Date().toISOString())

      if (sales && sales.length > 0) {
        for (const sale of sales) {
          // Verificar se já existe notificação recente
          const { data: existingNotif } = await supabase
            .from('notifications')
            .select('id')
            .eq('user_id', user.id)
            .eq('type', 'payment_overdue')
            .eq('related_id', sale.id)
            .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
            .single()

          if (!existingNotif) {
            const daysOverdue = Math.floor(
              (Date.now() - new Date(sale.due_date).getTime()) / (1000 * 60 * 60 * 24)
            )

            const totalAmount = sale.total_amount ?? 0
            await get().createNotification({
              type: 'payment_overdue',
              priority: daysOverdue > 7 ? 'urgent' : 'high',
              title: 'Pagamento Atrasado',
              message: `Venda para ${sale.professional_name || 'Profissional'} está ${daysOverdue} dias atrasada (R$ ${totalAmount.toFixed(2)})`,
              actionUrl: '/app/vendas',
              relatedId: sale.id
            })
          }
        }
      }
    } catch (error) {
      console.error('Erro ao verificar pagamentos atrasados:', error)
    }
  },

  checkPlannedProcedures: async () => {
    try {
      const user = await getCachedUser()
      if (!user) return

      // Buscar pacientes com procedimentos planejados não realizados há mais de 7 dias
      const { data: patients } = await supabase
        .from('patients')
        .select('*')
        .eq('user_id', user.id)

      if (patients) {
        for (const patient of patients) {
          // Garantir que planned_procedures é sempre um array
          let plannedProcs = patient.planned_procedures
          if (typeof plannedProcs === 'string') {
            try {
              plannedProcs = JSON.parse(plannedProcs)
            } catch {
              plannedProcs = []
            }
          }
          if (!Array.isArray(plannedProcs)) {
            plannedProcs = []
          }
          const pendingProcs = plannedProcs.filter((p: any) => p.status === 'pending')

          for (const proc of pendingProcs) {
            const daysSincePlanned = Math.floor(
              (Date.now() - new Date(proc.createdAt).getTime()) / (1000 * 60 * 60 * 24)
            )

            if (daysSincePlanned >= 7) {
              // Verificar se já existe notificação recente
              const { data: existingNotif } = await supabase
                .from('notifications')
                .select('id')
                .eq('user_id', user.id)
                .eq('type', 'planned_procedure')
                .eq('related_id', proc.id)
                .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
                .single()

              if (!existingNotif) {
                await get().createNotification({
                  type: 'planned_procedure',
                  priority: 'medium',
                  title: 'Procedimento Planejado Pendente',
                  message: `${patient.name} tem procedimento "${proc.procedureName}" planejado há ${daysSincePlanned} dias`,
                  actionUrl: `/app/pacientes/${patient.id}`,
                  relatedId: proc.id
                })
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Erro ao verificar procedimentos planejados:', error)
    }
  },
}))
