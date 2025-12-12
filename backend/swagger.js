/**
 * Configuracao do Swagger/OpenAPI
 * Documentacao automatica da API do Agenda HOF
 */

const swaggerJsdoc = require('swagger-jsdoc')
const swaggerUi = require('swagger-ui-express')

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Agenda HOF API',
      version: '1.1.0',
      description: `
## API Backend do Agenda HOF

Sistema de agendamento para clinicas com integracao de pagamentos via Stripe.

### Recursos Principais:
- **Email**: Envio de emails transacionais (verificacao, assinatura, reset de senha)
- **Autenticacao**: Reset de senha com tokens seguros
- **Pagamentos**: Integracao completa com Stripe (Apple Pay, cartao digitado, assinaturas)

### Seguranca:
- Rate limiting em todos os endpoints
- Validacao de inputs com sanitizacao
- Headers de seguranca HTTP (Helmet)
- Validacao de webhooks com assinatura Stripe
      `,
      contact: {
        name: 'Agenda HOF',
        url: 'https://agendahof.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Servidor de Desenvolvimento'
      },
      {
        url: 'https://api.agendahof.com',
        description: 'Servidor de Producao'
      }
    ],
    tags: [
      {
        name: 'Health',
        description: 'Verificacao de status do servidor'
      },
      {
        name: 'Email',
        description: 'Endpoints para envio de emails transacionais'
      },
      {
        name: 'Auth',
        description: 'Autenticacao e recuperacao de senha'
      },
      {
        name: 'Stripe',
        description: 'Pagamentos e assinaturas via Stripe'
      }
    ],
    components: {
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Mensagem de erro'
            },
            code: {
              type: 'string',
              description: 'Codigo do erro (opcional)'
            },
            details: {
              type: 'object',
              description: 'Detalhes adicionais do erro (opcional)'
            }
          },
          required: ['error']
        },
        HealthResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'OK'
            },
            environment: {
              type: 'string',
              example: 'development'
            },
            timestamp: {
              type: 'string',
              format: 'date-time'
            },
            paymentProvider: {
              type: 'string',
              example: 'Stripe'
            }
          }
        },
        SendVerificationRequest: {
          type: 'object',
          required: ['to', 'code', 'userName'],
          properties: {
            to: {
              type: 'string',
              format: 'email',
              description: 'Email do destinatario',
              example: 'usuario@exemplo.com'
            },
            code: {
              type: 'string',
              description: 'Codigo de verificacao (6 digitos)',
              example: '123456'
            },
            userName: {
              type: 'string',
              description: 'Nome do usuario',
              example: 'Joao Silva'
            }
          }
        },
        SendSubscriptionRequest: {
          type: 'object',
          required: ['to', 'userName', 'planName', 'planPrice', 'startDate'],
          properties: {
            to: {
              type: 'string',
              format: 'email',
              description: 'Email do destinatario',
              example: 'usuario@exemplo.com'
            },
            userName: {
              type: 'string',
              description: 'Nome do usuario',
              example: 'Joao Silva'
            },
            planName: {
              type: 'string',
              description: 'Nome do plano',
              example: 'Plano Pro'
            },
            planPrice: {
              type: 'string',
              description: 'Preco formatado',
              example: 'R$ 79,90/mes'
            },
            startDate: {
              type: 'string',
              description: 'Data de inicio formatada',
              example: '12/12/2025'
            }
          }
        },
        PasswordResetRequest: {
          type: 'object',
          required: ['email'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'Email do usuario',
              example: 'usuario@exemplo.com'
            }
          }
        },
        ApplePayRequest: {
          type: 'object',
          required: ['paymentMethodId', 'amount'],
          properties: {
            paymentMethodId: {
              type: 'string',
              description: 'ID do PaymentMethod do Stripe',
              example: 'pm_1234567890'
            },
            amount: {
              type: 'number',
              description: 'Valor em reais',
              example: 79.90
            },
            currency: {
              type: 'string',
              default: 'brl',
              description: 'Moeda (default: brl)'
            },
            description: {
              type: 'string',
              description: 'Descricao do pagamento'
            },
            customerEmail: {
              type: 'string',
              format: 'email',
              description: 'Email do cliente'
            },
            customerName: {
              type: 'string',
              description: 'Nome do cliente'
            },
            metadata: {
              type: 'object',
              description: 'Metadados adicionais'
            }
          }
        },
        CreateSubscriptionRequest: {
          type: 'object',
          required: ['customerEmail', 'paymentMethodId', 'amount'],
          properties: {
            customerEmail: {
              type: 'string',
              format: 'email',
              description: 'Email do cliente',
              example: 'usuario@exemplo.com'
            },
            customerName: {
              type: 'string',
              description: 'Nome do cliente',
              example: 'Joao Silva'
            },
            customerId: {
              type: 'string',
              description: 'ID do usuario no Supabase'
            },
            paymentMethodId: {
              type: 'string',
              description: 'ID do PaymentMethod do Stripe',
              example: 'pm_1234567890'
            },
            amount: {
              type: 'number',
              description: 'Valor em reais',
              example: 79.90
            },
            planName: {
              type: 'string',
              description: 'Nome do plano',
              example: 'Plano Pro'
            },
            planId: {
              type: 'string',
              description: 'ID do plano'
            },
            couponId: {
              type: 'string',
              description: 'ID do cupom de desconto'
            },
            discountPercentage: {
              type: 'number',
              description: 'Percentual de desconto'
            }
          }
        },
        CancelSubscriptionRequest: {
          type: 'object',
          required: ['subscriptionId'],
          properties: {
            subscriptionId: {
              type: 'string',
              description: 'ID da assinatura (Stripe ou Supabase)',
              example: 'sub_1234567890'
            },
            userId: {
              type: 'string',
              description: 'ID do usuario para validacao'
            },
            immediately: {
              type: 'boolean',
              default: false,
              description: 'Se true, cancela imediatamente'
            }
          }
        },
        UpdateSubscriptionPlanRequest: {
          type: 'object',
          required: ['subscriptionId', 'newPlanType'],
          properties: {
            subscriptionId: {
              type: 'string',
              description: 'ID da assinatura no Stripe',
              example: 'sub_1234567890'
            },
            newPlanType: {
              type: 'string',
              enum: ['basic', 'pro', 'premium'],
              description: 'Tipo do novo plano',
              example: 'pro'
            },
            userId: {
              type: 'string',
              description: 'ID do usuario para validacao'
            }
          }
        },
        PaymentIntentRequest: {
          type: 'object',
          required: ['amount'],
          properties: {
            amount: {
              type: 'number',
              description: 'Valor em reais',
              example: 79.90
            },
            currency: {
              type: 'string',
              default: 'brl',
              description: 'Moeda'
            },
            customerEmail: {
              type: 'string',
              format: 'email',
              description: 'Email do cliente'
            },
            description: {
              type: 'string',
              description: 'Descricao do pagamento'
            },
            metadata: {
              type: 'object',
              description: 'Metadados adicionais'
            }
          }
        },
        SubscriptionResponse: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'ID da assinatura'
            },
            status: {
              type: 'string',
              enum: ['active', 'canceled', 'incomplete', 'past_due', 'trialing'],
              description: 'Status da assinatura'
            },
            currentPeriodStart: {
              type: 'string',
              format: 'date-time',
              description: 'Inicio do periodo atual'
            },
            currentPeriodEnd: {
              type: 'string',
              format: 'date-time',
              description: 'Fim do periodo atual'
            },
            cancelAtPeriodEnd: {
              type: 'boolean',
              description: 'Se sera cancelada no fim do periodo'
            },
            trialEnd: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              description: 'Fim do periodo de teste'
            },
            cardLast4: {
              type: 'string',
              description: 'Ultimos 4 digitos do cartao'
            },
            cardBrand: {
              type: 'string',
              description: 'Bandeira do cartao'
            },
            amount: {
              type: 'number',
              description: 'Valor da assinatura'
            },
            currency: {
              type: 'string',
              description: 'Moeda'
            }
          }
        },
        PaymentHistoryItem: {
          type: 'object',
          properties: {
            id: {
              type: 'string'
            },
            payment_id: {
              type: 'string'
            },
            amount: {
              type: 'number'
            },
            status: {
              type: 'string'
            },
            status_detail: {
              type: 'string'
            },
            payment_method: {
              type: 'string'
            },
            created_at: {
              type: 'string',
              format: 'date-time'
            }
          }
        }
      },
      securitySchemes: {
        stripeWebhook: {
          type: 'apiKey',
          in: 'header',
          name: 'stripe-signature',
          description: 'Assinatura do webhook do Stripe'
        }
      }
    }
  },
  apis: ['./server.js', './routes/*.js', './swagger-paths.js']
}

const specs = swaggerJsdoc(options)

/**
 * Configura o Swagger UI no app Express
 * @param {Object} app - Instancia do Express
 */
function setupSwagger(app) {
  // Servir documentacao Swagger
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(specs, {
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info .title { color: #ea580c }
    `,
    customSiteTitle: 'Agenda HOF - API Docs'
  }))

  // Endpoint para JSON do OpenAPI
  app.get('/api/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json')
    res.send(specs)
  })

  console.log('📚 Documentacao Swagger disponivel em /api/docs')
}

module.exports = { setupSwagger, specs }
