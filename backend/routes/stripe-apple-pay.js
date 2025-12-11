/**
 * Rotas do Stripe para Apple Pay
 * Integração com iOS App - Agenda HOF
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const { createClient } = require('@supabase/supabase-js')

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
 *
 * Aceita:
 * - subscriptionId: ID da assinatura no Stripe (sub_xxx) ou ID do registro no Supabase
 * - userId: ID do usuário (opcional, para validação)
 * - immediately: boolean - se true, cancela imediatamente; se false, cancela no fim do período
 */
async function cancelSubscription(req, res) {
  try {
    const { subscriptionId, userId, immediately = false } = req.body

    console.log('🚫 Cancelando assinatura:', subscriptionId, 'userId:', userId)

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

    console.log('✅ Assinatura cancelada no Stripe:', subscription.id)

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
        console.error('⚠️ Erro ao atualizar Supabase:', updateError)
      } else {
        console.log('✅ Status atualizado no Supabase')
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
        // Salvar no histórico de pagamentos
        if (supabase) {
          const invoice = event.data.object
          try {
            // Buscar detalhes do cliente para pegar o email
            const customer = await stripe.customers.retrieve(invoice.customer)
            const customerEmail = customer.email || invoice.customer_email

            // Extrair últimos 4 dígitos do cartão se disponível
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
                console.log('⚠️ Não foi possível obter detalhes do cartão:', e.message)
              }
            }

            const { error: historyError } = await supabase
              .from('payment_history')
              .insert({
                payment_id: invoice.id,
                subscription_id: invoice.subscription,
                amount: invoice.amount_paid / 100, // Stripe usa centavos
                status: 'approved',
                status_detail: invoice.status,
                payment_method: cardBrand ? `${cardBrand} ****${cardLastDigits}` : 'credit_card',
                payer_email: customerEmail,
                created_at: new Date(invoice.created * 1000).toISOString(),
                updated_at: new Date().toISOString()
              })

            if (historyError) {
              console.error('❌ Erro ao salvar histórico de pagamento:', historyError)
            } else {
              console.log('✅ Histórico de pagamento salvo para:', customerEmail)
            }
          } catch (e) {
            console.error('❌ Erro ao processar fatura paga:', e.message)
          }
        }
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

    // 10. Salvar histórico de pagamento no Supabase
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
          console.error('⚠️ Erro ao salvar histórico de pagamento:', historyError)
        } else {
          console.log('💾 Histórico de pagamento salvo para:', customerEmail)
        }
      } catch (e) {
        console.error('⚠️ Erro ao salvar histórico:', e.message)
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

/**
 * Buscar histórico de pagamentos de um cliente
 * GET /api/stripe/payment-history/:email
 */
async function getPaymentHistory(req, res) {
  try {
    const { email } = req.params

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email é obrigatório'
      })
    }

    console.log('📜 Buscando histórico de pagamentos para:', email)

    // 1. Buscar cliente pelo email
    const customers = await stripe.customers.list({
      email: email,
      limit: 1
    })

    if (customers.data.length === 0) {
      return res.json({
        success: true,
        payments: []
      })
    }

    const customer = customers.data[0]

    // 2. Buscar faturas pagas do cliente
    const invoices = await stripe.invoices.list({
      customer: customer.id,
      status: 'paid',
      limit: 20
    })

    // 3. Formatar os pagamentos
    const payments = invoices.data.map(invoice => ({
      id: invoice.id,
      payment_id: invoice.id,
      amount: invoice.amount_paid / 100,
      status: 'approved',
      status_detail: invoice.status,
      payment_method: 'credit_card',
      created_at: new Date(invoice.created * 1000).toISOString()
    }))

    console.log(`✅ Encontrados ${payments.length} pagamentos`)

    return res.json({
      success: true,
      payments
    })

  } catch (error) {
    console.error('❌ Erro ao buscar histórico:', error)
    return res.status(500).json({
      success: false,
      error: 'Erro ao buscar histórico de pagamentos'
    })
  }
}

/**
 * Alterar plano de uma assinatura (upgrade/downgrade)
 * POST /api/stripe/update-subscription-plan
 *
 * Altera o plano da assinatura no Stripe e no banco de dados.
 * O Stripe ajusta automaticamente o valor na próxima cobrança.
 */
async function updateSubscriptionPlan(req, res) {
  try {
    const {
      subscriptionId,      // ID da assinatura no Stripe (sub_xxx)
      newPlanType,         // 'basic', 'pro', 'premium'
      userId               // ID do usuário no Supabase (opcional, para validação)
    } = req.body

    console.log('🔄 Alterando plano da assinatura:', subscriptionId, '-> ', newPlanType)

    if (!subscriptionId) {
      return res.status(400).json({
        success: false,
        error: 'subscriptionId é obrigatório'
      })
    }

    if (!newPlanType || !['basic', 'pro', 'premium'].includes(newPlanType)) {
      return res.status(400).json({
        success: false,
        error: 'newPlanType inválido. Use: basic, pro ou premium'
      })
    }

    // Definir preços dos planos (em reais)
    const planPrices = {
      basic: 49.90,
      pro: 79.90,
      premium: 99.90
    }

    const planNames = {
      basic: 'Plano Básico',
      pro: 'Plano Pro',
      premium: 'Plano Premium'
    }

    const newAmount = planPrices[newPlanType]
    const newPlanName = planNames[newPlanType]
    const amountInCents = Math.round(newAmount * 100)

    // 1. Buscar assinatura atual no Stripe
    const currentSubscription = await stripe.subscriptions.retrieve(subscriptionId)

    if (!currentSubscription) {
      return res.status(404).json({
        success: false,
        error: 'Assinatura não encontrada no Stripe'
      })
    }

    console.log('📋 Assinatura atual:', currentSubscription.id, 'Status:', currentSubscription.status)

    // 2. Buscar ou criar o produto para o novo plano
    let product
    const products = await stripe.products.list({ active: true, limit: 100 })
    product = products.data.find(p => p.name === `Agenda HOF - ${newPlanName}`)

    if (!product) {
      product = await stripe.products.create({
        name: `Agenda HOF - ${newPlanName}`,
        metadata: { plan_type: newPlanType }
      })
      console.log('📦 Novo produto criado:', product.id)
    }

    // 3. Buscar ou criar o preço para o novo plano
    let newPrice
    const prices = await stripe.prices.list({ product: product.id, active: true, limit: 100 })
    newPrice = prices.data.find(p =>
      p.unit_amount === amountInCents &&
      p.recurring?.interval === 'month'
    )

    if (!newPrice) {
      newPrice = await stripe.prices.create({
        product: product.id,
        unit_amount: amountInCents,
        currency: 'brl',
        recurring: { interval: 'month' }
      })
      console.log('💰 Novo preço criado:', newPrice.id)
    }

    // 4. Atualizar a assinatura no Stripe
    // Usar proration_behavior para calcular diferença de valor
    const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
      items: [{
        id: currentSubscription.items.data[0].id,
        price: newPrice.id
      }],
      proration_behavior: 'create_prorations', // Calcula diferença proporcional
      metadata: {
        ...currentSubscription.metadata,
        plan_type: newPlanType,
        plan_name: newPlanName,
        updated_at: new Date().toISOString()
      }
    })

    console.log('✅ Assinatura atualizada no Stripe:', updatedSubscription.id)

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
        console.error('⚠️ Erro ao atualizar Supabase:', updateError)
      } else {
        console.log('✅ Plano atualizado no Supabase')
      }
    }

    // 6. Retornar sucesso
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
    console.error('❌ Erro ao alterar plano:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Erro ao alterar plano'
    })
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
