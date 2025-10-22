// Script para testar o token do PagBank
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

  console.log('\n📡 Fazendo requisição de teste...\n')

  try {
    // Tentar criar um plano de teste
    const response = await fetch(`${PAGBANK_API_URL}/plans`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PAGBANK_TOKEN}`,
      },
      body: JSON.stringify({
        reference_id: `TEST_${Date.now()}`,
        name: 'Plano de Teste - Deletar',
        description: 'Teste de validação de token',
        amount: {
          value: 10000, // R$ 100,00
          currency: 'BRL'
        },
        interval: {
          unit: 'MONTH',
          length: 1
        }
      })
    })

    const data = await response.json()

    if (response.ok) {
      console.log('✅ TOKEN VÁLIDO!')
      console.log('✅ Plano de teste criado:', data.id)
      console.log('\n🎉 Seu token está funcionando corretamente!')
      console.log('\n⚠️  IMPORTANTE: Delete o plano de teste no painel do PagBank')
      console.log('   ID do plano:', data.id)
    } else {
      console.log('❌ TOKEN INVÁLIDO!')
      console.log('\n📋 Resposta do PagBank:')
      console.log(JSON.stringify(data, null, 2))

      if (data.error_messages) {
        console.log('\n❌ Erros:')
        data.error_messages.forEach(err => {
          console.log(`   - ${err.description}`)
        })
      }

      console.log('\n🔧 Como resolver:')
      console.log('1. Acesse: https://pagseguro.uol.com.br/')
      console.log('2. Vá em: Integrações → Tokens')
      console.log('3. Gere um novo token de PRODUÇÃO')
      console.log('4. Atualize no arquivo: /home/nicolas/Agenda-HOF/backend/.env')
      console.log('5. Reinicie o backend')
    }

  } catch (error) {
    console.log('❌ ERRO ao testar token:')
    console.log(error.message)

    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      console.log('\n🌐 Problema de conexão com o PagBank')
      console.log('   Verifique sua conexão com a internet')
    }
  }
}

testToken()
