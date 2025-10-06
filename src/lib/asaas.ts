// Configuração do Asaas
const ASAAS_API_URL = import.meta.env.VITE_ASAAS_ENV === 'production'
  ? 'https://api.asaas.com/v3'
  : 'https://sandbox.asaas.com/api/v3'

const ASAAS_API_KEY = import.meta.env.VITE_ASAAS_API_KEY

if (!ASAAS_API_KEY) {
  console.warn('⚠️ ASAAS API KEY não configurada. Configure em .env')
}

// Tipos
export interface AsaasCustomer {
  name: string
  email: string
  cpfCnpj?: string
  phone?: string
}

export interface AsaasPayment {
  customer: string // ID do cliente no Asaas
  billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX' | 'UNDEFINED'
  value: number
  dueDate: string // formato: YYYY-MM-DD
  description?: string
  externalReference?: string
}

export interface AsaasCreditCard {
  holderName: string
  number: string
  expiryMonth: string
  expiryYear: string
  ccv: string
}

// Funções da API

/**
 * Criar cliente no Asaas
 */
export async function createAsaasCustomer(customer: AsaasCustomer) {
  const response = await fetch(`${ASAAS_API_URL}/customers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'access_token': ASAAS_API_KEY || '',
    },
    body: JSON.stringify(customer),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.errors?.[0]?.description || 'Erro ao criar cliente')
  }

  return await response.json()
}

/**
 * Criar cobrança no Asaas
 */
export async function createAsaasPayment(payment: AsaasPayment) {
  const response = await fetch(`${ASAAS_API_URL}/payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'access_token': ASAAS_API_KEY || '',
    },
    body: JSON.stringify(payment),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.errors?.[0]?.description || 'Erro ao criar cobrança')
  }

  return await response.json()
}

/**
 * Criar cobrança com cartão de crédito
 */
export async function createCreditCardPayment(
  payment: AsaasPayment,
  creditCard: AsaasCreditCard,
  creditCardHolderInfo: {
    name: string
    email: string
    cpfCnpj: string
    postalCode: string
    addressNumber: string
    phone: string
  }
) {
  const response = await fetch(`${ASAAS_API_URL}/payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'access_token': ASAAS_API_KEY || '',
    },
    body: JSON.stringify({
      ...payment,
      billingType: 'CREDIT_CARD',
      creditCard: {
        holderName: creditCard.holderName,
        number: creditCard.number.replace(/\s/g, ''),
        expiryMonth: creditCard.expiryMonth,
        expiryYear: creditCard.expiryYear,
        ccv: creditCard.ccv,
      },
      creditCardHolderInfo,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.errors?.[0]?.description || 'Erro ao processar pagamento')
  }

  return await response.json()
}

/**
 * Criar assinatura recorrente (Subscription)
 */
export async function createAsaasSubscription(
  customerId: string,
  value: number,
  cycle: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUALLY' | 'YEARLY',
  description?: string
) {
  const response = await fetch(`${ASAAS_API_URL}/subscriptions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'access_token': ASAAS_API_KEY || '',
    },
    body: JSON.stringify({
      customer: customerId,
      billingType: 'CREDIT_CARD',
      cycle,
      value,
      description,
      nextDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 dias
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.errors?.[0]?.description || 'Erro ao criar assinatura')
  }

  return await response.json()
}

/**
 * Consultar status de pagamento
 */
export async function getPaymentStatus(paymentId: string) {
  const response = await fetch(`${ASAAS_API_URL}/payments/${paymentId}`, {
    headers: {
      'access_token': ASAAS_API_KEY || '',
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.errors?.[0]?.description || 'Erro ao consultar pagamento')
  }

  return await response.json()
}
