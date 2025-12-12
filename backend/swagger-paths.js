/**
 * Definicoes de paths/endpoints para o Swagger
 * Documentacao OpenAPI dos endpoints da API
 */

/**
 * @swagger
 * /health:
 *   get:
 *     tags:
 *       - Health
 *     summary: Verificar status do servidor
 *     description: Retorna informacoes sobre o status e configuracao do servidor
 *     responses:
 *       200:
 *         description: Servidor funcionando normalmente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 */

/**
 * @swagger
 * /api/email/send-verification:
 *   post:
 *     tags:
 *       - Email
 *     summary: Enviar codigo de verificacao
 *     description: |
 *       Envia um email com codigo de verificacao para confirmacao de cadastro.
 *
 *       **Rate Limit**: 5 requisicoes por minuto por IP
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SendVerificationRequest'
 *     responses:
 *       200:
 *         description: Email enviado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   description: Dados retornados pelo Resend
 *       400:
 *         description: Campos obrigatorios faltando
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Rate limit excedido
 *       500:
 *         description: Erro ao enviar email
 */

/**
 * @swagger
 * /api/email/send-subscription:
 *   post:
 *     tags:
 *       - Email
 *     summary: Enviar confirmacao de assinatura
 *     description: |
 *       Envia email de confirmacao quando usuario assina um plano.
 *
 *       **Rate Limit**: 5 requisicoes por minuto por IP
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SendSubscriptionRequest'
 *     responses:
 *       200:
 *         description: Email enviado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *       400:
 *         description: Campos obrigatorios faltando
 *       429:
 *         description: Rate limit excedido
 *       500:
 *         description: Erro ao enviar email
 */

/**
 * @swagger
 * /api/auth/request-password-reset:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Solicitar reset de senha
 *     description: |
 *       Gera um token de recuperacao e envia email com link para redefinir senha.
 *
 *       **Seguranca**:
 *       - O link expira em 1 hora
 *       - Resposta generica para evitar enumeracao de usuarios
 *
 *       **Rate Limit**: 3 requisicoes por minuto por IP
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PasswordResetRequest'
 *     responses:
 *       200:
 *         description: |
 *           Requisicao processada. Por seguranca, sempre retorna sucesso
 *           independente de o email existir ou nao.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Email de recuperacao enviado com sucesso!
 *       400:
 *         description: Email nao informado
 *       429:
 *         description: Rate limit excedido
 *       500:
 *         description: Erro interno
 */

/**
 * @swagger
 * /api/stripe/apple-pay:
 *   post:
 *     tags:
 *       - Stripe
 *     summary: Pagamento unico com Apple Pay
 *     description: |
 *       Processa um pagamento unico usando Apple Pay (iOS).
 *
 *       **Fluxo**:
 *       1. App iOS coleta PaymentMethod via Apple Pay
 *       2. Envia paymentMethodId para este endpoint
 *       3. Backend cria e confirma PaymentIntent
 *
 *       **3D Secure**: Se necessario, retorna `requiresAction: true` com `clientSecret`
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ApplePayRequest'
 *     responses:
 *       200:
 *         description: Pagamento processado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 paymentIntentId:
 *                   type: string
 *                 status:
 *                   type: string
 *                   enum: [succeeded, requires_action, processing]
 *                 requiresAction:
 *                   type: boolean
 *                   description: Se true, precisa autenticacao 3D Secure
 *                 clientSecret:
 *                   type: string
 *                   description: Secret para completar 3D Secure no app
 *                 receiptUrl:
 *                   type: string
 *                   description: URL do recibo (quando succeeded)
 *       400:
 *         description: Dados invalidos ou cartao recusado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Erro interno
 */

/**
 * @swagger
 * /api/stripe/create-subscription-apple-pay:
 *   post:
 *     tags:
 *       - Stripe
 *     summary: Criar assinatura com Apple Pay
 *     description: |
 *       Cria uma assinatura recorrente mensal usando Apple Pay.
 *
 *       **Recursos**:
 *       - Cria cliente no Stripe automaticamente
 *       - Suporta periodo de teste (trial)
 *       - Pode criar Price dinamicamente ou usar priceId existente
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentMethodId
 *               - customerEmail
 *             properties:
 *               paymentMethodId:
 *                 type: string
 *               customerEmail:
 *                 type: string
 *                 format: email
 *               customerName:
 *                 type: string
 *               customerPhone:
 *                 type: string
 *               priceId:
 *                 type: string
 *                 description: ID de um Price existente no Stripe
 *               amount:
 *                 type: number
 *                 description: Valor (se nao usar priceId)
 *               planName:
 *                 type: string
 *               trialDays:
 *                 type: integer
 *                 default: 0
 *               metadata:
 *                 type: object
 *     responses:
 *       200:
 *         description: Assinatura criada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 subscriptionId:
 *                   type: string
 *                 customerId:
 *                   type: string
 *                 status:
 *                   type: string
 *                   enum: [active, trialing, incomplete]
 *                 currentPeriodEnd:
 *                   type: string
 *                   format: date-time
 *                 trialEnd:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *       400:
 *         description: Dados invalidos
 *       500:
 *         description: Erro interno
 */

/**
 * @swagger
 * /api/stripe/create-subscription:
 *   post:
 *     tags:
 *       - Stripe
 *     summary: Criar assinatura com cartao digitado
 *     description: |
 *       Cria uma assinatura recorrente usando cartao digitado manualmente.
 *       Usado tanto no app iOS quanto no frontend web.
 *
 *       **Fluxo**:
 *       1. Frontend cria PaymentMethod via Stripe.js
 *       2. Envia paymentMethodId para este endpoint
 *       3. Backend cria cliente, produto, preco e assinatura
 *
 *       **Salva historico**: Primeiro pagamento e salvvo no `payment_history`
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateSubscriptionRequest'
 *     responses:
 *       200:
 *         description: Assinatura criada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 subscriptionId:
 *                   type: string
 *                 customerId:
 *                   type: string
 *                 status:
 *                   type: string
 *                 nextBillingDate:
 *                   type: string
 *                   format: date-time
 *                 cardLastDigits:
 *                   type: string
 *                 cardBrand:
 *                   type: string
 *       400:
 *         description: Dados invalidos ou cartao recusado
 *       500:
 *         description: Erro interno
 */

/**
 * @swagger
 * /api/stripe/cancel-subscription:
 *   post:
 *     tags:
 *       - Stripe
 *     summary: Cancelar assinatura
 *     description: |
 *       Cancela uma assinatura existente.
 *
 *       **Opcoes**:
 *       - `immediately: false` (padrao): Cancela no fim do periodo atual
 *       - `immediately: true`: Cancela imediatamente
 *
 *       **Banco de dados**: Atualiza status no Supabase automaticamente
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CancelSubscriptionRequest'
 *     responses:
 *       200:
 *         description: Assinatura cancelada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 subscriptionId:
 *                   type: string
 *                 status:
 *                   type: string
 *                 cancelAtPeriodEnd:
 *                   type: boolean
 *                 currentPeriodEnd:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: subscriptionId nao informado
 *       500:
 *         description: Erro ao cancelar
 */

/**
 * @swagger
 * /api/stripe/subscription/{subscriptionId}:
 *   get:
 *     tags:
 *       - Stripe
 *     summary: Buscar detalhes da assinatura
 *     description: Retorna informacoes detalhadas de uma assinatura
 *     parameters:
 *       - in: path
 *         name: subscriptionId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da assinatura no Stripe (sub_xxx)
 *         example: sub_1234567890
 *     responses:
 *       200:
 *         description: Detalhes da assinatura
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SubscriptionResponse'
 *       500:
 *         description: Assinatura nao encontrada ou erro
 */

/**
 * @swagger
 * /api/stripe/create-payment-intent:
 *   post:
 *     tags:
 *       - Stripe
 *     summary: Criar PaymentIntent
 *     description: |
 *       Cria um PaymentIntent para pagamento unico sem confirmar.
 *       Usado no fluxo iOS onde o app confirma o pagamento.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PaymentIntentRequest'
 *     responses:
 *       200:
 *         description: PaymentIntent criado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 paymentIntentId:
 *                   type: string
 *                 clientSecret:
 *                   type: string
 *                   description: Secret para confirmar no app
 *                 amount:
 *                   type: number
 *                 currency:
 *                   type: string
 *       400:
 *         description: amount nao informado
 *       500:
 *         description: Erro ao criar
 */

/**
 * @swagger
 * /api/stripe/webhook:
 *   post:
 *     tags:
 *       - Stripe
 *     summary: Webhook do Stripe
 *     description: |
 *       Endpoint para receber eventos do Stripe.
 *
 *       **Eventos tratados**:
 *       - `payment_intent.succeeded`
 *       - `payment_intent.payment_failed`
 *       - `customer.subscription.created`
 *       - `customer.subscription.updated`
 *       - `customer.subscription.deleted`
 *       - `invoice.paid`
 *       - `invoice.payment_failed`
 *
 *       **Seguranca**: Validacao obrigatoria via `stripe-signature` header
 *     security:
 *       - stripeWebhook: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Evento do Stripe (raw body)
 *     responses:
 *       200:
 *         description: Webhook processado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 received:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Assinatura invalida ou erro no processamento
 */

/**
 * @swagger
 * /api/stripe/payment-history/{email}:
 *   get:
 *     tags:
 *       - Stripe
 *     summary: Historico de pagamentos
 *     description: Retorna os ultimos 20 pagamentos de um cliente pelo email
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *           format: email
 *         description: Email do cliente
 *         example: usuario@exemplo.com
 *     responses:
 *       200:
 *         description: Lista de pagamentos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 payments:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PaymentHistoryItem'
 *       400:
 *         description: Email nao informado
 *       500:
 *         description: Erro ao buscar
 */

/**
 * @swagger
 * /api/stripe/update-subscription-plan:
 *   post:
 *     tags:
 *       - Stripe
 *     summary: Alterar plano da assinatura
 *     description: |
 *       Altera o plano de uma assinatura (upgrade/downgrade).
 *
 *       **Planos disponiveis**:
 *       - `basic`: R$ 49,90/mes
 *       - `pro`: R$ 79,90/mes
 *       - `premium`: R$ 99,90/mes
 *
 *       **Proration**: O Stripe calcula automaticamente a diferenca de valor
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateSubscriptionPlanRequest'
 *     responses:
 *       200:
 *         description: Plano alterado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 subscriptionId:
 *                   type: string
 *                 status:
 *                   type: string
 *                 newPlanType:
 *                   type: string
 *                 newPlanName:
 *                   type: string
 *                 newAmount:
 *                   type: number
 *                 nextBillingDate:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Dados invalidos
 *       404:
 *         description: Assinatura nao encontrada
 *       500:
 *         description: Erro ao alterar
 */

module.exports = {}
