import { PAGBANK_TOKEN, PAGBANK_API_URL, PLAN_PRICE, PLAN_NAME } from '@/lib/pagbank'

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
 * Cria um pedido PIX no PagBank
 */
export async function createPixOrder(data: CreatePixOrderData): Promise<PixResponse> {
  try {
    const response = await fetch(`${PAGBANK_API_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PAGBANK_TOKEN}`,
      },
      body: JSON.stringify({
        reference_id: `HOF_${Date.now()}`,
        customer: {
          name: data.customerName,
          email: data.customerEmail,
          tax_id: '12345678909', // CPF de teste ou real
        },
        items: [
          {
            reference_id: 'PLANO_PROFISSIONAL',
            name: PLAN_NAME,
            quantity: 1,
            unit_amount: Math.round(PLAN_PRICE * 100), // Converter para centavos
          },
        ],
        qr_codes: [
          {
            amount: {
              value: Math.round(PLAN_PRICE * 100),
            },
            expiration_date: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutos
          },
        ],
        notification_urls: [
          // URL para webhook (configurar quando tiver backend)
          // `${window.location.origin}/api/webhook/pagbank`
        ],
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error_messages?.[0]?.description || 'Erro ao criar pedido PIX')
    }

    const result = await response.json()

    return {
      id: result.id,
      qrCodeText: result.qr_codes[0].text,
      qrCodeImage: result.qr_codes[0].links.find((l: any) => l.media === 'image/png')?.href || '',
      expiresAt: result.qr_codes[0].expiration_date,
    }
  } catch (error) {
    console.error('Erro ao criar pedido PIX:', error)
    throw error
  }
}

/**
 * Cria um pedido com cartão de crédito no PagBank
 */
export async function createCardOrder(data: CreateCardOrderData): Promise<CardResponse> {
  try {
    // Remover espaços e formatação do número do cartão
    const cardNumber = data.cardNumber.replace(/\s/g, '')
    const cardHolderCpf = data.cardHolderCpf.replace(/\D/g, '')

    const response = await fetch(`${PAGBANK_API_URL}/charges`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PAGBANK_TOKEN}`,
      },
      body: JSON.stringify({
        reference_id: `HOF_${Date.now()}`,
        description: PLAN_NAME,
        amount: {
          value: Math.round(PLAN_PRICE * 100), // Converter para centavos
          currency: 'BRL',
        },
        payment_method: {
          type: 'CREDIT_CARD',
          installments: 1,
          capture: true,
          card: {
            number: cardNumber,
            exp_month: data.cardExpiryMonth,
            exp_year: data.cardExpiryYear,
            security_code: data.cardCvv,
            holder: {
              name: data.cardHolderName,
              tax_id: cardHolderCpf,
            },
          },
        },
        customer: {
          name: data.customerName,
          email: data.customerEmail,
          tax_id: cardHolderCpf,
        },
        notification_urls: [
          // URL para webhook (configurar quando tiver backend)
          // `${window.location.origin}/api/webhook/pagbank`
        ],
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error_messages?.[0]?.description || 'Erro ao processar pagamento')
    }

    const result = await response.json()

    return {
      id: result.id,
      status: result.status,
      amount: result.amount.value / 100, // Converter de centavos para reais
    }
  } catch (error) {
    console.error('Erro ao processar cartão:', error)
    throw error
  }
}

/**
 * Cria um boleto no PagBank
 */
export async function createBoletoOrder(data: CreateBoletoOrderData): Promise<BoletoResponse> {
  try {
    const customerCpf = data.customerCpf.replace(/\D/g, '')

    // Data de vencimento: 3 dias úteis
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 3)

    const response = await fetch(`${PAGBANK_API_URL}/charges`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PAGBANK_TOKEN}`,
      },
      body: JSON.stringify({
        reference_id: `HOF_${Date.now()}`,
        description: PLAN_NAME,
        amount: {
          value: Math.round(PLAN_PRICE * 100), // Converter para centavos
          currency: 'BRL',
        },
        payment_method: {
          type: 'BOLETO',
          boleto: {
            due_date: dueDate.toISOString().split('T')[0], // YYYY-MM-DD
            instruction_lines: {
              line_1: 'Pagamento referente à assinatura mensal',
              line_2: 'Agenda+ HOF - Sistema de Gestão',
            },
            holder: {
              name: data.customerName,
              tax_id: customerCpf,
              email: data.customerEmail,
            },
          },
        },
        customer: {
          name: data.customerName,
          email: data.customerEmail,
          tax_id: customerCpf,
        },
        notification_urls: [
          // URL para webhook (configurar quando tiver backend)
          // `${window.location.origin}/api/webhook/pagbank`
        ],
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error_messages?.[0]?.description || 'Erro ao gerar boleto')
    }

    const result = await response.json()

    return {
      id: result.id,
      boletoUrl: result.links.find((l: any) => l.rel === 'SELF')?.href || '',
      barcode: result.payment_method.boleto?.barcode || '',
      dueDate: result.payment_method.boleto?.due_date || '',
    }
  } catch (error) {
    console.error('Erro ao gerar boleto:', error)
    throw error
  }
}

/**
 * Verifica o status de um pagamento
 */
export async function checkPaymentStatus(orderId: string): Promise<string> {
  try {
    const response = await fetch(`${PAGBANK_API_URL}/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PAGBANK_TOKEN}`,
      },
    })

    if (!response.ok) {
      throw new Error('Erro ao verificar status do pagamento')
    }

    const result = await response.json()
    return result.status // PAID, WAITING, DECLINED, etc.
  } catch (error) {
    console.error('Erro ao verificar status:', error)
    throw error
  }
}
