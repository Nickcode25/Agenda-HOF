const fetch = require('node-fetch')

// Token do Railway (você precisa pegar do Railway)
const RAILWAY_TOKEN = process.env.PAGBANK_TOKEN || '71a0c98d-7f03-4432-a41a-e8a2b18cebc5f695497941f0bc5930589cbe6384f14696fd-dc62-4799-a0dd-eb917bace476'

async function verifyPagBankConfig() {
  console.log('🔍 Verificando configuração do PagBank...\n')

  console.log('1️⃣ Token sendo usado:')
  console.log('   Primeiros 20 chars:', RAILWAY_TOKEN.substring(0, 20))
  console.log('   Últimos 20 chars:', RAILWAY_TOKEN.substring(RAILWAY_TOKEN.length - 20))
  console.log('   Tamanho:', RAILWAY_TOKEN.length, 'caracteres\n')

  // Testar com API de produção
  console.log('2️⃣ Testando token na API de PRODUÇÃO...')
  try {
    const response = await fetch('https://api.pagseguro.com/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RAILWAY_TOKEN}`
      },
      body: JSON.stringify({
        reference_id: 'test_' + Date.now(),
        customer: {
          name: 'Test User',
          email: 'test@test.com',
          tax_id: '12345678909'
        },
        items: [{
          name: 'Test Item',
          quantity: 1,
          unit_amount: 100
        }],
        qr_codes: [{
          amount: { value: 100 }
        }]
      })
    })

    const data = await response.text()

    console.log('   Status:', response.status)
    console.log('   Headers:', JSON.stringify([...response.headers.entries()], null, 2))

    try {
      const jsonData = JSON.parse(data)
      console.log('   Resposta:', JSON.stringify(jsonData, null, 2))
    } catch (e) {
      console.log('   Resposta (não é JSON):', data.substring(0, 500))
    }
  } catch (error) {
    console.error('   ❌ Erro:', error.message)
  }

  console.log('\n3️⃣ Testando token na API de SANDBOX...')
  try {
    const response = await fetch('https://sandbox.api.pagseguro.com/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RAILWAY_TOKEN}`
      },
      body: JSON.stringify({
        reference_id: 'test_' + Date.now(),
        customer: {
          name: 'Test User',
          email: 'test@test.com',
          tax_id: '12345678909'
        },
        items: [{
          name: 'Test Item',
          quantity: 1,
          unit_amount: 100
        }],
        qr_codes: [{
          amount: { value: 100 }
        }]
      })
    })

    const data = await response.text()

    console.log('   Status:', response.status)

    try {
      const jsonData = JSON.parse(data)
      console.log('   Resposta:', JSON.stringify(jsonData, null, 2))
    } catch (e) {
      console.log('   Resposta (não é JSON):', data.substring(0, 500))
    }
  } catch (error) {
    console.error('   ❌ Erro:', error.message)
  }
}

verifyPagBankConfig()
