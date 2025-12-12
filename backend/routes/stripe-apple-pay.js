/**
 * Rotas do Stripe para Apple Pay
 * Integração com iOS App - Agenda HOF
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const { createClient } = require('@supabase/supabase-js')
const logger = require('../utils/logger')

// Inicializar Supabase para atualizar status das assinaturas
const supabase = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
  : null

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

    logger.payment('Apple Pay:', { amount, currency, customerEmail })

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
        logger.debug('Cliente existente:', customer.id)
      } else {
        customer = await stripe.customers.create({
          email: customerEmail,
          name: customerName,
          metadata: {
            source: 'ios_app',
            ...metadata
          }
        })
        logger.debug('Novo cliente criado:', customer.id)
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

    logger.info('PaymentIntent criado:', paymentIntent.id, 'Status:', paymentIntent.status)

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
    logger.error('Erro no pagamento Apple Pay:', error.message)

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

    logger.payment('Assinatura Apple Pay:', { customerEmail, priceId, amount, planName })

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
      logger.debug('Cliente existente:', customer.id)

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
      logger.debug('Novo cliente criado:', customer.id)
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
      logger.debug('Price criado dinamicamente:', finalPriceId)
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

    logger.info('Assinatura criada:', subscription.id, 'Status:', subscription.status)

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
    logger.error('Erro na assinatura Apple Pay:', error.message)

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
    const { subscriptionId, userId, immediately = false } = req.body

    logger.payment('Cancelando assinatura:', subscriptionId)

    if (!subscriptionId) {
      return res.status(400).json({
        error: 'subscriptionId é obrigatório'
      })
    }

    let stripeSubscriptionId = subscriptionId

    // Se tiver userId, buscar a assinatura no Supabase para validação
    if (userId && supabase) {
      const { data: dbSubscription, error: dbError } = await supabase
        .from('user_subscriptions')
        .select('stripe_subscription_id')
        .eq('id', subscriptionId)
        .eq('user_id', userId)
        .single()

      if (dbError) {
        // Tentar buscar pelo stripe_subscription_id diretamente
        const { data: dbSub2 } = await supabase
          .from('user_subscriptions')
          .select('stripe_subscription_id')
          .eq('stripe_subscription_id', subscriptionId)
          .eq('user_id', userId)
          .single()

        if (dbSub2) {
          stripeSubscriptionId = dbSub2.stripe_subscription_id
        }
      } else if (dbSubscription?.stripe_subscription_id) {
        stripeSubscriptionId = dbSubscription.stripe_subscription_id
      }
    }

    let subscription

    if (immediately) {
      // Cancelar imediatamente
      subscription = await stripe.subscriptions.cancel(stripeSubscriptionId)
    } else {
      // Cancelar no fim do período
      subscription = await stripe.subscriptions.update(stripeSubscriptionId, {
        cancel_at_period_end: true
      })
    }

    logger.info('Assinatura cancelada:', subscription.id)

    // Atualizar status no Supabase
    if (supabase) {
      const updateData = {
        status: immediately ? 'cancelled' : 'pending_cancellation',
        cancel_at_period_end: subscription.cancel_at_period_end,
        updated_at: new Date().toISOString()
      }

      if (immediately) {
        updateData.cancelled_at = new Date().toISOString()
      }

      const { error: updateError } = await supabase
        .from('user_subscriptions')
        .update(updateData)
        .eq('stripe_subscription_id', subscription.id)

      if (updateError) {
        logger.warn('Erro ao atualizar Supabase:', updateError.message)
      }
    }

    res.json({
      success: true,
      subscriptionId: subscription.id,
      status: subscription.status,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString()
    })

  } catch (error) {
    logger.error('Erro ao cancelar assinatura:', error.message)
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

    logger.debug('Buscando assinatura:', subscriptionId)

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
    logger.error('Erro ao buscar assinatura:', error.message)
    res.status(500).json({
      error: error.message || 'Erro ao buscar assinatura'
    })
  }
}

/**
 * Criar PaymentIntent para pagamento único (sem confirmar)
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

    logger.payment('Criando PaymentIntent:', { amount, currency })

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

    logger.info('PaymentIntent criado:', paymentIntent.id)

    res.json({
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: amount,
      currency: currency
    })

  } catch (error) {
    logger.error('Erro ao criar PaymentIntent:', error.message)
    res.status(500).json({
      error: error.message || 'Erro ao criar PaymentIntent'
    })
  }
}

/**
 * Webhook do Stripe
 * POST /api/stripe/webhook
 */
async function handleWebhook(req, res, supabase, validatedEvent = null) {
  let event

  try {
    // Se o evento foi pre-validado pelo middleware, usar ele
    if (validatedEvent) {
      event = validatedEvent
    } else {
      // Fallback para validacao inline (compatibilidade)
      const sig = req.headers['stripe-signature']
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

      if (webhookSecret && sig) {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret)
      } else {
        logger.error('Webhook recebido sem validacao!')
        return res.status(400).json({
          error: 'Webhook nao validado',
          code: 'WEBHOOK_NOT_VALIDATED'
        })
      }
    }

    logger.webhook(event.type, event.data.object.id)

    // Processar eventos
    switch (event.type) {
      case 'payment_intent.succeeded':
        logger.webhook('SUCCEEDED', event.data.object.id)
        break

      case 'payment_intent.payment_failed':
        logger.warn('Pagamento falhou:', event.data.object.id)
        break

      case 'customer.subscription.created':
        logger.webhook('SUB_CREATED', event.data.object.id)
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
        logger.webhook('SUB_UPDATED', event.data.object.id)
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
        logger.webhook('SUB_DELETED', event.data.object.id)
        if (supabase) {
          await supabase.from('stripe_subscriptions').update({
            status: 'cancelled',
            cancelled_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }).eq('stripe_subscription_id', event.data.object.id)
        }
        break

      case 'invoice.paid':
        logger.webhook('INVOICE_PAID', event.data.object.id)
        if (supabase) {
          const invoice = event.data.object
          try {
            const customer = await stripe.customers.retrieve(invoice.customer)
            const customerEmail = customer.email || invoice.customer_email

            let cardLastDigits = null
            let cardBrand = null
            if (invoice.payment_intent) {
              try {
                const paymentIntent = await stripe.paymentIntents.retrieve(invoice.payment_intent)
                if (paymentIntent.payment_method) {
                  const paymentMethod = await stripe.paymentMethods.retrieve(paymentIntent.payment_method)
                  cardLastDigits = paymentMethod.card?.last4
                  cardBrand = paymentMethod.card?.brand
                }
              } catch (e) {
                logger.debug('Nao foi possivel obter detalhes do cartao')
              }
            }

            const { error: historyError } = await supabase
              .from('payment_history')
              .insert({
                payment_id: invoice.id,
                subscription_id: invoice.subscription,
                amount: invoice.amount_paid / 100,
                status: 'approved',
                status_detail: invoice.status,
                payment_method: cardBrand ? `${cardBrand} ****${cardLastDigits}` : 'credit_card',
                payer_email: customerEmail,
                created_at: new Date(invoice.created * 1000).toISOString(),
                updated_at: new Date().toISOString()
              })

            if (historyError) {
              logger.error('Erro ao salvar historico:', historyError.message)
            }
          } catch (e) {
            logger.error('Erro ao processar fatura:', e.message)
          }
        }
        break

      case 'invoice.payment_failed':
        logger.warn('Pagamento de fatura falhou:', event.data.object.id)
        break

      default:
        logger.debug('Evento nao tratado:', event.type)
    }

    res.json({ received: true })

  } catch (error) {
    logger.error('Erro no webhook:', error.message)
    res.status(400).json({ error: error.message })
  }
}

/**
 * POST /api/stripe/create-subscription
 * Cria uma assinatura recorrente com paymentMethodId
 */
async function handleCreateSubscription(req, res) {
  try {
    const {
      customerEmail,
      customerName,
      customerId,
      paymentMethodId,
      amount,
      planName,
      planId,
      couponId,
      discountPercentage
    } = req.body

    logger.payment('Criando assinatura com cartao:', { customerEmail, amount })

    // Validações
    if (!customerEmail) {
      return res.status(400).json({ success: false, error: 'customerEmail is required' })
    }

    if (!paymentMethodId) {
      return res.status(400).json({ success: false, error: 'paymentMethodId is required' })
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, error: 'amount must be greater than 0' })
    }

    const amountInCents = Math.round(amount * 100)

    // 1. Buscar ou criar cliente no Stripe
    let customer
    const existingCustomers = await stripe.customers.list({ email: customerEmail, limit: 1 })

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0]
      logger.debug('Cliente existente:', customer.id)
    } else {
      customer = await stripe.customers.create({
        email: customerEmail,
        name: customerName,
        metadata: { supabase_user_id: customerId || '', source: 'card_form' }
      })
      logger.debug('Novo cliente criado:', customer.id)
    }

    // 2. Buscar o PaymentMethod
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId)

    // 3. Anexar PaymentMethod ao cliente
    if (!paymentMethod.customer) {
      await stripe.paymentMethods.attach(paymentMethodId, { customer: customer.id })
    }

    // 4. Definir como método de pagamento padrão
    await stripe.customers.update(customer.id, {
      invoice_settings: { default_payment_method: paymentMethodId }
    })

    // 5. Buscar ou criar o produto
    let product
    const products = await stripe.products.list({ active: true, limit: 100 })
    product = products.data.find(p => p.name === planName)

    if (!product) {
      product = await stripe.products.create({
        name: planName || 'Agenda HOF - Plano Profissional',
        metadata: { plan_id: planId || '' }
      })
    }

    // 6. Buscar ou criar o preço
    let price
    const prices = await stripe.prices.list({ product: product.id, active: true, limit: 100 })
    price = prices.data.find(p => p.unit_amount === amountInCents && p.recurring?.interval === 'month')

    if (!price) {
      price = await stripe.prices.create({
        product: product.id,
        unit_amount: amountInCents,
        currency: 'brl',
        recurring: { interval: 'month' }
      })
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
      if (paymentIntent?.status === 'requires_action') {
        logger.warn('Pagamento requer autenticacao adicional')
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

    const nextBillingDate = new Date(subscription.current_period_end * 1000)

    logger.info('Assinatura criada com sucesso:', subscription.id)

    // 9. Salvar histórico de pagamento
    if (supabase && invoice) {
      try {
        const { error: historyError } = await supabase
          .from('payment_history')
          .insert({
            payment_id: invoice.id || `sub_${subscription.id}`,
            subscription_id: subscription.id,
            amount: amount,
            status: 'approved',
            status_detail: 'first_payment',
            payment_method: paymentMethod.card?.brand
              ? `${paymentMethod.card.brand} ****${paymentMethod.card.last4}`
              : 'credit_card',
            payer_email: customerEmail,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })

        if (historyError) {
          logger.warn('Erro ao salvar historico:', historyError.message)
        }
      } catch (e) {
        logger.warn('Erro ao salvar historico:', e.message)
      }
    }

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
    logger.error('Stripe Subscription Error:', error.message)

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

/**
 * Buscar histórico de pagamentos de um cliente
 * GET /api/stripe/payment-history/:email
 */
async function getPaymentHistory(req, res) {
  try {
    const { email } = req.params

    if (!email) {
      return res.status(400).json({ success: false, error: 'Email é obrigatório' })
    }

    logger.debug('Buscando historico de pagamentos para:', email)

    const customers = await stripe.customers.list({ email: email, limit: 1 })

    if (customers.data.length === 0) {
      return res.json({ success: true, payments: [] })
    }

    const customer = customers.data[0]
    const invoices = await stripe.invoices.list({ customer: customer.id, status: 'paid', limit: 20 })

    const payments = invoices.data.map(invoice => ({
      id: invoice.id,
      payment_id: invoice.id,
      amount: invoice.amount_paid / 100,
      status: 'approved',
      status_detail: invoice.status,
      payment_method: 'credit_card',
      created_at: new Date(invoice.created * 1000).toISOString()
    }))

    logger.debug(`Encontrados ${payments.length} pagamentos`)

    return res.json({ success: true, payments })

  } catch (error) {
    logger.error('Erro ao buscar historico:', error.message)
    return res.status(500).json({ success: false, error: 'Erro ao buscar histórico de pagamentos' })
  }
}

/**
 * Alterar plano de uma assinatura (upgrade/downgrade)
 * POST /api/stripe/update-subscription-plan
 */
async function updateSubscriptionPlan(req, res) {
  try {
    const { subscriptionId, newPlanType, userId } = req.body

    logger.payment('Alterando plano:', subscriptionId, '->', newPlanType)

    if (!subscriptionId) {
      return res.status(400).json({ success: false, error: 'subscriptionId é obrigatório' })
    }

    if (!newPlanType || !['basic', 'pro', 'premium'].includes(newPlanType)) {
      return res.status(400).json({ success: false, error: 'newPlanType inválido. Use: basic, pro ou premium' })
    }

    const planPrices = { basic: 49.90, pro: 79.90, premium: 99.90 }
    const planNames = { basic: 'Plano Básico', pro: 'Plano Pro', premium: 'Plano Premium' }

    const newAmount = planPrices[newPlanType]
    const newPlanName = planNames[newPlanType]
    const amountInCents = Math.round(newAmount * 100)

    // 1. Buscar assinatura atual
    const currentSubscription = await stripe.subscriptions.retrieve(subscriptionId)

    if (!currentSubscription) {
      return res.status(404).json({ success: false, error: 'Assinatura não encontrada no Stripe' })
    }

    // 2. Buscar ou criar o produto
    let product
    const products = await stripe.products.list({ active: true, limit: 100 })
    product = products.data.find(p => p.name === `Agenda HOF - ${newPlanName}`)

    if (!product) {
      product = await stripe.products.create({
        name: `Agenda HOF - ${newPlanName}`,
        metadata: { plan_type: newPlanType }
      })
    }

    // 3. Buscar ou criar o preço
    let newPrice
    const prices = await stripe.prices.list({ product: product.id, active: true, limit: 100 })
    newPrice = prices.data.find(p => p.unit_amount === amountInCents && p.recurring?.interval === 'month')

    if (!newPrice) {
      newPrice = await stripe.prices.create({
        product: product.id,
        unit_amount: amountInCents,
        currency: 'brl',
        recurring: { interval: 'month' }
      })
    }

    // 4. Atualizar a assinatura
    const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
      items: [{ id: currentSubscription.items.data[0].id, price: newPrice.id }],
      proration_behavior: 'create_prorations',
      metadata: {
        ...currentSubscription.metadata,
        plan_type: newPlanType,
        plan_name: newPlanName,
        updated_at: new Date().toISOString()
      }
    })

    logger.info('Assinatura atualizada:', updatedSubscription.id)

    // 5. Atualizar no Supabase
    if (supabase) {
      const { error: updateError } = await supabase
        .from('user_subscriptions')
        .update({
          plan_type: newPlanType,
          plan_name: newPlanName,
          plan_amount: newAmount,
          updated_at: new Date().toISOString()
        })
        .eq('stripe_subscription_id', subscriptionId)

      if (updateError) {
        logger.warn('Erro ao atualizar Supabase:', updateError.message)
      }
    }

    res.json({
      success: true,
      subscriptionId: updatedSubscription.id,
      status: updatedSubscription.status,
      newPlanType,
      newPlanName,
      newAmount,
      nextBillingDate: new Date(updatedSubscription.current_period_end * 1000).toISOString()
    })

  } catch (error) {
    logger.error('Erro ao alterar plano:', error.message)
    res.status(500).json({ success: false, error: error.message || 'Erro ao alterar plano' })
  }
}

module.exports = {
  handleApplePayPayment,
  handleApplePaySubscription,
  handleCreateSubscription,
  cancelSubscription,
  getSubscription,
  createPaymentIntent,
  handleWebhook,
  getPaymentHistory,
  updateSubscriptionPlan
}
