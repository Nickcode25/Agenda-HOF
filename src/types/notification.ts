export type NotificationType =
  | 'appointment_reminder' // Lembrete de agendamento próximo
  | 'low_stock' // Estoque baixo
  | 'stock_out' // Produto esgotado
  | 'appointment_confirmed' // Agendamento confirmado
  | 'appointment_cancelled' // Agendamento cancelado
  | 'subscription_due' // Mensalidade a vencer
  | 'subscription_overdue' // Mensalidade vencida
  | 'payment_overdue' // Pagamento atrasado
  | 'planned_procedure' // Procedimento planejado não realizado

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  priority: NotificationPriority
  title: string
  message: string
  isRead: boolean
  actionUrl?: string // URL para navegar ao clicar
  relatedId?: string // ID do item relacionado (agendamento, produto, etc)
  createdAt: string
  readAt?: string
}

export interface NotificationPreferences {
  userId: string
  emailNotifications: boolean
  whatsappNotifications: boolean
  appointmentReminders: boolean
  appointmentReminderHours: number // Horas antes do agendamento
  lowStockAlerts: boolean
  subscriptionAlerts: boolean
}

// Dados para criar lembretes de agendamento
export interface AppointmentReminderData {
  appointmentId: string
  patientName: string
  patientPhone?: string
  appointmentDate: string
  procedureName: string
}

// Dados para alertas de estoque
export interface StockAlertData {
  stockItemId: string
  stockItemName: string
  currentQuantity: number
  minQuantity: number
}
