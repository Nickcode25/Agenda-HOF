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

export interface BoletoResponse {
  id: string
  boletoUrl: string
  barcode: string
  dueDate: string
}

/**
 * IMPORTANTE: Esta é uma versão simulada para desenvolvimento.
 *
 * Para produção, você precisa criar um backend (Node.js/Express, Python/Flask, etc.)
 * que faça as chamadas à API do PagBank de forma segura.
 *
 * O navegador não pode fazer chamadas diretas à API do PagBank por questões de CORS e segurança.
 */

const IS_DEV_MODE = import.meta.env.DEV

/**
 * Simula criação de pedido PIX (DESENVOLVIMENTO)
 * Em produção, isso deve ser feito no backend
 */
export async function createPixOrder(data: CreatePixOrderData): Promise<PixResponse> {
  // Simular delay de rede
  await new Promise(resolve => setTimeout(resolve, 1500))

  if (IS_DEV_MODE) {
    // Modo de desenvolvimento - Simula resposta do PagBank
    return {
      id: `PIX_${Date.now()}`,
      qrCodeText: '00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-426655440000520400005303986540510.005802BR5913AGENDA HOF6009SAO PAULO62070503***63041D3D',
      qrCodeImage: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=' + encodeURIComponent('00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-426655440000520400005303986540510.005802BR5913AGENDA HOF6009SAO PAULO62070503***63041D3D'),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    }
  }

  // Em produção, fazer chamada ao SEU backend
  const response = await fetch('/api/pagbank/create-pix', {
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
    throw new Error('Erro ao criar pedido PIX')
  }

  return await response.json()
}

/**
 * Simula pagamento com cartão (DESENVOLVIMENTO)
 * Em produção, isso deve ser feito no backend
 */
export async function createCardOrder(data: CreateCardOrderData): Promise<CardResponse> {
  // Simular delay de processamento
  await new Promise(resolve => setTimeout(resolve, 2000))

  if (IS_DEV_MODE) {
    // Validar cartão de teste
    const cardNumber = data.cardNumber.replace(/\s/g, '')

    // Cartões de teste do PagBank
    const approvedCards = [
      '4111111111111111', // Visa
      '5555555555555557', // Mastercard
      '378282246310005',  // Amex
    ]

    const isApproved = approvedCards.includes(cardNumber)

    if (!isApproved) {
      throw new Error('Cartão recusado. Use um cartão de teste válido.')
    }

    // Simula resposta de sucesso
    return {
      id: `CARD_${Date.now()}`,
      status: 'PAID',
      amount: PLAN_PRICE,
    }
  }

  // Em produção, fazer chamada ao SEU backend
  const response = await fetch('/api/pagbank/create-card-charge', {
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
    throw new Error('Erro ao processar cartão')
  }

  return await response.json()
}

/**
 * Simula geração de boleto (DESENVOLVIMENTO)
 * Em produção, isso deve ser feito no backend
 */
export async function createBoletoOrder(data: CreateBoletoOrderData): Promise<BoletoResponse> {
  // Simular delay de geração
  await new Promise(resolve => setTimeout(resolve, 1500))

  if (IS_DEV_MODE) {
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 3)

    // Simula resposta do PagBank
    return {
      id: `BOLETO_${Date.now()}`,
      boletoUrl: 'https://sandbox.pagseguro.uol.com.br/checkout/payment/booklet/print.jhtml?c=example',
      barcode: '23793381286000001234567890123456789012',
      dueDate: dueDate.toISOString().split('T')[0],
    }
  }

  // Em produção, fazer chamada ao SEU backend
  const response = await fetch('/api/pagbank/create-boleto', {
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
    throw new Error('Erro ao gerar boleto')
  }

  return await response.json()
}

/**
 * Verifica o status de um pagamento
 * Em produção, isso deve ser feito no backend
 */
export async function checkPaymentStatus(orderId: string): Promise<string> {
  if (IS_DEV_MODE) {
    // Simula status
    return 'PAID'
  }

  const response = await fetch(`/api/pagbank/check-status/${orderId}`)

  if (!response.ok) {
    throw new Error('Erro ao verificar status')
  }

  const data = await response.json()
  return data.status
}

/**
 * INSTRUÇÕES PARA PRODUÇÃO:
 *
 * 1. Crie um backend (Node.js, Python, PHP, etc.)
 * 2. No backend, faça as chamadas à API do PagBank usando seu token
 * 3. Crie endpoints como:
 *    - POST /api/pagbank/create-pix
 *    - POST /api/pagbank/create-card-charge
 *    - POST /api/pagbank/create-boleto
 *    - GET  /api/pagbank/check-status/:orderId
 *
 * 4. Configure CORS no backend para aceitar requisições do seu frontend
 * 5. Nunca exponha o token do PagBank no frontend
 *
 * Exemplo de endpoint Node.js/Express:
 *
 * ```javascript
 * app.post('/api/pagbank/create-pix', async (req, res) => {
 *   const { customerEmail, customerName, amount } = req.body
 *
 *   const response = await fetch('https://api.pagseguro.com/orders', {
 *     method: 'POST',
 *     headers: {
 *       'Content-Type': 'application/json',
 *       'Authorization': `Bearer ${process.env.PAGBANK_TOKEN}`
 *     },
 *     body: JSON.stringify({
 *       // dados do pedido
 *     })
 *   })
 *
 *   const data = await response.json()
 *   res.json(data)
 * })
 * ```
 */
