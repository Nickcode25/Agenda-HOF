const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const { createClient } = require('@supabase/supabase-js')
const { Resend } = require('resend')

// Carregar .env apenas se nao estiver em producao
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

// Swagger para documentacao da API
const { setupSwagger } = require('./swagger')

// Logger centralizado
const logger = require('./utils/logger')

// Middleware de seguranca
const {
  globalRateLimiter,
  authRateLimiter,
  emailRateLimiter,
  webhookRateLimiter,
  paymentRateLimiter,
  sanitizeInputs,
  validateStripeWebhook,
  validatePaymentInput,
  validateEmailInput,
  securityHeaders
} = require('./middleware/security')

// Stripe para Apple Pay (iOS) e Cartao Digitado
const {
  handleApplePayPayment,
  handleApplePaySubscription,
  handleCreateSubscription,
  cancelSubscription: cancelStripeSubscription,
  getSubscription: getStripeSubscription,
  createPaymentIntent,
  handleWebhook: handleStripeWebhook,
  getPaymentHistory: getStripePaymentHistory,
  updateSubscriptionPlan: updateStripeSubscriptionPlan
} = require('./routes/stripe-apple-pay')

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
  'http://localhost:5173',
  'http://localhost:5175',
  'http://localhost:5176',
  'http://localhost:5177'
]

app.use(cors({
  origin: function(origin, callback) {
    // Permitir requisicoes sem origin (mobile apps, postman, etc)
    if (!origin) return callback(null, true)

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      logger.warn('Origem bloqueada por CORS:', origin)
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true
}))

// ============================================
// MIDDLEWARE DE SEGURANCA
// ============================================

// Helmet para headers de seguranca HTTP
app.use(helmet({
  contentSecurityPolicy: false, // Desabilitar CSP para permitir APIs externas
  crossOriginEmbedderPolicy: false
}))

// Headers de seguranca customizados
app.use(securityHeaders)

// Rate limiting global
app.use(globalRateLimiter)

// Webhook do Stripe DEVE vir ANTES do express.json() para receber raw body
app.post('/api/stripe/webhook',
  webhookRateLimiter,
  express.raw({ type: 'application/json' }),
  validateStripeWebhook,
  (req, res) => {
    // Usar o evento ja validado pelo middleware
    handleStripeWebhook(req, res, supabase, req.stripeEvent)
  }
)

// JSON parser para outras rotas
app.use(express.json({ limit: '10kb' })) // Limitar tamanho do body

// Sanitizacao de inputs para prevenir XSS
app.use(sanitizeInputs)

// Configuração do Resend
const resend = new Resend(process.env.RESEND_API_KEY)
const EMAIL_FROM = process.env.EMAIL_FROM || 'onboarding@resend.dev'
const APP_NAME = 'Agenda HOF'

// Debug de variáveis (apenas em desenvolvimento)
logger.debug('Variaveis de ambiente:', {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  FRONTEND_URL: process.env.FRONTEND_URL,
  STRIPE_KEY_EXISTS: !!process.env.STRIPE_SECRET_KEY
})

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    paymentProvider: 'Stripe'
  })
})

// ============================================
// ROTAS DE EMAIL (RESEND)
// ============================================

// Enviar codigo de verificacao
app.post('/api/email/send-verification', emailRateLimiter, validateEmailInput, async (req, res) => {
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
      logger.error('Erro ao enviar email:', error)
      return res.status(500).json({ error: 'Erro ao enviar email', details: error })
    }

    logger.info('Email de verificacao enviado para:', to)
    res.json({ success: true, data })
  } catch (error) {
    logger.error('Erro no endpoint de email:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// Enviar confirmacao de assinatura
app.post('/api/email/send-subscription', emailRateLimiter, async (req, res) => {
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
      logger.error('Erro ao enviar email de assinatura:', error)
      return res.status(500).json({ error: 'Erro ao enviar email', details: error })
    }

    logger.info('Email de assinatura enviado para:', to)
    res.json({ success: true, data })
  } catch (error) {
    logger.error('Erro no endpoint de assinatura:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

/**
 * Endpoint para solicitar reset de senha
 * Gera token e envia email customizado (não usa email padrão do Supabase)
 */
app.post('/api/auth/request-password-reset', authRateLimiter, async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ error: 'Email é obrigatório' })
    }

    logger.info('Solicitacao de reset de senha para:', email)

    // 1. Verificar se usuário existe
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()

    if (authError) {
      logger.error('Erro ao buscar usuarios:', authError)
      return res.json({ success: true, message: 'Se o email existir, você receberá instruções para resetar sua senha.' })
    }

    const user = authUsers.users.find(u => u.email === email)

    if (!user) {
      logger.debug('Usuario nao encontrado:', email)
      return res.json({ success: true, message: 'Se o email existir, você receberá instruções para resetar sua senha.' })
    }

    logger.debug('Usuario encontrado:', user.id)

    // 2. Gerar token de recuperação (OTP) - válido por 1 hora
    const { data: otpData, error: otpError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: `${process.env.FRONTEND_URL}/reset-password`
      }
    })

    if (otpError) {
      logger.error('Erro ao gerar token:', otpError)
      return res.status(500).json({ error: 'Erro ao gerar token de recuperação' })
    }

    logger.debug('Token de reset gerado com sucesso')

    const resetLink = otpData.properties.action_link

    const userName = user.user_metadata?.full_name || user.email.split('@')[0]

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Redefinir Senha - ${APP_NAME}</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb; min-height: 100vh;">
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
                    <td style="padding: 0 40px 30px; text-align: center;">
                      <h2 style="margin: 0; color: #111827; font-size: 24px;">Redefinir sua senha</h2>
                      <p style="margin: 15px 0 0; color: #6b7280; font-size: 16px;">
                        Olá <span style="color: #ea580c; font-weight: 600;">${userName}</span>, recebemos uma solicitação para redefinir a senha da sua conta.
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 0 40px 30px; text-align: center;">
                      <a href="${resetLink}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(to right, #f97316, #ea580c); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 12px;">
                        Redefinir minha senha
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 0 40px 30px;">
                      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fff7ed; border: 1px solid #fb923c; border-radius: 12px;">
                        <tr>
                          <td style="padding: 20px;">
                            <p style="margin: 0 0 10px; color: #374151; font-size: 14px;">⏱️ Este link expira em <strong style="color: #ea580c;">1 hora</strong></p>
                            <p style="margin: 0; color: #374151; font-size: 14px;">🛡️ Se você não solicitou, ignore este email</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 0 40px 30px;">
                      <p style="margin: 0 0 10px; color: #6b7280; font-size: 12px; text-align: center;">
                        Caso o botão não funcione, copie e cole este link:
                      </p>
                      <p style="margin: 0; padding: 12px; background-color: #f3f4f6; border-radius: 8px; word-break: break-all;">
                        <a href="${resetLink}" style="color: #ea580c; font-size: 11px; text-decoration: none;">
                          ${resetLink}
                        </a>
                      </p>
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

    const { data: emailData, error: emailError } = await resend.emails.send({
      from: EMAIL_FROM,
      to: [email],
      subject: `${APP_NAME} - Redefinir Senha`,
      html
    })

    if (emailError) {
      logger.error('Erro ao enviar email de reset:', emailError)
      return res.status(500).json({ error: 'Erro ao enviar email de recuperação' })
    }

    logger.info('Email de reset enviado para:', email)

    res.json({
      success: true,
      message: 'Email de recuperação enviado com sucesso!',
      data: emailData
    })

  } catch (error) {
    logger.error('Erro no endpoint de reset de senha:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// ===============================================
// STRIPE - APPLE PAY (iOS) e CARTÃO DIGITADO
// ===============================================

// Pagamento unico com Apple Pay
app.post('/api/stripe/apple-pay', paymentRateLimiter, validatePaymentInput, handleApplePayPayment)

// Criar assinatura recorrente com Apple Pay
app.post('/api/stripe/create-subscription-apple-pay', paymentRateLimiter, validatePaymentInput, handleApplePaySubscription)

// Criar assinatura com cartao digitado (iOS/Web)
app.post('/api/stripe/create-subscription', paymentRateLimiter, validatePaymentInput, handleCreateSubscription)

// Cancelar assinatura Stripe
app.post('/api/stripe/cancel-subscription', paymentRateLimiter, cancelStripeSubscription)

// Buscar assinatura Stripe
app.get('/api/stripe/subscription/:subscriptionId', getStripeSubscription)

// Criar PaymentIntent (para fluxo iOS)
app.post('/api/stripe/create-payment-intent', paymentRateLimiter, validatePaymentInput, createPaymentIntent)

// NOTA: Webhook do Stripe registrado acima ANTES do express.json()

// Buscar histórico de pagamentos do Stripe
app.get('/api/stripe/payment-history/:email', getStripePaymentHistory)

// Alterar plano de assinatura (Admin)
app.post('/api/stripe/update-subscription-plan', updateStripeSubscriptionPlan)

// ============================================
// SWAGGER - DOCUMENTACAO DA API
// ============================================
setupSwagger(app)

// Iniciar servidor
app.listen(PORT, () => {
  console.log('\n🚀 Backend Agenda HOF iniciado!')
  console.log(`📡 Servidor rodando em http://localhost:${PORT}`)
  console.log(`🌐 Frontend esperado em ${process.env.FRONTEND_URL}`)
  console.log('\n📚 Documentacao da API:')
  console.log(`  - Swagger UI: http://localhost:${PORT}/api/docs`)
  console.log(`  - OpenAPI JSON: http://localhost:${PORT}/api/docs.json`)
  console.log('\n✅ Endpoints disponíveis (Email):')
  console.log('  - POST /api/email/send-verification - Código de verificação')
  console.log('  - POST /api/email/send-subscription - Confirmação de assinatura')
  console.log('\n✅ Endpoints disponíveis (Auth):')
  console.log('  - POST /api/auth/request-password-reset - Solicitação de reset de senha')
  console.log('\n✅ Endpoints disponíveis (Stripe):')
  console.log('  - POST /api/stripe/apple-pay - Pagamento único (Apple Pay)')
  console.log('  - POST /api/stripe/create-subscription-apple-pay - Assinatura (Apple Pay)')
  console.log('  - POST /api/stripe/create-subscription - Assinatura (Cartão digitado)')
  console.log('  - POST /api/stripe/cancel-subscription')
  console.log('  - POST /api/stripe/update-subscription-plan - Alterar plano (Admin)')
  console.log('  - GET  /api/stripe/subscription/:id')
  console.log('  - POST /api/stripe/create-payment-intent')
  console.log('  - POST /api/stripe/webhook - Notificações')
  console.log('  - GET  /api/stripe/payment-history/:email')
  console.log('\n💡 Use Ctrl+C para parar o servidor\n')
})
