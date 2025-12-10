/**
 * Rotas do Stripe para Apple Pay
 * Integração com iOS App - Agenda HOF
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

/**
 * Processar pagamento único com Apple Pay
 * POST /api/stripe/apple-pay
 */
async function handleApplePayPayment(req, res) {
  try {
    const {
      paymentMethodId,
      amount,
      currency = 'brl',
      description,
      customerEmail,
      customerName,
      metadata = {}
    } = req.body

    console.log('🍎 Processando pagamento Apple Pay:', {
      amount,
      currency,
      customerEmail,
      description
    })

    // Validar dados obrigatórios
    if (!paymentMethodId || !amount) {
      return res.status(400).json({
        error: 'Dados obrigatórios faltando',
        required: ['paymentMethodId', 'amount']
      })
    }

    // Criar ou buscar cliente no Stripe
    let customer
    if (customerEmail) {
      const existingCustomers = await stripe.customers.list({
        email: customerEmail,
        limit: 1
      })

      if (existingCustomers.data.length > 0) {
        customer = existingCustomers.data[0]
        console.log('👤 Cliente existente encontrado:', customer.id)
      } else {
        customer = await stripe.customers.create({
          email: customerEmail,
          name: customerName,
          metadata: {
            source: 'ios_app',
            ...metadata
          }
        })
        console.log('👤 Novo cliente criado:', customer.id)
      }
    }

    // Criar PaymentIntent
    const paymentIntentData = {
      amount: Math.round(amount * 100), // Stripe usa centavos
      currency: currency.toLowerCase(),
      payment_method: paymentMethodId,
      confirmation_method: 'automatic',
      confirm: true,
      description: description || 'Agenda HOF - Pagamento',
      metadata: {
        source: 'apple_pay',
        app: 'ios',
        ...metadata
      },
      // Configurações para Apple Pay
      payment_method_options: {
        card: {
          request_three_d_secure: 'automatic'
        }
      }
    }

    if (customer) {
      paymentIntentData.customer = customer.id
    }

    // Necessário para evitar problemas de redirect no mobile
    paymentIntentData.return_url = process.env.STRIPE_RETURN_URL || 'agendahof://payment-complete'

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentData)

    console.log('✅ PaymentIntent criado:', paymentIntent.id, 'Status:', paymentIntent.status)

    // Resposta baseada no status
    if (paymentIntent.status === 'succeeded') {
      res.json({
        success: true,
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status,
        amount: amount,
        currency: currency,
        receiptUrl: paymentIntent.charges?.data[0]?.receipt_url
      })
    } else if (paymentIntent.status === 'requires_action') {
      // 3D Secure necessário
      res.json({
        success: false,
        requiresAction: true,
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        status: paymentIntent.status
      })
    } else {
      res.json({
        success: false,
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status,
        message: 'Pagamento não concluído'
      })
    }

  } catch (error) {
    console.error('❌ Erro no pagamento Apple Pay:', error)

    // Tratar erros específicos do Stripe
    if (error.type === 'StripeCardError') {
      return res.status(400).json({
        error: error.message,
        code: error.code,
        declineCode: error.decline_code
      })
    }

    res.status(500).json({
      error: error.message || 'Erro ao processar pagamento',
      code: error.code
    })
  }
}

/**
 * Criar assinatura recorrente com Apple Pay
 * POST /api/stripe/create-subscription-apple-pay
 */
async function handleApplePaySubscription(req, res) {
  try {
    const {
      paymentMethodId,
      customerEmail,
      customerName,
      customerPhone,
      priceId,          // ID do Price criado no Stripe Dashboard
      amount,           // Valor da assinatura (se não usar priceId)
      planName,
      trialDays = 0,
      metadata = {}
    } = req.body

    console.log('🍎 Criando assinatura Apple Pay:', {
      customerEmail,
      priceId,
      amount,
      planName
    })

    // Validar dados obrigatórios
    if (!paymentMethodId || !customerEmail) {
      return res.status(400).json({
        error: 'Dados obrigatórios faltando',
        required: ['paymentMethodId', 'customerEmail']
      })
    }

    if (!priceId && !amount) {
      return res.status(400).json({
        error: 'Informe priceId ou amount',
        required: ['priceId ou amount']
      })
    }

    // 1. Criar ou buscar cliente
    let customer
    const existingCustomers = await stripe.customers.list({
      email: customerEmail,
      limit: 1
    })

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0]
      console.log('👤 Cliente existente:', customer.id)

      // Atualizar método de pagamento padrão
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customer.id
      })

      await stripe.customers.update(customer.id, {
        invoice_settings: {
          default_payment_method: paymentMethodId
        }
      })
    } else {
      customer = await stripe.customers.create({
        email: customerEmail,
        name: customerName,
        phone: customerPhone,
        payment_method: paymentMethodId,
        invoice_settings: {
          default_payment_method: paymentMethodId
        },
        metadata: {
          source: 'ios_app',
          ...metadata
        }
      })
      console.log('👤 Novo cliente criado:', customer.id)
    }

    // 2. Criar Price dinamicamente se não tiver priceId
    let finalPriceId = priceId

    if (!priceId && amount) {
      // Criar produto e price dinâmico
      const product = await stripe.products.create({
        name: planName || 'Agenda HOF - Plano Profissional',
        metadata: {
          source: 'ios_app'
        }
      })

      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(amount * 100), // Centavos
        currency: 'brl',
        recurring: {
          interval: 'month',
          interval_count: 1
        }
      })

      finalPriceId = price.id
      console.log('💰 Price criado dinamicamente:', finalPriceId)
    }

    // 3. Criar assinatura
    const subscriptionData = {
      customer: customer.id,
      items: [{ price: finalPriceId }],
      default_payment_method: paymentMethodId,
      payment_behavior: 'default_incomplete',
      payment_settings: {
        payment_method_types: ['card'],
        save_default_payment_method: 'on_subscription'
      },
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        source: 'apple_pay',
        app: 'ios',
        plan_name: planName || 'Profissional',
        ...metadata
      }
    }

    // Adicionar trial se especificado
    if (trialDays > 0) {
      subscriptionData.trial_period_days = trialDays
    }

    const subscription = await stripe.subscriptions.create(subscriptionData)

    console.log('✅ Assinatura criada:', subscription.id, 'Status:', subscription.status)

    // Verificar se precisa de confirmação
    const invoice = subscription.latest_invoice
    const paymentIntent = invoice?.payment_intent

    if (subscription.status === 'active' || subscription.status === 'trialing') {
      res.json({
        success: true,
        subscriptionId: subscription.id,
        customerId: customer.id,
        status: subscription.status,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
        trialEnd: subscription.trial_end
          ? new Date(subscription.trial_end * 1000).toISOString()
          : null
      })
    } else if (paymentIntent?.status === 'requires_action') {
      res.json({
        success: false,
        requiresAction: true,
        subscriptionId: subscription.id,
        clientSecret: paymentIntent.client_secret,
        status: subscription.status
      })
    } else {
      res.json({
        success: false,
        subscriptionId: subscription.id,
        status: subscription.status,
        paymentStatus: paymentIntent?.status,
        message: 'Assinatura criada, aguardando confirmação do pagamento'
      })
    }

  } catch (error) {
    console.error('❌ Erro na assinatura Apple Pay:', error)

    if (error.type === 'StripeCardError') {
      return res.status(400).json({
        error: error.message,
        code: error.code,
        declineCode: error.decline_code
      })
    }

    res.status(500).json({
      error: error.message || 'Erro ao criar assinatura',
      code: error.code
    })
  }
}

/**
 * Cancelar assinatura
 * POST /api/stripe/cancel-subscription
 */
async function cancelSubscription(req, res) {
  try {
    const { subscriptionId, immediately = false } = req.body

    console.log('🚫 Cancelando assinatura:', subscriptionId)

    if (!subscriptionId) {
      return res.status(400).json({
        error: 'subscriptionId é obrigatório'
      })
    }

    let subscription

    if (immediately) {
      // Cancelar imediatamente
      subscription = await stripe.subscriptions.cancel(subscriptionId)
    } else {
      // Cancelar no fim do período
      subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true
      })
    }

    console.log('✅ Assinatura cancelada:', subscription.id)

    res.json({
      success: true,
      subscriptionId: subscription.id,
      status: subscription.status,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString()
    })

  } catch (error) {
    console.error('❌ Erro ao cancelar assinatura:', error)
    res.status(500).json({
      error: error.message || 'Erro ao cancelar assinatura'
    })
  }
}

/**
 * Buscar assinatura
 * GET /api/stripe/subscription/:subscriptionId
 */
async function getSubscription(req, res) {
  try {
    const { subscriptionId } = req.params

    console.log('🔍 Buscando assinatura:', subscriptionId)

    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['default_payment_method', 'latest_invoice']
    })

    const paymentMethod = subscription.default_payment_method

    res.json({
      id: subscription.id,
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000).toISOString(),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      trialEnd: subscription.trial_end
        ? new Date(subscription.trial_end * 1000).toISOString()
        : null,
      cardLast4: paymentMethod?.card?.last4 || '****',
      cardBrand: paymentMethod?.card?.brand || 'unknown',
      amount: subscription.items.data[0]?.price?.unit_amount / 100,
      currency: subscription.items.data[0]?.price?.currency
    })

  } catch (error) {
    console.error('❌ Erro ao buscar assinatura:', error)
    res.status(500).json({
      error: error.message || 'Erro ao buscar assinatura'
    })
  }
}

/**
 * Criar PaymentIntent para pagamento único (sem confirmar)
 * Útil para o fluxo do iOS onde o app confirma
 * POST /api/stripe/create-payment-intent
 */
async function createPaymentIntent(req, res) {
  try {
    const {
      amount,
      currency = 'brl',
      customerEmail,
      description,
      metadata = {}
    } = req.body

    console.log('💳 Criando PaymentIntent:', { amount, currency })

    if (!amount) {
      return res.status(400).json({
        error: 'amount é obrigatório'
      })
    }

    const paymentIntentData = {
      amount: Math.round(amount * 100),
      currency: currency.toLowerCase(),
      automatic_payment_methods: {
        enabled: true
      },
      description: description || 'Agenda HOF - Pagamento',
      metadata: {
        source: 'ios_app',
        ...metadata
      }
    }

    // Se tiver email, buscar/criar customer
    if (customerEmail) {
      const existingCustomers = await stripe.customers.list({
        email: customerEmail,
        limit: 1
      })

      if (existingCustomers.data.length > 0) {
        paymentIntentData.customer = existingCustomers.data[0].id
      }
    }

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentData)

    console.log('✅ PaymentIntent criado:', paymentIntent.id)

    res.json({
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: amount,
      currency: currency
    })

  } catch (error) {
    console.error('❌ Erro ao criar PaymentIntent:', error)
    res.status(500).json({
      error: error.message || 'Erro ao criar PaymentIntent'
    })
  }
}

/**
 * Webhook do Stripe
 * POST /api/stripe/webhook
 */
async function handleWebhook(req, res, supabase) {
  const sig = req.headers['stripe-signature']
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  let event

  try {
    // Verificar assinatura do webhook
    if (webhookSecret) {
      event = stripe.webhooks.constructEvent(req.rawBody || req.body, sig, webhookSecret)
    } else {
      event = req.body
      console.warn('⚠️ STRIPE_WEBHOOK_SECRET não configurado - webhook não verificado')
    }

    console.log('📬 Webhook Stripe recebido:', event.type)

    // Processar eventos
    switch (event.type) {
      case 'payment_intent.succeeded':
        console.log('✅ Pagamento bem-sucedido:', event.data.object.id)
        break

      case 'payment_intent.payment_failed':
        console.log('❌ Pagamento falhou:', event.data.object.id)
        break

      case 'customer.subscription.created':
        console.log('🆕 Assinatura criada:', event.data.object.id)
        // Salvar no Supabase se necessário
        if (supabase) {
          const subscription = event.data.object
          await supabase.from('stripe_subscriptions').upsert({
            stripe_subscription_id: subscription.id,
            stripe_customer_id: subscription.customer,
            status: subscription.status,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'stripe_subscription_id'
          })
        }
        break

      case 'customer.subscription.updated':
        console.log('🔄 Assinatura atualizada:', event.data.object.id)
        if (supabase) {
          const subscription = event.data.object
          await supabase.from('stripe_subscriptions').update({
            status: subscription.status,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
            updated_at: new Date().toISOString()
          }).eq('stripe_subscription_id', subscription.id)
        }
        break

      case 'customer.subscription.deleted':
        console.log('🗑️ Assinatura cancelada:', event.data.object.id)
        if (supabase) {
          await supabase.from('stripe_subscriptions').update({
            status: 'cancelled',
            cancelled_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }).eq('stripe_subscription_id', event.data.object.id)
        }
        break

      case 'invoice.paid':
        console.log('💰 Fatura paga:', event.data.object.id)
        break

      case 'invoice.payment_failed':
        console.log('❌ Pagamento de fatura falhou:', event.data.object.id)
        break

      default:
        console.log('📋 Evento não tratado:', event.type)
    }

    res.json({ received: true })

  } catch (error) {
    console.error('❌ Erro no webhook:', error)
    res.status(400).json({ error: error.message })
  }
}

// ============================================
// ENDPOINT: ASSINATURA COM CARTÃO DIGITADO
// ============================================

/**
 * POST /api/stripe/create-subscription
 *
 * Cria uma assinatura recorrente com paymentMethodId (criado via Stripe.js no frontend)
 */
async function handleCreateSubscription(req, res) {
  try {
    const {
      customerEmail,
      customerName,
      customerId,
      paymentMethodId,  // ID do PaymentMethod criado via Stripe.js
      amount,
      planName,
      planId,
      couponId,
      discountPercentage
    } = req.body

    console.log('💳 Criando assinatura com PaymentMethod:', paymentMethodId)

    // Validações
    if (!customerEmail) {
      return res.status(400).json({
        success: false,
        error: 'customerEmail is required'
      })
    }

    if (!paymentMethodId) {
      return res.status(400).json({
        success: false,
        error: 'paymentMethodId is required'
      })
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'amount must be greater than 0'
      })
    }

    // Converter valor para centavos (Stripe usa centavos)
    const amountInCents = Math.round(amount * 100)

    // 1. Buscar ou criar cliente no Stripe
    let customer
    const existingCustomers = await stripe.customers.list({
      email: customerEmail,
      limit: 1
    })

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0]
      console.log('👤 Cliente existente encontrado:', customer.id)
    } else {
      customer = await stripe.customers.create({
        email: customerEmail,
        name: customerName,
        metadata: {
          supabase_user_id: customerId || '',
          source: 'card_form'
        }
      })
      console.log('👤 Novo cliente criado:', customer.id)
    }

    // 2. Buscar o PaymentMethod criado no frontend
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId)
    console.log('💳 PaymentMethod recuperado:', paymentMethod.id)

    // 3. Anexar PaymentMethod ao cliente (se ainda não estiver anexado)
    if (!paymentMethod.customer) {
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customer.id
      })
      console.log('💳 PaymentMethod anexado ao cliente')
    }

    // 4. Definir como método de pagamento padrão
    await stripe.customers.update(customer.id, {
      invoice_settings: {
        default_payment_method: paymentMethodId
      }
    })

    // 5. Buscar ou criar o produto
    let product
    const products = await stripe.products.list({
      active: true,
      limit: 100
    })

    product = products.data.find(p => p.name === planName)

    if (!product) {
      product = await stripe.products.create({
        name: planName || 'Agenda HOF - Plano Profissional',
        metadata: {
          plan_id: planId || ''
        }
      })
      console.log('📦 Novo produto criado:', product.id)
    }

    // 6. Buscar ou criar o preço
    let price
    const prices = await stripe.prices.list({
      product: product.id,
      active: true,
      limit: 100
    })

    price = prices.data.find(p =>
      p.unit_amount === amountInCents &&
      p.recurring?.interval === 'month'
    )

    if (!price) {
      price = await stripe.prices.create({
        product: product.id,
        unit_amount: amountInCents,
        currency: 'brl',
        recurring: {
          interval: 'month'
        }
      })
      console.log('💰 Novo preço criado:', price.id)
    }

    // 7. Criar a assinatura
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: price.id }],
      default_payment_method: paymentMethodId,
      payment_behavior: 'error_if_incomplete',
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        supabase_user_id: customerId || '',
        coupon_id: couponId || '',
        discount_percentage: discountPercentage?.toString() || '0',
        payment_method: 'card_form'
      }
    })

    // 8. Verificar status do pagamento
    const invoice = subscription.latest_invoice
    const paymentIntent = invoice?.payment_intent

    if (subscription.status !== 'active' && subscription.status !== 'trialing') {
      // Se precisar de ação adicional (3D Secure, etc)
      if (paymentIntent?.status === 'requires_action') {
        console.log('⚠️ Pagamento requer autenticação adicional')
        return res.json({
          success: false,
          error: 'Pagamento requer autenticação adicional',
          requiresAction: true,
          clientSecret: paymentIntent.client_secret
        })
      }

      return res.json({
        success: false,
        error: 'Pagamento não foi aprovado. Verifique os dados do cartão.'
      })
    }

    // 9. Calcular próxima data de cobrança
    const nextBillingDate = new Date(subscription.current_period_end * 1000)

    console.log('✅ Assinatura criada com sucesso:', subscription.id)

    return res.json({
      success: true,
      subscriptionId: subscription.id,
      customerId: customer.id,
      status: subscription.status,
      nextBillingDate: nextBillingDate.toISOString(),
      cardLastDigits: paymentMethod.card?.last4 || '',
      cardBrand: paymentMethod.card?.brand || ''
    })

  } catch (error) {
    console.error('❌ Stripe Subscription Error:', error)

    // Tratar erros específicos do Stripe
    if (error.type === 'StripeCardError') {
      return res.status(400).json({
        success: false,
        error: getCardErrorMessage(error.code),
        code: error.code
      })
    }

    if (error.type === 'StripeInvalidRequestError') {
      return res.status(400).json({
        success: false,
        error: 'Dados do cartão inválidos',
        code: error.code
      })
    }

    return res.status(500).json({
      success: false,
      error: 'Erro interno ao processar pagamento'
    })
  }
}

/**
 * Traduz códigos de erro do Stripe para mensagens em português
 */
function getCardErrorMessage(code) {
  const messages = {
    'card_declined': 'Cartão recusado. Tente outro cartão.',
    'expired_card': 'Cartão expirado. Verifique a data de validade.',
    'incorrect_cvc': 'CVV incorreto. Verifique o código de segurança.',
    'incorrect_number': 'Número do cartão incorreto.',
    'invalid_cvc': 'CVV inválido.',
    'invalid_expiry_month': 'Mês de validade inválido.',
    'invalid_expiry_year': 'Ano de validade inválido.',
    'invalid_number': 'Número do cartão inválido.',
    'processing_error': 'Erro ao processar. Tente novamente.',
    'insufficient_funds': 'Saldo insuficiente.',
    'lost_card': 'Cartão reportado como perdido.',
    'stolen_card': 'Cartão reportado como roubado.',
    'generic_decline': 'Cartão recusado. Entre em contato com seu banco.'
  }

  return messages[code] || 'Erro ao processar cartão. Tente novamente.'
}

module.exports = {
  handleApplePayPayment,
  handleApplePaySubscription,
  handleCreateSubscription,
  cancelSubscription,
  getSubscription,
  createPaymentIntent,
  handleWebhook
}
