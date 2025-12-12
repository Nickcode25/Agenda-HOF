/**
 * Middleware de Seguranca - Agenda HOF
 *
 * Implementa:
 * - Rate limiting
 * - Sanitizacao de inputs (prevencao XSS)
 * - Validacao de tokens
 * - Headers de seguranca
 */

const rateLimit = require('express-rate-limit')
const validator = require('validator')

// ============================================
// RATE LIMITING
// ============================================

/**
 * Rate limiter global - 100 requisicoes por IP a cada 15 minutos
 */
const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100,
  message: {
    error: 'Muitas requisicoes. Tente novamente em alguns minutos.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Usar X-Forwarded-For se disponivel (para proxies/load balancers)
    return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
           req.connection.remoteAddress ||
           req.ip
  }
})

/**
 * Rate limiter para autenticacao - 5 tentativas por IP a cada 15 minutos
 * Mais restritivo para prevenir ataques de forca bruta
 */
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5,
  message: {
    error: 'Muitas tentativas de autenticacao. Aguarde 15 minutos.',
    code: 'AUTH_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true // Nao conta requisicoes bem-sucedidas
})

/**
 * Rate limiter para emails - 3 por IP a cada 5 minutos
 * Previne spam de emails
 */
const emailRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: 3,
  message: {
    error: 'Limite de envio de emails atingido. Aguarde alguns minutos.',
    code: 'EMAIL_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
})

/**
 * Rate limiter para webhooks - 1000 por minuto
 * Webhooks sao automatizados, precisam de limite alto
 */
const webhookRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 1000,
  message: {
    error: 'Limite de webhooks atingido',
    code: 'WEBHOOK_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
})

/**
 * Rate limiter para pagamentos - 10 por IP a cada 10 minutos
 */
const paymentRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutos
  max: 10,
  message: {
    error: 'Muitas tentativas de pagamento. Aguarde alguns minutos.',
    code: 'PAYMENT_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
})

// ============================================
// SANITIZACAO DE INPUTS
// ============================================

/**
 * Sanitiza uma string para prevenir XSS
 * Remove tags HTML e escapa caracteres perigosos
 */
function sanitizeString(str) {
  if (typeof str !== 'string') return str

  // Escapa HTML
  let sanitized = validator.escape(str)

  // Remove possiveis tentativas de injecao de script
  sanitized = sanitized
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .replace(/data:/gi, '')

  return sanitized.trim()
}

/**
 * Sanitiza um objeto recursivamente
 */
function sanitizeObject(obj) {
  if (obj === null || obj === undefined) return obj

  if (typeof obj === 'string') {
    return sanitizeString(obj)
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item))
  }

  if (typeof obj === 'object') {
    const sanitized = {}
    for (const key of Object.keys(obj)) {
      // Sanitiza a chave tambem (previne prototype pollution)
      const safeKey = sanitizeString(key)
      if (safeKey === '__proto__' || safeKey === 'constructor' || safeKey === 'prototype') {
        continue // Ignora chaves perigosas
      }
      sanitized[safeKey] = sanitizeObject(obj[key])
    }
    return sanitized
  }

  return obj
}

/**
 * Middleware de sanitizacao de inputs
 * Sanitiza req.body, req.query e req.params
 */
function sanitizeInputs(req, res, next) {
  try {
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeObject(req.body)
    }

    if (req.query && typeof req.query === 'object') {
      req.query = sanitizeObject(req.query)
    }

    if (req.params && typeof req.params === 'object') {
      req.params = sanitizeObject(req.params)
    }

    next()
  } catch (error) {
    console.error('Erro na sanitizacao:', error)
    next()
  }
}

// ============================================
// VALIDACAO DE TOKENS E AUTENTICACAO
// ============================================

const { createClient } = require('@supabase/supabase-js')

// Inicializar Supabase para validacao de tokens
const supabase = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
  : null

/**
 * Middleware para validar token de autenticacao
 * Verifica o token JWT do Supabase
 */
async function validateAuthToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader) {
      return res.status(401).json({
        error: 'Token de autenticacao nao fornecido',
        code: 'MISSING_AUTH_TOKEN'
      })
    }

    // Extrair token do header "Bearer <token>"
    const token = authHeader.replace('Bearer ', '').trim()

    if (!token) {
      return res.status(401).json({
        error: 'Token de autenticacao invalido',
        code: 'INVALID_AUTH_TOKEN'
      })
    }

    if (!supabase) {
      console.warn('Supabase nao configurado - validacao de token ignorada')
      return next()
    }

    // Validar token com Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      return res.status(401).json({
        error: 'Token expirado ou invalido',
        code: 'EXPIRED_OR_INVALID_TOKEN'
      })
    }

    // Adicionar usuario ao request para uso nas rotas
    req.user = user
    req.userId = user.id

    next()
  } catch (error) {
    console.error('Erro na validacao do token:', error)
    return res.status(500).json({
      error: 'Erro ao validar autenticacao',
      code: 'AUTH_VALIDATION_ERROR'
    })
  }
}

/**
 * Middleware opcional de autenticacao
 * Adiciona usuario ao request se token valido, mas nao bloqueia
 */
async function optionalAuthToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !supabase) {
      return next()
    }

    const token = authHeader.replace('Bearer ', '').trim()

    if (!token) {
      return next()
    }

    const { data: { user } } = await supabase.auth.getUser(token)

    if (user) {
      req.user = user
      req.userId = user.id
    }

    next()
  } catch (error) {
    // Erro silencioso - autenticacao opcional
    next()
  }
}

// ============================================
// VALIDACAO DE WEBHOOK STRIPE
// ============================================

const stripe = process.env.STRIPE_SECRET_KEY
  ? require('stripe')(process.env.STRIPE_SECRET_KEY)
  : null

/**
 * Middleware para validar assinatura de webhook do Stripe
 * DEVE ser usado com express.raw() no body parser
 */
function validateStripeWebhook(req, res, next) {
  const sig = req.headers['stripe-signature']
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET nao configurado!')
    return res.status(500).json({
      error: 'Webhook nao configurado corretamente',
      code: 'WEBHOOK_CONFIG_ERROR'
    })
  }

  if (!sig) {
    console.warn('Webhook recebido sem assinatura Stripe')
    return res.status(400).json({
      error: 'Assinatura do webhook ausente',
      code: 'MISSING_WEBHOOK_SIGNATURE'
    })
  }

  if (!stripe) {
    console.error('Stripe nao inicializado')
    return res.status(500).json({
      error: 'Servico de pagamento nao disponivel',
      code: 'PAYMENT_SERVICE_UNAVAILABLE'
    })
  }

  try {
    // Usar req.body como Buffer (requer express.raw())
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      webhookSecret
    )

    // Adicionar evento validado ao request
    req.stripeEvent = event

    console.log('Webhook Stripe validado:', event.type)
    next()
  } catch (error) {
    console.error('Falha na validacao do webhook Stripe:', error.message)
    return res.status(400).json({
      error: 'Assinatura do webhook invalida',
      code: 'INVALID_WEBHOOK_SIGNATURE'
    })
  }
}

// ============================================
// VALIDACOES DE INPUT ESPECIFICAS
// ============================================

/**
 * Valida formato de email
 */
function isValidEmail(email) {
  return typeof email === 'string' && validator.isEmail(email)
}

/**
 * Valida UUID
 */
function isValidUUID(uuid) {
  return typeof uuid === 'string' && validator.isUUID(uuid)
}

/**
 * Valida valor monetario (positivo, ate 2 casas decimais)
 */
function isValidAmount(amount) {
  if (typeof amount !== 'number') return false
  if (amount <= 0) return false
  if (amount > 999999.99) return false

  // Verificar se tem no maximo 2 casas decimais
  const decimalPart = amount.toString().split('.')[1]
  if (decimalPart && decimalPart.length > 2) return false

  return true
}

/**
 * Middleware de validacao para endpoints de pagamento
 */
function validatePaymentInput(req, res, next) {
  const { customerEmail, amount } = req.body

  if (customerEmail && !isValidEmail(customerEmail)) {
    return res.status(400).json({
      error: 'Email invalido',
      code: 'INVALID_EMAIL'
    })
  }

  if (amount !== undefined && !isValidAmount(amount)) {
    return res.status(400).json({
      error: 'Valor invalido',
      code: 'INVALID_AMOUNT'
    })
  }

  next()
}

/**
 * Middleware de validacao para endpoints de email
 */
function validateEmailInput(req, res, next) {
  const { to, code, userName } = req.body

  if (!to || !isValidEmail(to)) {
    return res.status(400).json({
      error: 'Email de destino invalido',
      code: 'INVALID_EMAIL'
    })
  }

  if (code && (typeof code !== 'string' || code.length > 10)) {
    return res.status(400).json({
      error: 'Codigo invalido',
      code: 'INVALID_CODE'
    })
  }

  if (userName && (typeof userName !== 'string' || userName.length > 100)) {
    return res.status(400).json({
      error: 'Nome invalido',
      code: 'INVALID_NAME'
    })
  }

  next()
}

// ============================================
// HEADERS DE SEGURANCA
// ============================================

/**
 * Middleware para adicionar headers de seguranca
 */
function securityHeaders(req, res, next) {
  // Prevenir clickjacking
  res.setHeader('X-Frame-Options', 'DENY')

  // Prevenir MIME sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff')

  // XSS Protection (navegadores antigos)
  res.setHeader('X-XSS-Protection', '1; mode=block')

  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')

  // Content Security Policy basica
  res.setHeader('Content-Security-Policy', "default-src 'self'")

  // Remover header que expoe tecnologia
  res.removeHeader('X-Powered-By')

  next()
}

// ============================================
// EXPORTS
// ============================================

module.exports = {
  // Rate limiters
  globalRateLimiter,
  authRateLimiter,
  emailRateLimiter,
  webhookRateLimiter,
  paymentRateLimiter,

  // Sanitizacao
  sanitizeInputs,
  sanitizeString,
  sanitizeObject,

  // Autenticacao
  validateAuthToken,
  optionalAuthToken,

  // Webhook
  validateStripeWebhook,

  // Validacoes
  isValidEmail,
  isValidUUID,
  isValidAmount,
  validatePaymentInput,
  validateEmailInput,

  // Headers
  securityHeaders
}
