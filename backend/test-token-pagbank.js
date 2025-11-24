#!/usr/bin/env node

/**
 * Script para testar se o token do PagBank está válido
 *
 * Como usar:
 * 1. node test-token-pagbank.js
 * 2. Informe o token quando solicitado
 */

const fetch = require('node-fetch')
const readline = require('readline')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

console.log('🔍 Testador de Token do PagBank\n')
console.log('Este script vai testar se seu token está válido e tem as permissões corretas.\n')

rl.question('Cole o token do PagBank aqui: ', async (token) => {
  rl.close()

  if (!token || token.trim() === '') {
    console.error('❌ Token não pode estar vazio!')
    process.exit(1)
  }

  const cleanToken = token.trim()

  console.log('\n📊 Informações do Token:')
  console.log('  - Length:', cleanToken.length, 'caracteres')
  console.log('  - Primeiros 20 chars:', cleanToken.substring(0, 20) + '...')
  console.log('  - Últimos 10 chars:', '...' + cleanToken.substring(cleanToken.length - 10))

  console.log('\n🔄 Testando token com a API do PagBank...\n')

  // Teste 1: Criar um pedido simples
  console.log('📌 Teste 1: Verificando permissão de criar pedidos (orders)')

  try {
    const response = await fetch('https://api.pagseguro.com/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cleanToken}`,
      },
      body: JSON.stringify({
        reference_id: `TEST_${Date.now()}`,
        customer: {
          name: 'Teste',
          email: 'teste@teste.com',
          tax_id: '12345678909',
        },
        items: [
          {
            reference_id: 'TEST',
            name: 'Teste',
            quantity: 1,
            unit_amount: 100,
          },
        ],
        qr_codes: [
          {
            amount: {
              value: 100,
            },
          },
        ],
      }),
    })

    console.log('  Status HTTP:', response.status)
    console.log('  Status Text:', response.statusText)

    const contentType = response.headers.get('content-type')
    console.log('  Content-Type:', contentType)

    const responseText = await response.text()

    if (contentType && contentType.includes('text/html')) {
      console.log('  ❌ PagBank retornou HTML em vez de JSON!')
      console.log('  📄 Resposta (primeiros 200 chars):', responseText.substring(0, 200))
      console.log('\n⚠️  PROBLEMA: Whitelist não configurado ou token inválido')
      console.log('  Soluções:')
      console.log('  1. Configure o whitelist em: https://pagseguro.uol.com.br/preferencias/integracoes.jhtml')
      console.log('  2. Gere um novo token com todas as permissões')
      console.log('  3. Verifique se está usando token de PRODUÇÃO (não sandbox)')
      process.exit(1)
    }

    let data
    try {
      data = JSON.parse(responseText)
    } catch (e) {
      console.log('  ❌ Resposta não é JSON válido!')
      console.log('  Resposta bruta:', responseText.substring(0, 500))
      process.exit(1)
    }

    if (response.status === 401) {
      console.log('  ❌ Token INVÁLIDO ou EXPIRADO!')
      console.log('  Erro:', data)
      console.log('\n🔑 Você precisa gerar um novo token no PagBank')
      console.log('  Acesse: https://minhaconta.pagseguro.uol.com.br/credenciais')
      process.exit(1)
    }

    if (response.status === 403) {
      console.log('  ❌ Token válido mas SEM PERMISSÕES ou WHITELIST não configurado!')
      console.log('  Erro:', data)
      console.log('\n⚙️  Soluções:')
      console.log('  1. Configure whitelist em: https://pagseguro.uol.com.br/preferencias/integracoes.jhtml')
      console.log('  2. Verifique se token tem todas as permissões necessárias')
      console.log('  3. Aguarde 5-10 minutos para propagar')
      process.exit(1)
    }

    if (response.status === 400 || response.status === 201 || response.status === 200) {
      console.log('  ✅ Token VÁLIDO e com permissões corretas!')
      console.log('  Resposta:', JSON.stringify(data, null, 2).substring(0, 300))

      if (response.status === 400) {
        console.log('\n  ℹ️  Status 400 é esperado (dados de teste inválidos)')
        console.log('  O importante é que o token foi aceito pelo PagBank')
      }

      console.log('\n✅ SUCESSO! Seu token está funcionando corretamente!')
      console.log('\n📋 Próximos passos:')
      console.log('  1. Configure este token no Railway: PAGBANK_TOKEN=' + cleanToken)
      console.log('  2. Configure o whitelist no PagBank')
      console.log('  3. Teste o pagamento em produção')
      process.exit(0)
    }

    console.log('  ⚠️  Status inesperado:', response.status)
    console.log('  Resposta:', data)

  } catch (error) {
    console.log('  ❌ Erro ao testar token:', error.message)
    console.log('\n🔍 Detalhes do erro:')
    console.log(error)
    process.exit(1)
  }
})
