// Script melhorado para testar token do PagBank
require('dotenv').config()
const fetch = require('node-fetch')

const PAGBANK_TOKEN = process.env.PAGBANK_TOKEN
const PAGBANK_API_URL = process.env.NODE_ENV === 'production'
  ? 'https://api.pagseguro.com'
  : 'https://sandbox.api.pagseguro.com'

async function testToken() {
  console.log('\n🔍 Testando token do PagBank...\n')
  console.log('📍 Ambiente:', process.env.NODE_ENV || 'development')
  console.log('🌐 API URL:', PAGBANK_API_URL)
  console.log('🔑 Token:', PAGBANK_TOKEN ? `${PAGBANK_TOKEN.substring(0, 20)}...` : '❌ NÃO CONFIGURADO')

  if (!PAGBANK_TOKEN) {
    console.log('\n❌ Token não encontrado no .env')
    process.exit(1)
  }

  console.log('\n📡 Testando endpoint de charges (mais simples)...\n')

  try {
    // Tentar criar uma cobrança de teste (mais simples que plano)
    const response = await fetch(`${PAGBANK_API_URL}/charges`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PAGBANK_TOKEN}`,
      },
      body: JSON.stringify({
        reference_id: `TEST_${Date.now()}`,
        description: 'Teste de validação de token',
        amount: {
          value: 100, // R$ 1,00
          currency: 'BRL',
        },
        payment_method: {
          type: 'CREDIT_CARD',
          installments: 1,
          capture: false, // NÃO capturar (apenas autorizar)
          card: {
            number: '4111111111111111',
            exp_month: '12',
            exp_year: '2030',
            security_code: '123',
            holder: {
              name: 'TESTE TOKEN',
              tax_id: '12345678909',
            },
          },
        },
      })
    })

    console.log('📊 Status HTTP:', response.status, response.statusText)

    const contentType = response.headers.get('content-type')
    console.log('📄 Content-Type:', contentType)

    const text = await response.text()

    if (contentType && contentType.includes('application/json')) {
      const data = JSON.parse(text)

      if (response.ok) {
        console.log('\n✅ TOKEN VÁLIDO!')
        console.log('✅ Cobrança de teste criada (não capturada):', data.id)
        console.log('\n🎉 Seu token está funcionando corretamente!')
      } else {
        console.log('\n❌ TOKEN INVÁLIDO OU ERRO NA REQUISIÇÃO!')
        console.log('\n📋 Resposta do PagBank:')
        console.log(JSON.stringify(data, null, 2))

        if (data.error_messages) {
          console.log('\n❌ Erros:')
          data.error_messages.forEach(err => {
            console.log(`   - ${err.description || err.message || JSON.stringify(err)}`)
          })
        }
      }
    } else {
      console.log('\n❌ PagBank retornou HTML em vez de JSON!')
      console.log('📄 Primeiros 500 caracteres da resposta:')
      console.log(text.substring(0, 500))

      if (text.includes('404') || text.includes('Not Found')) {
        console.log('\n⚠️  PROBLEMA: Endpoint não encontrado')
        console.log('   A API do PagBank pode ter mudado')
        console.log('   Ou você está usando um token do ambiente errado')
      } else if (text.includes('401') || text.includes('403') || text.includes('Unauthorized')) {
        console.log('\n⚠️  PROBLEMA: Token inválido ou sem permissão')
      }
    }

    console.log('\n🔧 Como resolver:')
    console.log('1. Acesse: https://pagseguro.uol.com.br/')
    console.log('2. Faça login')
    console.log('3. Vá em: Integrações → Credenciais')
    console.log('4. Gere um novo TOKEN (não Connect Key)')
    console.log('5. IMPORTANTE: Use token de PRODUÇÃO (não Sandbox)')
    console.log('6. Atualize em: /home/nicolas/Agenda-HOF/backend/.env')
    console.log('7. Reinicie o backend')

  } catch (error) {
    console.log('\n❌ ERRO ao testar token:')
    console.log(error.message)
    console.log('\nStack trace:')
    console.log(error.stack)

    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      console.log('\n🌐 Problema de conexão com o PagBank')
      console.log('   Verifique sua conexão com a internet')
    }
  }
}

testToken()
