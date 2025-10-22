const express = require('express')
const cors = require('cors')
const fetch = require('node-fetch')
require('dotenv').config()

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5175',
  credentials: true
}))
app.use(express.json())

// Configuração do PagBank
const PAGBANK_TOKEN = process.env.PAGBANK_TOKEN
const PAGBANK_API_URL = process.env.NODE_ENV === 'production'
  ? 'https://api.pagseguro.com'
  : 'https://sandbox.api.pagseguro.com'

// Validar token
if (!PAGBANK_TOKEN) {
  console.error('❌ PAGBANK_TOKEN não configurado no .env')
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

    const data = await response.json()

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

// Iniciar servidor
app.listen(PORT, () => {
  console.log('\n🚀 Backend Agenda HOF iniciado!')
  console.log(`📡 Servidor rodando em http://localhost:${PORT}`)
  console.log(`🌐 Frontend esperado em ${process.env.FRONTEND_URL}`)
  console.log('\n✅ Endpoints disponíveis:')
  console.log('  - GET  /health')
  console.log('  - POST /api/pagbank/create-pix')
  console.log('  - POST /api/pagbank/create-card-charge')
  console.log('  - POST /api/pagbank/create-boleto')
  console.log('  - GET  /api/pagbank/check-status/:orderId')
  console.log('\n💡 Use Ctrl+C para parar o servidor\n')
})
