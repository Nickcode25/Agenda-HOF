const express = require('express')
const cors = require('cors')
const { MercadoPagoConfig, PreApproval, Payment } = require('mercadopago')
const { createClient } = require('@supabase/supabase-js')
const { Resend } = require('resend')

// Stripe para Apple Pay (iOS) e Cartão Digitado
const {
  handleApplePayPayment,
  handleApplePaySubscription,
  handleCreateSubscription,
  cancelSubscription: cancelStripeSubscription,
  getSubscription: getStripeSubscription,
  createPaymentIntent,
  handleWebhook: handleStripeWebhook,
  getPaymentHistory: getStripePaymentHistory
} = require('./routes/stripe-apple-pay')

// Carregar .env apenas se não estiver em produção
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

// Inicializar Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

const app = express()
const PORT = process.env.PORT || 3001

// Middleware - Aceitar tanto com www quanto sem www
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5175',
  'https://agendahof.com',
  'https://www.agendahof.com',
  'http://localhost:5175',
  'http://localhost:5173',
  'http://localhost:5177'
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

// Configuração do Resend
const resend = new Resend(process.env.RESEND_API_KEY)
const EMAIL_FROM = process.env.EMAIL_FROM || 'onboarding@resend.dev'
const APP_NAME = 'Agenda HOF'

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
      customerCpf,
      cardToken,
      amount,
      planName
    } = req.body

    console.log('🔄 Criando assinatura recorrente:', { customerEmail, customerCpf, planName })

    // Validar dados obrigatórios
    if (!customerEmail || !customerName || !cardToken || !amount) {
      return res.status(400).json({
        error: 'Dados obrigatórios faltando',
        required: ['customerEmail', 'customerName', 'cardToken', 'amount']
      })
    }

    // Validar CPF (obrigatório para produção)
    if (!customerCpf || customerCpf.replace(/\D/g, '').length !== 11) {
      return res.status(400).json({
        error: 'CPF inválido ou não fornecido',
        details: 'O CPF deve conter 11 dígitos'
      })
    }

    // Detectar se está em modo TEST
    const isTestMode = MERCADOPAGO_ACCESS_TOKEN.startsWith('TEST-')

    console.log('🧪 Modo:', isTestMode ? 'TESTE' : 'PRODUÇÃO')

    if (isTestMode) {
      // No modo TEST, usar Payment ao invés de PreApproval
      console.log('💳 Usando Payment API (modo teste)')

      const paymentData = {
        transaction_amount: amount,
        token: cardToken,
        description: planName || 'Agenda HOF - Plano Profissional',
        installments: 1,
        payer: {
          email: customerEmail,
          identification: {
            type: 'CPF',
            number: customerCpf || '12345678909'
          }
        }
      }

      console.log('📦 Dados do pagamento (sem payment_method_id):', JSON.stringify(paymentData, null, 2))

      const payment = await paymentClient.create({
        body: paymentData
      })

      console.log('✅ Pagamento criado:', payment.id, 'Status:', payment.status)

      res.json({
        id: payment.id,
        status: payment.status === 'approved' ? 'authorized' : payment.status,
        amount: amount,
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        cardLastDigits: payment.card?.last_four_digits || '****',
        cardBrand: payment.payment_method_id || 'UNKNOWN'
      })
    } else {
      // No modo PRODUÇÃO, usar PreApproval normalmente
      console.log('🔄 Usando PreApproval API (modo produção)')
      console.log('📧 Email do pagador:', customerEmail)
      console.log('💰 Valor da assinatura:', amount)
      console.log('🆔 CPF do titular:', customerCpf.substring(0, 3) + '...')

      const subscriptionData = {
        reason: planName || 'Agenda HOF - Plano Profissional',
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
        card_token_id: cardToken,
        status: 'authorized'
      }

      console.log('📦 Criando assinatura com os seguintes dados:')
      console.log('  - Plano:', subscriptionData.reason)
      console.log('  - Valor mensal: R$', subscriptionData.auto_recurring.transaction_amount)
      console.log('  - Email:', subscriptionData.payer_email)
      console.log('  - Token do cartão:', cardToken.substring(0, 10) + '...')

      try {
        const subscription = await preApprovalClient.create({
          body: subscriptionData
        })

        console.log('✅ Assinatura criada com sucesso!')
        console.log('  - ID:', subscription.id)
        console.log('  - Status:', subscription.status)
        console.log('  - Próximo pagamento:', subscription.next_payment_date)
        console.log('  - Últimos dígitos do cartão:', subscription.summarized?.last_four_digits)

        res.json({
          id: subscription.id,
          status: subscription.status,
          amount: amount,
          nextBillingDate: subscription.next_payment_date,
          cardLastDigits: subscription.summarized?.last_four_digits || '****',
          cardBrand: subscription.payment_method_id || 'UNKNOWN'
        })
      } catch (subscriptionError) {
        console.error('❌ Erro específico ao criar PreApproval:')
        console.error('  - Status HTTP:', subscriptionError.status)
        console.error('  - Message:', subscriptionError.message)

        // Log mais detalhado para erros de segurança
        if (subscriptionError.cause) {
          console.error('  - Causas do erro:')
          subscriptionError.cause.forEach((cause, index) => {
            console.error(`    ${index + 1}. ${cause.code}: ${cause.description}`)
          })
        }

        throw subscriptionError
      }
    }
  } catch (error) {
    console.error('❌ Erro ao criar assinatura:')
    console.error('  - Message:', error.message)
    console.error('  - Status:', error.status)
    console.error('  - Cause:', JSON.stringify(error.cause, null, 2))
    console.error('  - Full error:', JSON.stringify(error, null, 2))

    // Extrair mensagem de erro mais específica
    let errorMessage = error.cause?.[0]?.description || error.message || 'Erro ao criar assinatura'

    // Tratar erros específicos de segurança do Mercado Pago
    if (errorMessage.includes('security') || errorMessage.includes('fraud')) {
      errorMessage = 'Pagamento recusado por medidas de segurança. Verifique os dados ou entre em contato com seu banco.'
    } else if (errorMessage.includes('invalid') && errorMessage.includes('card')) {
      errorMessage = 'Dados do cartão inválidos. Verifique o número, validade e CVV.'
    } else if (errorMessage.includes('CPF') || errorMessage.includes('identification')) {
      errorMessage = 'CPF inválido. Verifique os dados e tente novamente.'
    }

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
      id: data?.id,
      payload: req.body
    })

    // Salvar webhook no banco para auditoria
    await supabase.from('mercadopago_webhooks').insert({
      event_type: type,
      event_action: action,
      resource_id: data?.id,
      payload: req.body,
      processed: false,
      created_at: new Date().toISOString()
    })

    // Processar diferentes tipos de eventos
    switch (type) {
      case 'subscription_preapproval':
      case 'subscription_authorized_payment':
        console.log('🔄 Evento de assinatura:', action, data.id)

        // Buscar detalhes da assinatura
        const subscription = await preApprovalClient.get({ id: data.id })
        console.log('📋 Detalhes da assinatura:', {
          id: subscription.id,
          status: subscription.status,
          payer_email: subscription.payer_email
        })

        // Buscar usuário pelo email
        const { data: users, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('email', subscription.payer_email)
          .single()

        if (userError || !users) {
          console.error('❌ Usuário não encontrado:', subscription.payer_email)
          break
        }

        const userId = users.id

        switch (subscription.status) {
          case 'authorized':
            console.log('✅ Assinatura autorizada:', data.id)
            // Atualizar ou criar assinatura no banco
            await supabase.from('user_subscriptions').upsert({
              user_id: userId,
              subscription_id: subscription.id,
              status: 'active',
              plan_type: 'professional',
              amount: subscription.auto_recurring.transaction_amount,
              next_billing_date: subscription.next_payment_date,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'subscription_id'
            })
            console.log('💾 Assinatura salva/atualizada no banco')
            break

          case 'cancelled':
            console.log('🚫 Assinatura cancelada:', data.id)
            // Atualizar status da assinatura
            await supabase
              .from('user_subscriptions')
              .update({
                status: 'cancelled',
                cancelled_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .eq('subscription_id', subscription.id)
            console.log('💾 Assinatura cancelada no banco')
            break

          case 'paused':
            console.log('⏸️ Assinatura pausada:', data.id)
            await supabase
              .from('user_subscriptions')
              .update({
                status: 'paused',
                updated_at: new Date().toISOString()
              })
              .eq('subscription_id', subscription.id)
            break

          default:
            console.log('❓ Status de assinatura não tratado:', subscription.status)
        }
        break

      case 'payment':
        console.log('💰 Evento de pagamento:', action, data.id)

        // Buscar detalhes do pagamento
        const payment = await paymentClient.get({ id: data.id })
        console.log('💳 Detalhes do pagamento:', {
          id: payment.id,
          status: payment.status,
          amount: payment.transaction_amount,
          payer_email: payment.payer?.email
        })

        // Salvar histórico de pagamento
        const { data: paymentHistory, error: paymentError } = await supabase
          .from('payment_history')
          .insert({
            payment_id: payment.id,
            subscription_id: payment.metadata?.subscription_id || payment.external_reference,
            amount: payment.transaction_amount,
            status: payment.status,
            status_detail: payment.status_detail,
            payment_method: payment.payment_method_id,
            payer_email: payment.payer?.email,
            created_at: payment.date_created,
            updated_at: new Date().toISOString()
          })

        if (paymentError) {
          console.error('❌ Erro ao salvar histórico de pagamento:', paymentError)
        } else {
          console.log('💾 Histórico de pagamento salvo')
        }

        // Processar status do pagamento
        switch (payment.status) {
          case 'approved':
            console.log('✅ Pagamento aprovado:', data.id)

            // Se tiver subscription_id, renovar a assinatura
            if (payment.metadata?.subscription_id || payment.external_reference) {
              const subscriptionId = payment.metadata?.subscription_id || payment.external_reference

              await supabase
                .from('user_subscriptions')
                .update({
                  status: 'active',
                  last_payment_date: payment.date_approved,
                  updated_at: new Date().toISOString()
                })
                .eq('subscription_id', subscriptionId)

              console.log('✅ Assinatura renovada:', subscriptionId)
            }
            break

          case 'rejected':
            console.log('❌ Pagamento rejeitado:', data.id, payment.status_detail)

            // Desativar assinatura se pagamento rejeitado
            if (payment.metadata?.subscription_id || payment.external_reference) {
              const subscriptionId = payment.metadata?.subscription_id || payment.external_reference

              console.log('🚫 Desativando assinatura por pagamento recusado:', subscriptionId)

              // Buscar assinatura pelo mercadopago_subscription_id
              const { data: existingSubscription } = await supabase
                .from('user_subscriptions')
                .select('*')
                .eq('mercadopago_subscription_id', subscriptionId)
                .single()

              if (existingSubscription) {
                await supabase
                  .from('user_subscriptions')
                  .update({
                    status: 'payment_failed',
                    updated_at: new Date().toISOString()
                  })
                  .eq('mercadopago_subscription_id', subscriptionId)

                console.log('✅ Assinatura marcada como payment_failed')
              }
            }

            // TODO: Implementar notificação por email
            break

          case 'refunded':
            console.log('💸 Pagamento reembolsado:', data.id)

            // Cancelar assinatura se houver reembolso
            if (payment.metadata?.subscription_id || payment.external_reference) {
              const subscriptionId = payment.metadata?.subscription_id || payment.external_reference

              await supabase
                .from('user_subscriptions')
                .update({
                  status: 'refunded',
                  updated_at: new Date().toISOString()
                })
                .eq('subscription_id', subscriptionId)
            }
            break

          case 'pending':
            console.log('⏳ Pagamento pendente:', data.id)
            break

          case 'in_process':
            console.log('🔄 Pagamento em processamento:', data.id)
            break

          default:
            console.log('❓ Status de pagamento não tratado:', payment.status)
        }
        break

      default:
        console.log('❓ Tipo de evento não tratado:', type)
    }

    // Marcar webhook como processado
    await supabase
      .from('mercadopago_webhooks')
      .update({ processed: true, processed_at: new Date().toISOString() })
      .eq('resource_id', data?.id)
      .eq('processed', false)

    // Sempre retornar 200 OK para o Mercado Pago saber que recebemos
    res.status(200).json({ received: true })
  } catch (error) {
    console.error('❌ Erro ao processar webhook:', error)

    // Mesmo com erro, retornar 200 para não ficar recebendo o mesmo evento
    res.status(200).json({ received: true, error: error.message })
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

// ============================================
// ROTAS DE EMAIL (RESEND)
// ============================================

// Enviar código de verificação
app.post('/api/email/send-verification', async (req, res) => {
  try {
    const { to, code, userName } = req.body

    if (!to || !code || !userName) {
      return res.status(400).json({ error: 'Campos obrigatórios: to, code, userName' })
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  <tr>
                    <td style="background: linear-gradient(to right, #fb923c, #f97316, #ea580c); padding: 2px 0;"></td>
                  </tr>
                  <tr>
                    <td style="padding: 40px 40px 20px; text-align: center;">
                      <h1 style="margin: 0; color: #111827; font-size: 28px; font-weight: bold;">${APP_NAME}</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 0 40px 40px;">
                      <p style="margin: 0 0 20px; color: #374151; font-size: 16px;">Olá <strong>${userName}</strong>,</p>
                      <p style="margin: 0 0 30px; color: #374151; font-size: 16px;">Bem-vindo ao ${APP_NAME}! Para confirmar seu cadastro, utilize o código de verificação abaixo:</p>
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 30px;">
                        <tr>
                          <td align="center" style="background-color: #fff7ed; border: 2px solid #fb923c; border-radius: 12px; padding: 30px;">
                            <div style="font-size: 36px; font-weight: bold; color: #ea580c; letter-spacing: 8px; font-family: 'Courier New', monospace;">${code}</div>
                          </td>
                        </tr>
                      </table>
                      <p style="margin: 0 0 20px; color: #6b7280; font-size: 14px;">Este código é válido por <strong>15 minutos</strong>.</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="background-color: #f9fafb; padding: 30px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
                      <p style="margin: 0; color: #6b7280; font-size: 12px;">© ${new Date().getFullYear()} ${APP_NAME}. Todos os direitos reservados.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `

    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: [to],
      subject: `${APP_NAME} - Confirme seu cadastro`,
      html
    })

    if (error) {
      console.error('Erro ao enviar email:', error)
      return res.status(500).json({ error: 'Erro ao enviar email', details: error })
    }

    console.log('✅ Email de verificação enviado:', data)
    res.json({ success: true, data })
  } catch (error) {
    console.error('Erro no endpoint de email:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// Enviar confirmação de assinatura
app.post('/api/email/send-subscription', async (req, res) => {
  try {
    const { to, userName, planName, planPrice, startDate } = req.body

    if (!to || !userName || !planName || !planPrice || !startDate) {
      return res.status(400).json({ error: 'Campos obrigatórios: to, userName, planName, planPrice, startDate' })
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"></head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden;">
                  <tr><td style="background: linear-gradient(to right, #fb923c, #f97316, #ea580c); padding: 2px 0;"></td></tr>
                  <tr><td style="padding: 40px 40px 20px; text-align: center;"><h1 style="margin: 0; color: #111827; font-size: 28px;">${APP_NAME}</h1></td></tr>
                  <tr>
                    <td style="padding: 0 40px 40px;">
                      <p style="margin: 0 0 20px; color: #374151; font-size: 16px;">Olá <strong>${userName}</strong>,</p>
                      <p style="margin: 0 0 30px; color: #374151; font-size: 16px;">Sua assinatura foi confirmada com sucesso! 🎉</p>
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 30px; background-color: #fff7ed; border-radius: 12px; border: 1px solid #fb923c; overflow: hidden;">
                        <tr>
                          <td style="padding: 20px;">
                            <h2 style="margin: 0 0 15px; color: #ea580c; font-size: 20px;">Detalhes da Assinatura</h2>
                            <table width="100%" cellpadding="8" cellspacing="0">
                              <tr><td style="color: #6b7280; font-size: 14px;">Plano:</td><td style="color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${planName}</td></tr>
                              <tr><td style="color: #6b7280; font-size: 14px;">Valor:</td><td style="color: #16a34a; font-size: 14px; font-weight: 600; text-align: right;">${planPrice}</td></tr>
                              <tr><td style="color: #6b7280; font-size: 14px;">Início:</td><td style="color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${startDate}</td></tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr><td style="background-color: #f9fafb; padding: 30px 40px; text-align: center;"><p style="margin: 0; color: #6b7280; font-size: 12px;">© ${new Date().getFullYear()} ${APP_NAME}</p></td></tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `

    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: [to],
      subject: `${APP_NAME} - Assinatura Confirmada: ${planName}`,
      html
    })

    if (error) {
      console.error('Erro ao enviar email:', error)
      return res.status(500).json({ error: 'Erro ao enviar email', details: error })
    }

    console.log('✅ Email de assinatura enviado:', data)
    res.json({ success: true, data })
  } catch (error) {
    console.error('Erro no endpoint de email:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// Enviar reset de senha
/**
 * Endpoint para solicitar reset de senha
 * Gera token e envia email customizado (não usa email padrão do Supabase)
 */
app.post('/api/auth/request-password-reset', async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ error: 'Email é obrigatório' })
    }

    console.log('🔑 Solicitação de reset de senha para:', email)

    // 1. Verificar se usuário existe
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()

    if (authError) {
      console.error('Erro ao buscar usuários:', authError)
      // Por segurança, não revelar se email existe ou não
      return res.json({ success: true, message: 'Se o email existir, você receberá instruções para resetar sua senha.' })
    }

    const user = authUsers.users.find(u => u.email === email)

    if (!user) {
      console.log('❌ Usuário não encontrado:', email)
      // Por segurança, não revelar se email existe ou não
      return res.json({ success: true, message: 'Se o email existir, você receberá instruções para resetar sua senha.' })
    }

    console.log('✅ Usuário encontrado:', user.id)

    // 2. Gerar token de recuperação (OTP) - válido por 1 hora
    const { data: otpData, error: otpError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: `${process.env.FRONTEND_URL}/reset-password`
      }
    })

    if (otpError) {
      console.error('Erro ao gerar token:', otpError)
      return res.status(500).json({ error: 'Erro ao gerar token de recuperação' })
    }

    console.log('🔐 Token gerado com sucesso')

    // 3. Extrair token da URL gerada pelo Supabase
    const resetLink = otpData.properties.action_link

    console.log('📧 Link de reset:', resetLink)

    // 4. Buscar nome do usuário
    const userName = user.user_metadata?.full_name || user.email.split('@')[0]

    // 5. Enviar email customizado via Resend
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Redefinir Senha - ${APP_NAME}</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #111827; min-height: 100vh;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #111827; padding: 40px 20px;">
            <tr>
              <td align="center">
                <!-- Main Container -->
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px;">

                  <!-- Logo Header -->
                  <tr>
                    <td style="padding: 30px 0; text-align: center;">
                      <table cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                        <tr>
                          <td style="background: linear-gradient(135deg, #f97316, #ea580c); width: 50px; height: 50px; border-radius: 12px; text-align: center; vertical-align: middle;">
                            <span style="color: #ffffff; font-size: 24px; font-weight: 800;">H</span>
                          </td>
                          <td style="padding-left: 12px;">
                            <span style="color: #ffffff; font-size: 24px; font-weight: 700;">Agenda</span>
                            <span style="color: #f97316; font-size: 24px; font-weight: 700;">HOF</span>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Card Principal -->
                  <tr>
                    <td>
                      <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(180deg, #1f2937 0%, #111827 100%); border-radius: 24px; border: 1px solid #374151; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">

                        <!-- Barra Laranja Top -->
                        <tr>
                          <td style="background: linear-gradient(90deg, #f97316, #ea580c, #f97316); height: 4px;"></td>
                        </tr>

                        <!-- Ícone Central -->
                        <tr>
                          <td style="padding: 40px 40px 20px; text-align: center;">
                            <table cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                              <tr>
                                <td style="background: linear-gradient(135deg, #f97316, #ea580c); width: 80px; height: 80px; border-radius: 20px; text-align: center; vertical-align: middle; box-shadow: 0 10px 40px rgba(249, 115, 22, 0.3);">
                                  <span style="font-size: 36px;">🔐</span>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>

                        <!-- Título -->
                        <tr>
                          <td style="padding: 0 40px 10px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                              Redefinir sua senha
                            </h1>
                          </td>
                        </tr>

                        <!-- Subtítulo -->
                        <tr>
                          <td style="padding: 0 40px 30px; text-align: center;">
                            <p style="margin: 0; color: #9ca3af; font-size: 16px; line-height: 1.6;">
                              Olá <span style="color: #f97316; font-weight: 600;">${userName}</span>, recebemos uma solicitação para redefinir a senha da sua conta.
                            </p>
                          </td>
                        </tr>

                        <!-- Botão CTA -->
                        <tr>
                          <td style="padding: 0 40px 30px; text-align: center;">
                            <table cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                              <tr>
                                <td style="background: linear-gradient(135deg, #f97316, #ea580c); border-radius: 14px; box-shadow: 0 10px 30px rgba(249, 115, 22, 0.4);">
                                  <a href="${resetLink}" style="display: inline-block; padding: 18px 50px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; letter-spacing: 0.3px;">
                                    Redefinir minha senha
                                  </a>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>

                        <!-- Informações de Segurança -->
                        <tr>
                          <td style="padding: 0 40px 30px;">
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: rgba(249, 115, 22, 0.1); border: 1px solid rgba(249, 115, 22, 0.2); border-radius: 16px;">
                              <tr>
                                <td style="padding: 20px;">
                                  <table width="100%" cellpadding="0" cellspacing="0">
                                    <tr>
                                      <td style="padding-bottom: 12px;">
                                        <span style="color: #f97316; font-size: 14px;">⏱️</span>
                                        <span style="color: #d1d5db; font-size: 14px; margin-left: 8px;">Este link expira em <strong style="color: #f97316;">1 hora</strong></span>
                                      </td>
                                    </tr>
                                    <tr>
                                      <td>
                                        <span style="color: #f97316; font-size: 14px;">🛡️</span>
                                        <span style="color: #d1d5db; font-size: 14px; margin-left: 8px;">Se você não solicitou, ignore este email</span>
                                      </td>
                                    </tr>
                                  </table>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>

                        <!-- Link Alternativo -->
                        <tr>
                          <td style="padding: 0 40px 30px;">
                            <p style="margin: 0 0 10px; color: #6b7280; font-size: 12px; text-align: center;">
                              Caso o botão não funcione, copie e cole este link:
                            </p>
                            <p style="margin: 0; padding: 12px; background-color: #1f2937; border-radius: 8px; border: 1px solid #374151;">
                              <a href="${resetLink}" style="color: #f97316; font-size: 11px; word-break: break-all; text-decoration: none;">
                                ${resetLink}
                              </a>
                            </p>
                          </td>
                        </tr>

                      </table>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="padding: 30px 20px; text-align: center;">
                      <p style="margin: 0 0 8px; color: #6b7280; font-size: 13px;">
                        © ${new Date().getFullYear()} <span style="color: #9ca3af;">Agenda</span> <span style="color: #f97316;">HOF</span>
                      </p>
                      <p style="margin: 0; color: #4b5563; font-size: 12px;">
                        Gestão completa da sua clínica
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `

    const { data: emailData, error: emailError } = await resend.emails.send({
      from: EMAIL_FROM,
      to: [email],
      subject: `${APP_NAME} - Redefinir Senha`,
      html
    })

    if (emailError) {
      console.error('❌ Erro ao enviar email:', emailError)
      return res.status(500).json({ error: 'Erro ao enviar email de recuperação' })
    }

    console.log('✅ Email de reset enviado com sucesso:', emailData)

    res.json({
      success: true,
      message: 'Email de recuperação enviado com sucesso!',
      data: emailData
    })

  } catch (error) {
    console.error('❌ Erro no endpoint de reset de senha:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// ===============================================
// STRIPE - APPLE PAY (iOS) e CARTÃO DIGITADO
// ===============================================

// Pagamento único com Apple Pay
app.post('/api/stripe/apple-pay', handleApplePayPayment)

// Criar assinatura recorrente com Apple Pay
app.post('/api/stripe/create-subscription-apple-pay', handleApplePaySubscription)

// Criar assinatura com cartão digitado (iOS/Web)
app.post('/api/stripe/create-subscription', handleCreateSubscription)

// Cancelar assinatura Stripe
app.post('/api/stripe/cancel-subscription', cancelStripeSubscription)

// Buscar assinatura Stripe
app.get('/api/stripe/subscription/:subscriptionId', getStripeSubscription)

// Criar PaymentIntent (para fluxo iOS)
app.post('/api/stripe/create-payment-intent', createPaymentIntent)

// Webhook do Stripe (para receber notificações)
app.post('/api/stripe/webhook',
  express.raw({ type: 'application/json' }),
  (req, res) => handleStripeWebhook(req, res, supabase)
)

// Buscar histórico de pagamentos do Stripe
app.get('/api/stripe/payment-history/:email', getStripePaymentHistory)

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
  console.log('\n✅ Endpoints disponíveis (Email):')
  console.log('  - POST /api/email/send-verification ⭐ Código de verificação')
  console.log('  - POST /api/email/send-subscription ⭐ Confirmação de assinatura')
  console.log('\n✅ Endpoints disponíveis (Auth):')
  console.log('  - POST /api/auth/request-password-reset ⭐ Solicitação de reset de senha')
  console.log('\n✅ Endpoints disponíveis (Stripe - iOS/Web):')
  console.log('  - POST /api/stripe/apple-pay ⭐ Pagamento único (Apple Pay)')
  console.log('  - POST /api/stripe/create-subscription-apple-pay ⭐ Assinatura (Apple Pay)')
  console.log('  - POST /api/stripe/create-subscription ⭐ Assinatura (Cartão digitado)')
  console.log('  - POST /api/stripe/cancel-subscription')
  console.log('  - GET  /api/stripe/subscription/:id')
  console.log('  - POST /api/stripe/create-payment-intent')
  console.log('  - POST /api/stripe/webhook ⭐ Notificações')
  console.log('\n💡 Use Ctrl+C para parar o servidor\n')
})
