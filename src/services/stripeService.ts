import { PLAN_PRICE, PLAN_NAME } from '@/lib/stripe'

export interface CreateSubscriptionData {
  customerEmail: string
  customerName: string
  customerId?: string
  paymentMethodId: string  // ID do PaymentMethod criado via Stripe.js
  amount?: number
  planName?: string
  planId?: string
  couponId?: string
  discountPercentage?: number
}

export interface SubscriptionResponse {
  success: boolean
  subscriptionId?: string
  customerId?: string
  status?: string
  nextBillingDate?: string
  cardLastDigits?: string
  cardBrand?: string
  error?: string
  requiresAction?: boolean
  clientSecret?: string
}

// URL do backend
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'

/**
 * Cria assinatura recorrente com Stripe (usando paymentMethodId)
 */
export async function createSubscription(data: CreateSubscriptionData): Promise<SubscriptionResponse> {
  try {
    const finalAmount = data.amount || PLAN_PRICE

    console.log('💰 Criando assinatura Stripe com valor:', finalAmount)
    if (data.amount && data.amount < PLAN_PRICE) {
      const discount = ((1 - data.amount / PLAN_PRICE) * 100).toFixed(0)
      console.log('🎟️ Cupom aplicado! Desconto de', discount + '%')
    }

    const response = await fetch(`${BACKEND_URL}/api/stripe/create-subscription`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerEmail: data.customerEmail,
        customerName: data.customerName,
        customerId: data.customerId,
        paymentMethodId: data.paymentMethodId,
        amount: finalAmount,
        planName: data.planName || PLAN_NAME,
        planId: data.planId,
        couponId: data.couponId,
        discountPercentage: data.discountPercentage
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Erro ao criar assinatura. Verifique os dados e tente novamente.'
      }
    }

    return result
  } catch (error: any) {
    console.error('Erro ao criar assinatura:', error)
    return {
      success: false,
      error: error.message || 'Erro ao criar assinatura. Tente novamente.'
    }
  }
}

/**
 * Cancela assinatura Stripe
 */
export async function cancelSubscription(subscriptionId: string, immediately: boolean = false): Promise<boolean> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/stripe/cancel-subscription`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscriptionId, immediately })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Erro ao cancelar assinatura')
    }

    return true
  } catch (error: any) {
    console.error('Erro ao cancelar assinatura:', error)
    throw new Error(error.message || 'Erro ao cancelar assinatura')
  }
}

/**
 * Busca detalhes de uma assinatura Stripe
 */
export async function getSubscription(subscriptionId: string): Promise<any> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/stripe/subscription/${subscriptionId}`)

    if (!response.ok) {
      throw new Error('Erro ao buscar assinatura')
    }

    return await response.json()
  } catch (error: any) {
    console.error('Erro ao buscar assinatura:', error)
    throw new Error(error.message || 'Erro ao buscar assinatura')
  }
}
