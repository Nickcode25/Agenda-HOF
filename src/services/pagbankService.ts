import { PLAN_PRICE, PLAN_NAME } from '@/lib/pagbank'

export interface CreatePixOrderData {
  customerEmail: string
  customerName: string
  customerPhone?: string
}

export interface CreateCardOrderData {
  customerEmail: string
  customerName: string
  customerPhone?: string
  cardNumber: string
  cardHolderName: string
  cardExpiryMonth: string
  cardExpiryYear: string
  cardCvv: string
  cardHolderCpf: string
}

export interface CreateBoletoOrderData {
  customerEmail: string
  customerName: string
  customerPhone?: string
  customerCpf: string
}

export interface PixResponse {
  id: string
  qrCodeText: string
  qrCodeImage: string
  expiresAt: string
}

export interface CardResponse {
  id: string
  status: string
  amount: number
}

export interface SubscriptionResponse {
  id: string
  planId: string
  status: string
  amount: number
  nextBillingDate: string
  cardLastDigits: string
  cardBrand: string
}

export interface BoletoResponse {
  id: string
  boletoUrl: string
  barcode: string
  dueDate: string
}

// URL do backend - Altere para seu domínio em produção
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'

/**
 * Cria um pedido PIX via backend
 */
export async function createPixOrder(data: CreatePixOrderData): Promise<PixResponse> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/pagbank/create-pix`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerEmail: data.customerEmail,
        customerName: data.customerName,
        amount: PLAN_PRICE,
        planName: PLAN_NAME,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()

      // Mensagens amigáveis para erros específicos
      if (response.status === 401 || response.status === 403) {
        throw new Error('Token do PagBank inválido ou expirado. Entre em contato com o suporte.')
      }

      throw new Error(errorData.error || 'Erro ao criar pedido PIX. Tente novamente.')
    }

    return await response.json()
  } catch (error: any) {
    console.error('Erro ao criar PIX:', error)
    throw new Error(error.message || 'Erro ao criar pedido PIX. Tente novamente.')
  }
}

/**
 * Processa pagamento com cartão via backend
 */
export async function createCardOrder(data: CreateCardOrderData): Promise<CardResponse> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/pagbank/create-card-charge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerEmail: data.customerEmail,
        customerName: data.customerName,
        cardNumber: data.cardNumber,
        cardHolderName: data.cardHolderName,
        cardExpiryMonth: data.cardExpiryMonth,
        cardExpiryYear: data.cardExpiryYear,
        cardCvv: data.cardCvv,
        cardHolderCpf: data.cardHolderCpf,
        amount: PLAN_PRICE,
        planName: PLAN_NAME,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()

      // Mensagens amigáveis para erros específicos
      if (response.status === 401 || response.status === 403) {
        throw new Error('Token do PagBank inválido ou expirado. Entre em contato com o suporte.')
      }

      throw new Error(errorData.error || 'Erro ao processar cartão. Verifique os dados e tente novamente.')
    }

    return await response.json()
  } catch (error: any) {
    console.error('Erro ao processar cartão:', error)
    throw new Error(error.message || 'Erro ao processar cartão. Tente novamente.')
  }
}

/**
 * Gera boleto via backend
 */
export async function createBoletoOrder(data: CreateBoletoOrderData): Promise<BoletoResponse> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/pagbank/create-boleto`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerEmail: data.customerEmail,
        customerName: data.customerName,
        customerCpf: data.customerCpf,
        amount: PLAN_PRICE,
        planName: PLAN_NAME,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()

      // Mensagens amigáveis para erros específicos
      if (response.status === 401 || response.status === 403) {
        throw new Error('Token do PagBank inválido ou expirado. Entre em contato com o suporte.')
      }

      throw new Error(errorData.error || 'Erro ao gerar boleto. Tente novamente.')
    }

    return await response.json()
  } catch (error: any) {
    console.error('Erro ao gerar boleto:', error)
    throw new Error(error.message || 'Erro ao gerar boleto. Tente novamente.')
  }
}

/**
 * Verifica status de pagamento via backend
 */
export async function checkPaymentStatus(orderId: string): Promise<string> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/pagbank/check-status/${orderId}`)

    if (!response.ok) {
      throw new Error('Erro ao verificar status')
    }

    const data = await response.json()
    return data.status
  } catch (error: any) {
    console.error('Erro ao verificar status:', error)
    throw new Error(error.message || 'Erro ao verificar status')
  }
}

/**
 * Cria assinatura recorrente (cobrança automática mensal)
 */
export async function createSubscription(data: CreateCardOrderData): Promise<SubscriptionResponse> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/pagbank/create-subscription`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerEmail: data.customerEmail,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        cardNumber: data.cardNumber,
        cardHolderName: data.cardHolderName,
        cardExpiryMonth: data.cardExpiryMonth,
        cardExpiryYear: data.cardExpiryYear,
        cardCvv: data.cardCvv,
        cardHolderCpf: data.cardHolderCpf,
        amount: PLAN_PRICE,
        planName: PLAN_NAME,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()

      // Mensagens amigáveis para erros específicos
      if (response.status === 401 || response.status === 403) {
        throw new Error('Token do PagBank inválido ou expirado. Entre em contato com o suporte.')
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
    const response = await fetch(`${BACKEND_URL}/api/pagbank/cancel-subscription/${subscriptionId}`, {
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
