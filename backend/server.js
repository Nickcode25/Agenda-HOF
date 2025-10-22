const express = require('express')
const cors = require('cors')
const fetch = require('node-fetch')

// Carregar .env apenas se não estiver em produção
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

const app = express()
const PORT = process.env.PORT || 3001

// Middleware - Aceitar tanto com www quanto sem www
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5175',
  'https://agendahof.com',
  'https://www.agendahof.com',
  'http://localhost:5175',
  'http://localhost:5173'
]

app.use(cors({
  origin: function(origin, callback) {
    // Permitir requisições sem origin (mobile apps, postman, etc)
    if (!origin) return callback(null, true)

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      console.log('❌ Origem bloqueada por CORS:', origin)
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true
}))
app.use(express.json())

// Configuração do PagBank
const PAGBANK_TOKEN = process.env.PAGBANK_TOKEN
const PAGBANK_API_URL = process.env.NODE_ENV === 'production'
  ? 'https://api.pagseguro.com'
  : 'https://sandbox.api.pagseguro.com'

// Debug de variáveis
console.log('🔍 Debug de variáveis:')
console.log('NODE_ENV:', process.env.NODE_ENV)
console.log('PAGBANK_TOKEN existe?', !!process.env.PAGBANK_TOKEN)
console.log('PAGBANK_TOKEN length:', process.env.PAGBANK_TOKEN?.length)
console.log('PAGBANK_TOKEN primeiros 20 chars:', process.env.PAGBANK_TOKEN?.substring(0, 20))
console.log('Tipo do token:', typeof process.env.PAGBANK_TOKEN)
console.log('PORT:', process.env.PORT)
console.log('FRONTEND_URL:', process.env.FRONTEND_URL)

// Validar token
if (!PAGBANK_TOKEN || PAGBANK_TOKEN.trim() === '') {
  console.error('❌ PAGBANK_TOKEN não configurado ou vazio')
  process.exit(1)
}

console.log('🔧 Configuração do PagBank:')
console.log('  - Ambiente:', process.env.NODE_ENV || 'development')
console.log('  - API URL:', PAGBANK_API_URL)
console.log('  - Token configurado:', PAGBANK_TOKEN ? '✅ Sim' : '❌ Não')

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  })
})

// Criar pedido PIX
app.post('/api/pagbank/create-pix', async (req, res) => {
  try {
    const { customerEmail, customerName, amount, planName } = req.body

    console.log('📱 Criando pedido PIX:', { customerEmail, customerName, amount })

    console.log('🔑 Token sendo usado:', PAGBANK_TOKEN.substring(0, 20) + '...')
    console.log('🌐 API URL:', PAGBANK_API_URL)

    const response = await fetch(`${PAGBANK_API_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PAGBANK_TOKEN}`,
      },
      body: JSON.stringify({
        reference_id: `HOF_PIX_${Date.now()}`,
        customer: {
          name: customerName,
          email: customerEmail,
          tax_id: '12345678909', // CPF de teste
        },
        items: [
          {
            reference_id: 'PLANO_PROFISSIONAL',
            name: planName || 'Agenda+ HOF - Plano Profissional',
            quantity: 1,
            unit_amount: Math.round(amount * 100), // Converter para centavos
          },
        ],
        qr_codes: [
          {
            amount: {
              value: Math.round(amount * 100),
            },
            expiration_date: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
          },
        ],
      }),
    })

    console.log('📡 Status da resposta:', response.status, response.statusText)
    console.log('📋 Headers da resposta:', Object.fromEntries(response.headers.entries()))

    // Tentar ler como texto primeiro para ver se é HTML ou JSON
    const responseText = await response.text()
    console.log('📄 Resposta bruta (primeiros 500 chars):', responseText.substring(0, 500))

    let data
    try {
      data = JSON.parse(responseText)
    } catch (e) {
      console.error('❌ Resposta não é JSON válido!')
      console.error('Tipo de conteúdo:', response.headers.get('content-type'))
      return res.status(500).json({
        error: 'PagBank retornou resposta inválida (não-JSON)',
        hint: 'Provavelmente problema de whitelist ou token inválido',
        statusCode: response.status,
        responsePreview: responseText.substring(0, 200)
      })
    }

    if (!response.ok) {
      console.error('❌ Erro do PagBank:', data)
      return res.status(response.status).json({
        error: data.error_messages?.[0]?.description || 'Erro ao criar pedido PIX',
        details: data
      })
    }

    console.log('✅ PIX criado com sucesso:', data.id)

    res.json({
      id: data.id,
      qrCodeText: data.qr_codes[0].text,
      qrCodeImage: data.qr_codes[0].links.find(l => l.media === 'image/png')?.href || '',
      expiresAt: data.qr_codes[0].expiration_date,
    })
  } catch (error) {
    console.error('❌ Erro ao criar PIX:', error)
    res.status(500).json({
      error: 'Erro interno ao processar PIX',
      message: error.message
    })
  }
})

// Processar pagamento com cartão
app.post('/api/pagbank/create-card-charge', async (req, res) => {
  try {
    const {
      customerEmail,
      customerName,
      cardNumber,
      cardHolderName,
      cardExpiryMonth,
      cardExpiryYear,
      cardCvv,
      cardHolderCpf,
      amount,
      planName
    } = req.body

    console.log('💳 Processando cartão:', { customerEmail, cardNumber: '****' + cardNumber.slice(-4) })

    const response = await fetch(`${PAGBANK_API_URL}/charges`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PAGBANK_TOKEN}`,
      },
      body: JSON.stringify({
        reference_id: `HOF_CARD_${Date.now()}`,
        description: planName || 'Agenda+ HOF - Plano Profissional',
        amount: {
          value: Math.round(amount * 100),
          currency: 'BRL',
        },
        payment_method: {
          type: 'CREDIT_CARD',
          installments: 1,
          capture: true,
          card: {
            number: cardNumber.replace(/\s/g, ''),
            exp_month: cardExpiryMonth,
            exp_year: cardExpiryYear,
            security_code: cardCvv,
            holder: {
              name: cardHolderName,
              tax_id: cardHolderCpf.replace(/\D/g, ''),
            },
          },
        },
        customer: {
          name: customerName,
          email: customerEmail,
          tax_id: cardHolderCpf.replace(/\D/g, ''),
        },
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('❌ Erro do PagBank:', data)
      return res.status(response.status).json({
        error: data.error_messages?.[0]?.description || 'Erro ao processar cartão',
        details: data
      })
    }

    console.log('✅ Cartão processado:', data.id, 'Status:', data.status)

    res.json({
      id: data.id,
      status: data.status,
      amount: data.amount.value / 100,
    })
  } catch (error) {
    console.error('❌ Erro ao processar cartão:', error)
    res.status(500).json({
      error: 'Erro interno ao processar cartão',
      message: error.message
    })
  }
})

// Gerar boleto
app.post('/api/pagbank/create-boleto', async (req, res) => {
  try {
    const { customerEmail, customerName, customerCpf, amount, planName } = req.body

    console.log('📄 Gerando boleto:', { customerEmail, customerName })

    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 3) // Vencimento em 3 dias

    const response = await fetch(`${PAGBANK_API_URL}/charges`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PAGBANK_TOKEN}`,
      },
      body: JSON.stringify({
        reference_id: `HOF_BOLETO_${Date.now()}`,
        description: planName || 'Agenda+ HOF - Plano Profissional',
        amount: {
          value: Math.round(amount * 100),
          currency: 'BRL',
        },
        payment_method: {
          type: 'BOLETO',
          boleto: {
            due_date: dueDate.toISOString().split('T')[0],
            instruction_lines: {
              line_1: 'Pagamento referente à assinatura mensal',
              line_2: 'Agenda+ HOF - Sistema de Gestão',
            },
            holder: {
              name: customerName,
              tax_id: customerCpf.replace(/\D/g, ''),
              email: customerEmail,
            },
          },
        },
        customer: {
          name: customerName,
          email: customerEmail,
          tax_id: customerCpf.replace(/\D/g, ''),
        },
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('❌ Erro do PagBank:', data)
      return res.status(response.status).json({
        error: data.error_messages?.[0]?.description || 'Erro ao gerar boleto',
        details: data
      })
    }

    console.log('✅ Boleto gerado:', data.id)

    res.json({
      id: data.id,
      boletoUrl: data.links.find(l => l.rel === 'SELF')?.href || '',
      barcode: data.payment_method.boleto?.barcode || '',
      dueDate: data.payment_method.boleto?.due_date || '',
    })
  } catch (error) {
    console.error('❌ Erro ao gerar boleto:', error)
    res.status(500).json({
      error: 'Erro interno ao gerar boleto',
      message: error.message
    })
  }
})

// Verificar status de pagamento
app.get('/api/pagbank/check-status/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params

    console.log('🔍 Verificando status:', orderId)

    const response = await fetch(`${PAGBANK_API_URL}/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PAGBANK_TOKEN}`,
      },
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('❌ Erro do PagBank:', data)
      return res.status(response.status).json({
        error: 'Erro ao verificar status',
        details: data
      })
    }

    console.log('✅ Status verificado:', data.status)

    res.json({
      status: data.status,
      charges: data.charges
    })
  } catch (error) {
    console.error('❌ Erro ao verificar status:', error)
    res.status(500).json({
      error: 'Erro interno ao verificar status',
      message: error.message
    })
  }
})

// ===============================================
// ASSINATURAS RECORRENTES
// ===============================================

// Criar assinatura (cobrança automática mensal)
app.post('/api/pagbank/create-subscription', async (req, res) => {
  try {
    const {
      customerEmail,
      customerName,
      customerPhone,
      cardNumber,
      cardHolderName,
      cardExpiryMonth,
      cardExpiryYear,
      cardCvv,
      cardHolderCpf,
      amount,
      planName
    } = req.body

    console.log('🔄 Criando assinatura recorrente:', { customerEmail, cardNumber: '****' + cardNumber.slice(-4) })

    // Criar plano de assinatura (ou usar um existente)
    const planResponse = await fetch(`${PAGBANK_API_URL}/plans`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PAGBANK_TOKEN}`,
      },
      body: JSON.stringify({
        reference_id: `PLAN_HOF_${Date.now()}`,
        name: planName || 'Agenda+ HOF - Plano Mensal',
        description: 'Plano mensal com cobrança automática',
        amount: {
          value: Math.round(amount * 100),
          currency: 'BRL'
        },
        interval: {
          unit: 'MONTH',
          length: 1
        }
      })
    })

    const planData = await planResponse.json()

    if (!planResponse.ok) {
      console.error('❌ Erro ao criar plano:', planData)
      return res.status(planResponse.status).json({
        error: planData.error_messages?.[0]?.description || 'Erro ao criar plano',
        details: planData
      })
    }

    console.log('✅ Plano criado:', planData.id)

    // Criar assinatura vinculada ao plano
    const subscriptionResponse = await fetch(`${PAGBANK_API_URL}/subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PAGBANK_TOKEN}`,
      },
      body: JSON.stringify({
        reference_id: `SUB_HOF_${Date.now()}`,
        plan_id: planData.id,
        customer: {
          name: customerName,
          email: customerEmail,
          tax_id: cardHolderCpf.replace(/\D/g, ''),
          phones: customerPhone ? [{
            country: '55',
            area: customerPhone.replace(/\D/g, '').substring(0, 2),
            number: customerPhone.replace(/\D/g, '').substring(2),
            type: 'MOBILE'
          }] : undefined
        },
        payment_method: [{
          type: 'CREDIT_CARD',
          card: {
            number: cardNumber.replace(/\s/g, ''),
            exp_month: cardExpiryMonth,
            exp_year: cardExpiryYear,
            security_code: cardCvv,
            holder: {
              name: cardHolderName,
              tax_id: cardHolderCpf.replace(/\D/g, '')
            }
          }
        }]
      })
    })

    const subscriptionData = await subscriptionResponse.json()

    if (!subscriptionResponse.ok) {
      console.error('❌ Erro ao criar assinatura:', subscriptionData)
      return res.status(subscriptionResponse.status).json({
        error: subscriptionData.error_messages?.[0]?.description || 'Erro ao criar assinatura',
        details: subscriptionData
      })
    }

    console.log('✅ Assinatura criada:', subscriptionData.id, 'Status:', subscriptionData.status)

    res.json({
      id: subscriptionData.id,
      planId: planData.id,
      status: subscriptionData.status,
      amount: amount,
      nextBillingDate: subscriptionData.next_invoice_at,
      cardLastDigits: cardNumber.slice(-4),
      cardBrand: subscriptionData.payment_method?.[0]?.card?.brand || 'UNKNOWN'
    })
  } catch (error) {
    console.error('❌ Erro ao criar assinatura:', error)
    res.status(500).json({
      error: 'Erro interno ao criar assinatura',
      message: error.message
    })
  }
})

// Cancelar assinatura
app.post('/api/pagbank/cancel-subscription/:subscriptionId', async (req, res) => {
  try {
    const { subscriptionId } = req.params

    console.log('🚫 Cancelando assinatura:', subscriptionId)

    const response = await fetch(`${PAGBANK_API_URL}/subscriptions/${subscriptionId}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PAGBANK_TOKEN}`,
      }
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('❌ Erro ao cancelar:', data)
      return res.status(response.status).json({
        error: data.error_messages?.[0]?.description || 'Erro ao cancelar assinatura',
        details: data
      })
    }

    console.log('✅ Assinatura cancelada:', subscriptionId)

    res.json({
      success: true,
      status: data.status
    })
  } catch (error) {
    console.error('❌ Erro ao cancelar assinatura:', error)
    res.status(500).json({
      error: 'Erro interno ao cancelar assinatura',
      message: error.message
    })
  }
})

// Webhook - Receber notificações do PagBank
app.post('/api/pagbank/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const event = req.body

    console.log('📬 Webhook recebido:', {
      type: event.type,
      id: event.id,
      created_at: event.created_at
    })

    // Aqui você deve validar a assinatura do webhook
    // O PagBank envia um header x-pagseguro-signature que deve ser validado

    // Processar diferentes tipos de eventos
    switch (event.type) {
      case 'SUBSCRIPTION.CREATED':
        console.log('🆕 Nova assinatura criada:', event.data.id)
        // TODO: Salvar no banco de dados
        break

      case 'SUBSCRIPTION.ACTIVATED':
        console.log('✅ Assinatura ativada:', event.data.id)
        // TODO: Ativar acesso do usuário
        break

      case 'SUBSCRIPTION.SUSPENDED':
        console.log('⚠️ Assinatura suspensa:', event.data.id)
        // TODO: Suspender acesso do usuário
        break

      case 'SUBSCRIPTION.CANCELLED':
        console.log('🚫 Assinatura cancelada:', event.data.id)
        // TODO: Desativar acesso do usuário
        break

      case 'CHARGE.PAID':
        console.log('💰 Pagamento confirmado:', event.data.id)
        // TODO: Registrar pagamento no banco
        break

      case 'CHARGE.FAILED':
        console.log('❌ Pagamento falhou:', event.data.id)
        // TODO: Notificar usuário e tentar novamente
        break

      default:
        console.log('❓ Evento não tratado:', event.type)
    }

    // TODO: Salvar webhook no banco para processamento posterior
    // await supabase.from('pagbank_webhooks').insert({
    //   event_type: event.type,
    //   subscription_id: event.data?.id,
    //   payload: event,
    //   processed: false
    // })

    // Sempre retornar 200 OK para o PagBank saber que recebemos
    res.status(200).json({ received: true })
  } catch (error) {
    console.error('❌ Erro ao processar webhook:', error)
    res.status(500).json({ error: 'Erro ao processar webhook' })
  }
})

// Iniciar servidor
app.listen(PORT, () => {
  console.log('\n🚀 Backend Agenda HOF iniciado!')
  console.log(`📡 Servidor rodando em http://localhost:${PORT}`)
  console.log(`🌐 Frontend esperado em ${process.env.FRONTEND_URL}`)
  console.log('\n✅ Endpoints disponíveis:')
  console.log('  - GET  /health')
  console.log('  - POST /api/pagbank/create-pix')
  console.log('  - POST /api/pagbank/create-card-charge')
  console.log('  - POST /api/pagbank/create-subscription ⭐ NOVO')
  console.log('  - POST /api/pagbank/cancel-subscription/:id ⭐ NOVO')
  console.log('  - POST /api/pagbank/webhook ⭐ NOVO')
  console.log('  - POST /api/pagbank/create-boleto')
  console.log('  - GET  /api/pagbank/check-status/:orderId')
  console.log('\n💡 Use Ctrl+C para parar o servidor\n')
})
