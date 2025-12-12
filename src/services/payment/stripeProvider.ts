/**
 * Implementacao do Stripe como provider de pagamento
 */

import {
  PaymentProviderInterface,
  CreateSubscriptionRequest,
  CancelSubscriptionRequest,
  SubscriptionResponse,
  SubscriptionDetails,
  PaymentServiceError
} from './types'
import { paymentLogger } from '@/utils/logger'
import { API_TIMEOUT_MS } from '@/constants'

// URL do backend
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'

// Mapeamento de erros do Stripe para mensagens em portugues
const STRIPE_ERROR_MESSAGES: Record<string, string> = {
  card_declined: 'Cartao recusado. Tente outro cartao.',
  expired_card: 'Cartao expirado. Verifique a data de validade.',
  incorrect_cvc: 'CVV incorreto. Verifique o codigo de seguranca.',
  incorrect_number: 'Numero do cartao incorreto.',
  invalid_cvc: 'CVV invalido.',
  invalid_expiry_month: 'Mes de validade invalido.',
  invalid_expiry_year: 'Ano de validade invalido.',
  invalid_number: 'Numero do cartao invalido.',
  processing_error: 'Erro ao processar. Tente novamente.',
  insufficient_funds: 'Saldo insuficiente.',
  lost_card: 'Cartao reportado como perdido.',
  stolen_card: 'Cartao reportado como roubado.',
  generic_decline: 'Cartao recusado. Entre em contato com seu banco.',
  rate_limit: 'Muitas tentativas. Aguarde alguns minutos.'
}

/**
 * Traduz codigo de erro do Stripe para mensagem amigavel
 */
function getErrorMessage(code?: string): string {
  if (!code) return 'Erro ao processar pagamento. Tente novamente.'
  return STRIPE_ERROR_MESSAGES[code] || 'Erro ao processar pagamento. Tente novamente.'
}

/**
 * Faz requisicao ao backend com timeout e tratamento de erros
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout: number = API_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    })
    return response
  } finally {
    clearTimeout(timeoutId)
  }
}

/**
 * Provider de pagamento Stripe
 */
export const stripeProvider: PaymentProviderInterface = {
  name: 'stripe',

  async createSubscription(request: CreateSubscriptionRequest): Promise<SubscriptionResponse> {
    const logger = paymentLogger.child('stripe:createSubscription')

    try {
      logger.info('Criando assinatura', {
        email: request.customer.email,
        amount: request.price.amount
      })

      const response = await fetchWithTimeout(
        `${BACKEND_URL}/api/stripe/create-subscription`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerEmail: request.customer.email,
            customerName: request.customer.name,
            customerId: request.customer.id,
            paymentMethodId: request.paymentMethodId,
            amount: request.price.amount,
            planName: request.planName,
            planId: request.planId,
            couponId: request.couponId,
            discountPercentage: request.discountPercentage
          })
        }
      )

      const result = await response.json()

      if (!response.ok || !result.success) {
        logger.warn('Erro na assinatura', { error: result.error, code: result.code })
        return {
          success: false,
          error: result.error || getErrorMessage(result.code),
          errorCode: result.code,
          requiresAction: result.requiresAction,
          clientSecret: result.clientSecret
        }
      }

      logger.info('Assinatura criada com sucesso', { subscriptionId: result.subscriptionId })

      return {
        success: true,
        subscriptionId: result.subscriptionId,
        customerId: result.customerId,
        status: result.status,
        nextBillingDate: result.nextBillingDate,
        cardLastDigits: result.cardLastDigits,
        cardBrand: result.cardBrand
      }
    } catch (error) {
      logger.error('Erro ao criar assinatura', error)

      if (error instanceof Error && error.name === 'AbortError') {
        return {
          success: false,
          error: 'Tempo esgotado. Verifique sua conexao e tente novamente.'
        }
      }

      return {
        success: false,
        error: 'Erro ao criar assinatura. Tente novamente.'
      }
    }
  },

  async cancelSubscription(request: CancelSubscriptionRequest): Promise<boolean> {
    const logger = paymentLogger.child('stripe:cancelSubscription')

    try {
      logger.info('Cancelando assinatura', {
        subscriptionId: request.subscriptionId,
        immediately: request.immediately
      })

      const response = await fetchWithTimeout(
        `${BACKEND_URL}/api/stripe/cancel-subscription`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subscriptionId: request.subscriptionId,
            immediately: request.immediately
          })
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new PaymentServiceError({
          code: errorData.code || 'cancel_failed',
          message: errorData.error || 'Erro ao cancelar assinatura',
          provider: 'stripe'
        })
      }

      logger.info('Assinatura cancelada com sucesso')
      return true
    } catch (error) {
      logger.error('Erro ao cancelar assinatura', error)

      if (error instanceof PaymentServiceError) {
        throw error
      }

      throw new PaymentServiceError({
        code: 'cancel_failed',
        message: 'Erro ao cancelar assinatura. Tente novamente.',
        provider: 'stripe'
      })
    }
  },

  async getSubscription(subscriptionId: string): Promise<SubscriptionDetails> {
    const logger = paymentLogger.child('stripe:getSubscription')

    try {
      logger.debug('Buscando assinatura', { subscriptionId })

      const response = await fetchWithTimeout(
        `${BACKEND_URL}/api/stripe/subscription/${subscriptionId}`,
        { method: 'GET' }
      )

      if (!response.ok) {
        throw new PaymentServiceError({
          code: 'subscription_not_found',
          message: 'Assinatura nao encontrada',
          provider: 'stripe'
        })
      }

      const data = await response.json()

      return {
        id: data.id,
        status: data.status,
        currentPeriodStart: data.currentPeriodStart,
        currentPeriodEnd: data.currentPeriodEnd,
        cancelAtPeriodEnd: data.cancelAtPeriodEnd,
        trialEnd: data.trialEnd,
        price: {
          amount: data.amount,
          currency: data.currency || 'brl',
          interval: 'month'
        },
        paymentMethod: data.cardLast4 ? {
          id: '',
          type: 'card',
          card: {
            brand: data.cardBrand || 'unknown',
            last4: data.cardLast4,
            expMonth: 0,
            expYear: 0
          }
        } : undefined
      }
    } catch (error) {
      logger.error('Erro ao buscar assinatura', error)

      if (error instanceof PaymentServiceError) {
        throw error
      }

      throw new PaymentServiceError({
        code: 'fetch_failed',
        message: 'Erro ao buscar assinatura',
        provider: 'stripe'
      })
    }
  }
}
