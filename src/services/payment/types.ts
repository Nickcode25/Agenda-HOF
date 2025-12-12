/**
 * Tipos compartilhados para servicos de pagamento
 */

// ============================================
// ENUMS E CONSTANTES
// ============================================

export type PaymentProvider = 'stripe'

export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'approved'
  | 'declined'
  | 'cancelled'
  | 'refunded'
  | 'failed'

export type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'cancelled'
  | 'pending_cancellation'
  | 'incomplete'
  | 'incomplete_expired'

// ============================================
// INTERFACES DE DADOS
// ============================================

export interface Customer {
  id?: string
  email: string
  name?: string
  phone?: string
  metadata?: Record<string, string>
}

export interface PaymentMethod {
  id: string
  type: 'card' | 'apple_pay' | 'google_pay' | 'pix' | 'boleto'
  card?: {
    brand: string
    last4: string
    expMonth: number
    expYear: number
  }
}

export interface Price {
  amount: number
  currency: string
  interval?: 'month' | 'year' | 'week' | 'day'
  intervalCount?: number
}

// ============================================
// REQUEST INTERFACES
// ============================================

export interface CreateSubscriptionRequest {
  customer: Customer
  paymentMethodId: string
  price: Price
  planName?: string
  planId?: string
  couponId?: string
  discountPercentage?: number
  trialDays?: number
  metadata?: Record<string, string>
}

export interface CancelSubscriptionRequest {
  subscriptionId: string
  immediately?: boolean
  reason?: string
}

export interface CreatePaymentRequest {
  customer: Customer
  paymentMethodId: string
  amount: number
  currency?: string
  description?: string
  metadata?: Record<string, string>
}

// ============================================
// RESPONSE INTERFACES
// ============================================

export interface SubscriptionResponse {
  success: boolean
  subscriptionId?: string
  customerId?: string
  status?: SubscriptionStatus
  currentPeriodStart?: string
  currentPeriodEnd?: string
  nextBillingDate?: string
  trialEnd?: string
  cancelAtPeriodEnd?: boolean
  cardLastDigits?: string
  cardBrand?: string
  error?: string
  errorCode?: string
  requiresAction?: boolean
  clientSecret?: string
}

export interface PaymentResponse {
  success: boolean
  paymentId?: string
  status?: PaymentStatus
  amount?: number
  currency?: string
  receiptUrl?: string
  error?: string
  errorCode?: string
  requiresAction?: boolean
  clientSecret?: string
}

export interface SubscriptionDetails {
  id: string
  status: SubscriptionStatus
  currentPeriodStart: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
  trialEnd?: string
  price: Price
  paymentMethod?: PaymentMethod
}

// ============================================
// ERROR HANDLING
// ============================================

export interface PaymentError {
  code: string
  message: string
  declineCode?: string
  provider?: PaymentProvider
}

export class PaymentServiceError extends Error {
  code: string
  declineCode?: string
  provider?: PaymentProvider

  constructor(error: PaymentError) {
    super(error.message)
    this.name = 'PaymentServiceError'
    this.code = error.code
    this.declineCode = error.declineCode
    this.provider = error.provider
  }
}

// ============================================
// PROVIDER INTERFACE
// ============================================

/**
 * Interface que todos os providers de pagamento devem implementar
 */
export interface PaymentProviderInterface {
  /** Nome do provider */
  readonly name: PaymentProvider

  /** Cria uma assinatura recorrente */
  createSubscription(request: CreateSubscriptionRequest): Promise<SubscriptionResponse>

  /** Cancela uma assinatura */
  cancelSubscription(request: CancelSubscriptionRequest): Promise<boolean>

  /** Busca detalhes de uma assinatura */
  getSubscription(subscriptionId: string): Promise<SubscriptionDetails>

  /** Processa um pagamento unico */
  createPayment?(request: CreatePaymentRequest): Promise<PaymentResponse>

  /** Busca historico de pagamentos de um cliente */
  getPaymentHistory?(customerEmail: string): Promise<PaymentResponse[]>
}
