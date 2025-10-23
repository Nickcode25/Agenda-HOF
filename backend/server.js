const express = require('express')
const cors = require('cors')
const { MercadoPagoConfig, PreApproval, Payment } = require('mercadopago')

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

// Configuração do Mercado Pago
const MERCADOPAGO_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN

// Debug de variáveis
console.log('🔍 Debug de variáveis:')
console.log('NODE_ENV:', process.env.NODE_ENV)
console.log('MERCADOPAGO_ACCESS_TOKEN existe?', !!MERCADOPAGO_ACCESS_TOKEN)
console.log('MERCADOPAGO_ACCESS_TOKEN length:', MERCADOPAGO_ACCESS_TOKEN?.length)
console.log('MERCADOPAGO_ACCESS_TOKEN primeiros 20 chars:', MERCADOPAGO_ACCESS_TOKEN?.substring(0, 20))
console.log('PORT:', process.env.PORT)
console.log('FRONTEND_URL:', process.env.FRONTEND_URL)

// Validar token
if (!MERCADOPAGO_ACCESS_TOKEN || MERCADOPAGO_ACCESS_TOKEN.trim() === '') {
  console.error('❌ MERCADOPAGO_ACCESS_TOKEN não configurado ou vazio')
  console.error('💡 Configure a variável MERCADOPAGO_ACCESS_TOKEN no arquivo .env')
  process.exit(1)
}

// Inicializar cliente Mercado Pago
const client = new MercadoPagoConfig({
  accessToken: MERCADOPAGO_ACCESS_TOKEN,
  options: { timeout: 5000 }
})

const preApprovalClient = new PreApproval(client)
const paymentClient = new Payment(client)

console.log('🔧 Configuração do Mercado Pago:')
console.log('  - Ambiente:', process.env.NODE_ENV || 'development')
console.log('  - Access Token configurado:', MERCADOPAGO_ACCESS_TOKEN ? '✅ Sim' : '❌ Não')

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    paymentProvider: 'Mercado Pago',
    credentialType: MERCADOPAGO_ACCESS_TOKEN?.startsWith('TEST-') ? 'TEST' : 'PRODUCTION',
    credentialPrefix: MERCADOPAGO_ACCESS_TOKEN?.substring(0, 20)
  })
})

// ===============================================
// ASSINATURAS RECORRENTES - MERCADO PAGO
// ===============================================

/**
 * Criar assinatura recorrente com cartão de crédito
 * Usa a API de Pre-Approvals do Mercado Pago
 */
app.post('/api/mercadopago/create-subscription', async (req, res) => {
  try {
    const {
      customerEmail,
      customerName,
      customerPhone,
      cardToken,
      amount,
      planName
    } = req.body

    console.log('🔄 Criando assinatura recorrente:', { customerEmail, planName })

    // Validar dados obrigatórios
    if (!customerEmail || !customerName || !cardToken || !amount) {
      return res.status(400).json({
        error: 'Dados obrigatórios faltando',
        required: ['customerEmail', 'customerName', 'cardToken', 'amount']
      })
    }

    // Preparar dados da assinatura
    const subscriptionData = {
      reason: planName || 'Agenda+ HOF - Plano Profissional',
      auto_recurring: {
        frequency: 1,
        frequency_type: 'months',
        transaction_amount: amount,
        currency_id: 'BRL',
        free_trial: {
          frequency: 0,
          frequency_type: 'months'
        }
      },
      back_url: `${process.env.FRONTEND_URL}/app/agenda`,
      payer_email: customerEmail,
      status: 'authorized'
    }

    // Adicionar card_token_id apenas se fornecido
    if (cardToken) {
      subscriptionData.card_token_id = cardToken
    }

    console.log('📦 Dados da assinatura:', JSON.stringify(subscriptionData, null, 2))

    // Criar assinatura recorrente
    const subscription = await preApprovalClient.create({
      body: subscriptionData
    })

    console.log('✅ Assinatura criada:', subscription.id, 'Status:', subscription.status)

    res.json({
      id: subscription.id,
      status: subscription.status,
      amount: amount,
      nextBillingDate: subscription.next_payment_date,
      cardLastDigits: subscription.summarized?.last_four_digits || '****',
      cardBrand: subscription.payment_method_id || 'UNKNOWN'
    })
  } catch (error) {
    console.error('❌ Erro ao criar assinatura:')
    console.error('  - Message:', error.message)
    console.error('  - Status:', error.status)
    console.error('  - Cause:', JSON.stringify(error.cause, null, 2))
    console.error('  - Full error:', JSON.stringify(error, null, 2))

    // Extrair mensagem de erro mais específica
    const errorMessage = error.cause?.[0]?.description ||
                        error.message ||
                        'Erro ao criar assinatura'

    res.status(error.status || 500).json({
      error: errorMessage,
      details: error.cause || error.message,
      fullError: error.message
    })
  }
})

/**
 * Cancelar assinatura recorrente
 */
app.post('/api/mercadopago/cancel-subscription/:subscriptionId', async (req, res) => {
  try {
    const { subscriptionId } = req.params

    console.log('🚫 Cancelando assinatura:', subscriptionId)

    const result = await preApprovalClient.update({
      id: subscriptionId,
      body: {
        status: 'cancelled'
      }
    })

    console.log('✅ Assinatura cancelada:', subscriptionId)

    res.json({
      success: true,
      status: result.status
    })
  } catch (error) {
    console.error('❌ Erro ao cancelar:', error)

    const errorMessage = error.cause?.[0]?.description ||
                        error.message ||
                        'Erro ao cancelar assinatura'

    res.status(error.status || 500).json({
      error: errorMessage,
      details: error.cause || error.message
    })
  }
})

/**
 * Obter detalhes de uma assinatura
 */
app.get('/api/mercadopago/subscription/:subscriptionId', async (req, res) => {
  try {
    const { subscriptionId } = req.params

    console.log('🔍 Buscando assinatura:', subscriptionId)

    const subscription = await preApprovalClient.get({ id: subscriptionId })

    res.json({
      id: subscription.id,
      status: subscription.status,
      amount: subscription.auto_recurring.transaction_amount,
      nextBillingDate: subscription.next_payment_date,
      cardLastDigits: subscription.summarized?.last_four_digits || '****',
      cardBrand: subscription.payment_method_id || 'UNKNOWN',
      createdAt: subscription.date_created
    })
  } catch (error) {
    console.error('❌ Erro ao buscar assinatura:', error)

    const errorMessage = error.cause?.[0]?.description ||
                        error.message ||
                        'Erro ao buscar assinatura'

    res.status(error.status || 500).json({
      error: errorMessage
    })
  }
})

/**
 * Webhook - Receber notificações do Mercado Pago
 * Configurar em: https://www.mercadopago.com.br/developers/panel/notifications/webhooks
 */
app.post('/api/mercadopago/webhook', async (req, res) => {
  try {
    const { type, data, action } = req.body

    console.log('📬 Webhook recebido:', {
      type,
      action,
      id: data?.id
    })

    // Processar diferentes tipos de eventos
    switch (type) {
      case 'subscription_preapproval':
        console.log('🔄 Evento de assinatura:', action, data.id)

        switch (action) {
          case 'created':
            console.log('🆕 Nova assinatura criada:', data.id)
            // TODO: Salvar no banco de dados
            break

          case 'updated':
            console.log('🔄 Assinatura atualizada:', data.id)
            // Buscar detalhes da assinatura
            const subscription = await preApprovalClient.get({ id: data.id })
            console.log('Status atual:', subscription.status)
            // TODO: Atualizar no banco de dados
            break

          default:
            console.log('❓ Ação de assinatura não tratada:', action)
        }
        break

      case 'payment':
        console.log('💰 Evento de pagamento:', action, data.id)

        // Buscar detalhes do pagamento
        const payment = await paymentClient.get({ id: data.id })
        console.log('Status do pagamento:', payment.status)
        console.log('Valor:', payment.transaction_amount)

        switch (payment.status) {
          case 'approved':
            console.log('✅ Pagamento aprovado:', data.id)
            // TODO: Ativar acesso do usuário ou renovar assinatura
            break

          case 'rejected':
            console.log('❌ Pagamento rejeitado:', data.id)
            // TODO: Notificar usuário e tentar novamente
            break

          case 'pending':
            console.log('⏳ Pagamento pendente:', data.id)
            break

          default:
            console.log('❓ Status de pagamento não tratado:', payment.status)
        }
        break

      default:
        console.log('❓ Tipo de evento não tratado:', type)
    }

    // TODO: Salvar webhook no banco para processamento posterior
    // await supabase.from('mercadopago_webhooks').insert({
    //   event_type: type,
    //   event_action: action,
    //   resource_id: data?.id,
    //   payload: req.body,
    //   processed: false
    // })

    // Sempre retornar 200 OK para o Mercado Pago saber que recebemos
    res.status(200).json({ received: true })
  } catch (error) {
    console.error('❌ Erro ao processar webhook:', error)
    res.status(500).json({ error: 'Erro ao processar webhook' })
  }
})

/**
 * Criar token de cartão (para uso no frontend)
 * NOTA: Em produção, usar SDK JavaScript do Mercado Pago no frontend
 */
app.post('/api/mercadopago/create-card-token', async (req, res) => {
  try {
    const { cardNumber, cardholderName, expirationMonth, expirationYear, securityCode, identificationType, identificationNumber } = req.body

    console.log('💳 Criando token de cartão...')

    // IMPORTANTE: Este endpoint é apenas para desenvolvimento
    // Em produção, use o SDK JavaScript do Mercado Pago no frontend
    // Documentação: https://www.mercadopago.com.br/developers/pt/docs/checkout-api/integration-configuration/card/integrate-via-cardform

    res.status(501).json({
      error: 'Use o SDK JavaScript do Mercado Pago no frontend para criar tokens de cartão',
      documentation: 'https://www.mercadopago.com.br/developers/pt/docs/checkout-api/integration-configuration/card/integrate-via-cardform'
    })
  } catch (error) {
    console.error('❌ Erro ao criar token:', error)
    res.status(500).json({ error: error.message })
  }
})

// Iniciar servidor
app.listen(PORT, () => {
  console.log('\n🚀 Backend Agenda HOF iniciado!')
  console.log(`📡 Servidor rodando em http://localhost:${PORT}`)
  console.log(`🌐 Frontend esperado em ${process.env.FRONTEND_URL}`)
  console.log('\n✅ Endpoints disponíveis (Mercado Pago):')
  console.log('  - GET  /health')
  console.log('  - POST /api/mercadopago/create-subscription ⭐ Assinatura recorrente')
  console.log('  - POST /api/mercadopago/cancel-subscription/:id')
  console.log('  - GET  /api/mercadopago/subscription/:id')
  console.log('  - POST /api/mercadopago/webhook ⭐ Notificações')
  console.log('  - POST /api/mercadopago/create-card-token (dev only)')
  console.log('\n💡 Use Ctrl+C para parar o servidor\n')
})
