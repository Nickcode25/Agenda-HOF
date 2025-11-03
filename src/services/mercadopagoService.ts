import { PLAN_PRICE, PLAN_NAME } from '@/lib/mercadopago'

export interface CreateSubscriptionData {
  customerEmail: string
  customerName: string
  customerPhone?: string
  customerCpf: string
  cardToken: string
  amount?: number // Valor da assinatura (com desconto, se houver cupom)
}

export interface SubscriptionResponse {
  id: string
  status: string
  amount: number
  nextBillingDate: string
  cardLastDigits: string
  cardBrand: string
}

// URL do backend - Altere para seu domínio em produção
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'

/**
 * Cria assinatura recorrente (cobrança automática mensal)
 */
export async function createSubscription(data: CreateSubscriptionData): Promise<SubscriptionResponse> {
  try {
    // Usar amount fornecido (com desconto) ou PLAN_PRICE padrão
    const finalAmount = data.amount || PLAN_PRICE

    console.log('💰 Criando assinatura com valor:', finalAmount)
    if (data.amount && data.amount < PLAN_PRICE) {
      const discount = ((1 - data.amount / PLAN_PRICE) * 100).toFixed(0)
      console.log('🎟️ Cupom aplicado! Desconto de', discount + '%')
    }

    const response = await fetch(`${BACKEND_URL}/api/mercadopago/create-subscription`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerEmail: data.customerEmail,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerCpf: data.customerCpf,
        cardToken: data.cardToken,
        amount: finalAmount,
        planName: PLAN_NAME,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()

      // Mensagens amigáveis para erros específicos
      if (response.status === 401 || response.status === 403) {
        throw new Error('Token do Mercado Pago inválido ou expirado. Entre em contato com o suporte.')
      }

      throw new Error(errorData.error || 'Erro ao criar assinatura. Verifique os dados e tente novamente.')
    }

    return await response.json()
  } catch (error: any) {
    console.error('Erro ao criar assinatura:', error)
    throw new Error(error.message || 'Erro ao criar assinatura. Tente novamente.')
  }
}

/**
 * Cancela assinatura recorrente
 */
export async function cancelSubscription(subscriptionId: string): Promise<boolean> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/mercadopago/cancel-subscription/${subscriptionId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
 * Busca detalhes de uma assinatura
 */
export async function getSubscription(subscriptionId: string): Promise<SubscriptionResponse> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/mercadopago/subscription/${subscriptionId}`)

    if (!response.ok) {
      throw new Error('Erro ao buscar assinatura')
    }

    return await response.json()
  } catch (error: any) {
    console.error('Erro ao buscar assinatura:', error)
    throw new Error(error.message || 'Erro ao buscar assinatura')
  }
}
