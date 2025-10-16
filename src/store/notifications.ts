import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { Notification, NotificationPreferences, NotificationType, NotificationPriority } from '@/types/notification'

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
      const { data: { user } } = await supabase.auth.getUser()
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
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') throw error

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
      console.error('Erro ao buscar preferências:', error)
    }
  },

  markAsRead: async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) throw error

      set(state => ({
        notifications: state.notifications.map(n =>
          n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1)
      }))
    } catch (error: any) {
      console.error('Erro ao marcar notificação como lida:', error)
    }
  },

  markAllAsRead: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const { error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('is_read', false)

      if (error) throw error

      set(state => ({
        notifications: state.notifications.map(n => ({
          ...n,
          isRead: true,
          readAt: new Date().toISOString()
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
      const { data: { user } } = await supabase.auth.getUser()
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
      const { data: { user } } = await supabase.auth.getUser()
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
}))
