export type NotificationType =
  | 'low_stock'
  | 'payment_overdue'
  | 'planned_procedure'
  | 'appointment_reminder'
  | 'monthly_subscription_due'

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  priority: NotificationPriority
  title: string
  message: string
  read: boolean
  actionUrl?: string
  referenceId?: string // ID do item relacionado (produto, venda, procedimento, etc)
  metadata?: Record<string, any>
  createdAt: string
  readAt?: string
}

export interface NotificationSettings {
  id: string
  userId: string

  // Estoque
  lowStockEnabled: boolean
  lowStockThreshold: number

  // Pagamentos
  paymentOverdueEnabled: boolean
  paymentOverdueDays: number

  // Procedimentos Planejados
  plannedProcedureEnabled: boolean
  plannedProcedureDays: number

  // Mensalidades
  monthlySubscriptionEnabled: boolean
  monthlySubscriptionDaysBefore: number

  // WhatsApp/SMS (para implementação futura)
  whatsappEnabled: boolean
  smsEnabled: boolean

  createdAt: string
  updatedAt: string
}

export interface NotificationCreate {
  userId: string
  type: NotificationType
  priority: NotificationPriority
  title: string
  message: string
  actionUrl?: string
  referenceId?: string
  metadata?: Record<string, any>
}
