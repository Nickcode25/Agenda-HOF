export type SubscriptionPlan = {
  id: string
  name: string
  description: string
  price: number
  sessionsPerYear: number
  benefits: string[]
  active: boolean
  createdAt: string
}

export type SubscriptionPaymentStatus = 'pending' | 'paid' | 'overdue' | 'cancelled'

export type SubscriptionPayment = {
  id: string
  subscriptionId: string
  amount: number
  dueDate: string
  paidAt?: string
  status: SubscriptionPaymentStatus
  paymentMethod?: string
}

export type Subscription = {
  id: string
  patientId: string
  patientName: string
  planId: string
  planName: string
  price: number
  startDate: string
  nextBillingDate: string
  status: 'active' | 'cancelled' | 'suspended'
  payments: SubscriptionPayment[]
}
