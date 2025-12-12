/**
 * Servico de Pagamento Centralizado
 *
 * Abstrai a comunicacao com providers de pagamento (Stripe)
 * Permite trocar de provider sem alterar codigo da aplicacao
 */

import { stripeProvider } from './stripeProvider'
import {
  PaymentProviderInterface,
  PaymentProvider,
  CreateSubscriptionRequest,
  CancelSubscriptionRequest,
  SubscriptionResponse,
  SubscriptionDetails,
  PaymentServiceError
} from './types'
import { paymentLogger } from '@/utils/logger'

// Re-exportar tipos
export * from './types'

// ============================================
// CONFIGURACAO
// ============================================

/** Provider ativo (pode ser configurado via env) */
const ACTIVE_PROVIDER: PaymentProvider = 'stripe'

/** Mapa de providers disponiveis */
const providers: Record<PaymentProvider, PaymentProviderInterface> = {
  stripe: stripeProvider
}

/**
 * Retorna o provider ativo
 */
function getProvider(): PaymentProviderInterface {
  const provider = providers[ACTIVE_PROVIDER]

  if (!provider) {
    throw new PaymentServiceError({
      code: 'provider_not_found',
      message: `Provider de pagamento '${ACTIVE_PROVIDER}' nao encontrado`
    })
  }

  return provider
}

// ============================================
// SERVICO DE PAGAMENTO
// ============================================

/**
 * Servico centralizado de pagamento
 *
 * Uso:
 * import { paymentService } from '@/services/payment'
 *
 * const result = await paymentService.createSubscription({
 *   customer: { email: 'user@example.com', name: 'User' },
 *   paymentMethodId: 'pm_xxx',
 *   price: { amount: 99.90, currency: 'brl', interval: 'month' }
 * })
 */
export const paymentService = {
  /**
   * Retorna o nome do provider ativo
   */
  getProviderName(): PaymentProvider {
    return ACTIVE_PROVIDER
  },

  /**
   * Cria uma assinatura recorrente
   */
  async createSubscription(request: CreateSubscriptionRequest): Promise<SubscriptionResponse> {
    paymentLogger.info('Criando assinatura via', ACTIVE_PROVIDER)
    return getProvider().createSubscription(request)
  },

  /**
   * Cancela uma assinatura
   *
   * @param subscriptionId - ID da assinatura
   * @param immediately - Se true, cancela imediatamente. Se false, cancela no fim do periodo
   */
  async cancelSubscription(
    subscriptionId: string,
    immediately: boolean = false
  ): Promise<boolean> {
    paymentLogger.info('Cancelando assinatura', { subscriptionId, immediately })
    return getProvider().cancelSubscription({ subscriptionId, immediately })
  },

  /**
   * Busca detalhes de uma assinatura
   */
  async getSubscription(subscriptionId: string): Promise<SubscriptionDetails> {
    paymentLogger.debug('Buscando assinatura', { subscriptionId })
    return getProvider().getSubscription(subscriptionId)
  },

  /**
   * Verifica se uma assinatura esta ativa
   */
  async isSubscriptionActive(subscriptionId: string): Promise<boolean> {
    try {
      const subscription = await this.getSubscription(subscriptionId)
      return ['active', 'trialing'].includes(subscription.status)
    } catch {
      return false
    }
  }
}

// ============================================
// HELPERS
// ============================================

/**
 * Formata valor monetario para exibicao
 */
export function formatCurrency(amount: number, currency: string = 'BRL'): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: currency.toUpperCase()
  }).format(amount)
}

/**
 * Calcula valor com desconto
 */
export function calculateDiscountedPrice(
  originalPrice: number,
  discountPercentage: number
): number {
  if (discountPercentage <= 0 || discountPercentage > 100) {
    return originalPrice
  }
  return Number((originalPrice * (1 - discountPercentage / 100)).toFixed(2))
}

/**
 * Valida se o valor do pagamento e valido
 */
export function isValidPaymentAmount(amount: number): boolean {
  return amount > 0 && amount <= 999999.99 && Number.isFinite(amount)
}

export default paymentService
