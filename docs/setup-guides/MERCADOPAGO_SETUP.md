# 🛠️ Guia de Configuração do Mercado Pago

Este guia irá te ajudar a configurar o Mercado Pago para processar pagamentos recorrentes via cartão de crédito no Agenda+ HOF.

## 📋 Pré-requisitos

1. Conta no Mercado Pago (crie em: https://www.mercadopago.com.br)
2. Node.js instalado
3. Projeto já configurado com Supabase

## 🔑 Passo 1: Obter Credenciais do Mercado Pago

### Para Desenvolvimento (Teste)

1. Acesse o painel de desenvolvedores: https://www.mercadopago.com.br/developers/panel/credentials
2. Faça login com sua conta Mercado Pago
3. Vá em **Credenciais** → **Credenciais de teste**
4. Copie as seguintes credenciais:
   - **Public Key** (começa com `TEST-...`)
   - **Access Token** (começa com `TEST-...`)

### Para Produção (Real)

1. Acesse: https://www.mercadopago.com.br/developers/panel/credentials
2. Vá em **Credenciais** → **Credenciais de produção**
3. Copie as credenciais de produção:
   - **Public Key** (começa com `APP_USR-...`)
   - **Access Token** (começa com `APP_USR-...`)

⚠️ **IMPORTANTE**:
- Use credenciais de **TESTE** durante o desenvolvimento
- Use credenciais de **PRODUÇÃO** apenas quando o sistema estiver funcionando perfeitamente

## 🔧 Passo 2: Configurar Variáveis de Ambiente

### Frontend (.env)

Edite o arquivo `.env` na raiz do projeto:

```env
# Supabase (já deve estar configurado)
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase

# Backend URL
VITE_BACKEND_URL=http://localhost:3001

# Mercado Pago - Public Key
VITE_MERCADOPAGO_PUBLIC_KEY=TEST-sua-public-key-aqui
```

### Backend (backend/.env)

Edite o arquivo `.env` dentro da pasta `backend`:

```env
# Mercado Pago - Access Token
MERCADOPAGO_ACCESS_TOKEN=TEST-seu-access-token-aqui

# Frontend URL (para CORS)
FRONTEND_URL=http://localhost:5175

# Porta do servidor
PORT=3001

# Ambiente
NODE_ENV=development
```

## 🚀 Passo 3: Testar a Integração

### 1. Iniciar o Backend

```bash
cd backend
npm install
npm start
```

Você deve ver:
```
🚀 Backend Agenda HOF iniciado!
📡 Servidor rodando em http://localhost:3001
🌐 Frontend esperado em http://localhost:5175

✅ Endpoints disponíveis (Mercado Pago):
  - GET  /health
  - POST /api/mercadopago/create-subscription ⭐ Assinatura recorrente
  - POST /api/mercadopago/cancel-subscription/:id
  - GET  /api/mercadopago/subscription/:id
  - POST /api/mercadopago/webhook ⭐ Notificações
```

### 2. Iniciar o Frontend

Em outro terminal:

```bash
npm run dev
```

### 3. Testar Pagamento

1. Acesse: http://localhost:5175
2. Clique em "Começar Agora"
3. Preencha seus dados
4. Use os **cartões de teste** do Mercado Pago:

#### Cartões de Teste - APROVADO
- **Número**: `5031 4332 1540 6351`
- **Titular**: Qualquer nome
- **Validade**: Qualquer data futura (ex: 12/25)
- **CVV**: `123`
- **CPF**: `12345678909`

#### Outros Cartões de Teste

| Status | Número do Cartão | Bandeira |
|--------|------------------|----------|
| ✅ Aprovado | 5031 4332 1540 6351 | Mastercard |
| ✅ Aprovado | 4235 6477 2802 5682 | Visa |
| ❌ Recusado (fundos insuficientes) | 5031 7557 3453 0604 | Mastercard |
| ❌ Recusado (dados inválidos) | 5031 7557 3453 0604 | Mastercard |

Mais cartões de teste: https://www.mercadopago.com.br/developers/pt/docs/checkout-api/testing

## 🔔 Passo 4: Configurar Webhooks (Notificações)

Os webhooks permitem que o Mercado Pago notifique seu sistema sobre mudanças nas assinaturas (pagamento aprovado, falha, cancelamento, etc).

### 1. Expor o Backend (Desenvolvimento)

Para desenvolvimento, use **ngrok** ou **localtunnel** para expor seu backend:

```bash
# Usando ngrok
ngrok http 3001

# Ou usando localtunnel
npx localtunnel --port 3001
```

Você receberá uma URL pública (ex: `https://abc123.ngrok.io`)

### 2. Configurar no Painel do Mercado Pago

1. Acesse: https://www.mercadopago.com.br/developers/panel/notifications/webhooks
2. Clique em **Nova configuração de webhook**
3. Configure:
   - **URL de notificação**: `https://sua-url-publica/api/mercadopago/webhook`
   - **Eventos**:
     - ✅ `payment` (Pagamentos)
     - ✅ `subscription_preapproval` (Assinaturas)
4. Clique em **Salvar**

### 3. Testar Webhook

O Mercado Pago enviará notificações para sua URL quando ocorrerem eventos.

Você pode ver os logs no terminal do backend:
```
📬 Webhook recebido: { type: 'payment', action: 'payment.created', id: 'xxx' }
✅ Pagamento aprovado: xxx
```

## 📊 Passo 5: Monitorar Transações

### No Painel do Mercado Pago

1. Acesse: https://www.mercadopago.com.br/activities
2. Você verá todas as transações e assinaturas
3. Para assinaturas: https://www.mercadopago.com.br/subscriptions

### No Supabase (Banco de Dados)

As assinaturas são salvas automaticamente na tabela `user_subscriptions`:

```sql
SELECT * FROM user_subscriptions
ORDER BY created_at DESC;
```

## 🚨 Troubleshooting

### Erro: "SDK do Mercado Pago não carregado"

**Solução**: Verifique se o script do SDK está no `index.html`:
```html
<script src="https://sdk.mercadopago.com/js/v2"></script>
```

### Erro: "MERCADOPAGO_ACCESS_TOKEN não configurado"

**Solução**:
1. Verifique se o arquivo `backend/.env` existe
2. Verifique se o `MERCADOPAGO_ACCESS_TOKEN` está preenchido
3. Reinicie o servidor backend

### Erro: "Token do Mercado Pago inválido"

**Solução**:
1. Verifique se você copiou o token completo (incluindo `TEST-` ou `APP_USR-`)
2. Verifique se não há espaços antes ou depois do token
3. Gere um novo token no painel do Mercado Pago

### Cartão é recusado

**Solução**:
1. Use os cartões de teste oficiais do Mercado Pago
2. Verifique se está usando credenciais de TESTE (não produção)
3. Confira se o CPF de teste é `12345678909`

### Webhook não está sendo recebido

**Solução**:
1. Verifique se o ngrok/localtunnel está rodando
2. Verifique se a URL configurada no Mercado Pago está correta
3. Teste manualmente: `curl -X POST https://sua-url/api/mercadopago/webhook`
4. Veja os logs no painel: https://www.mercadopago.com.br/developers/panel/notifications/webhooks

## 🎯 Passo 6: Deploy para Produção (Railway)

### 1. Configurar Variáveis no Railway

No painel do Railway (https://railway.app):

1. Vá em seu projeto backend
2. Clique em **Variables**
3. Adicione:
   ```
   MERCADOPAGO_ACCESS_TOKEN=APP_USR-seu-token-de-producao
   FRONTEND_URL=https://agendahof.com
   NODE_ENV=production
   ```

### 2. Configurar Webhook de Produção

1. Acesse: https://www.mercadopago.com.br/developers/panel/notifications/webhooks
2. Crie novo webhook com:
   - **URL**: `https://seu-backend.up.railway.app/api/mercadopago/webhook`
   - **Eventos**: `payment` e `subscription_preapproval`

### 3. Atualizar Frontend

No Vercel/Netlify, configure a variável:
```
VITE_MERCADOPAGO_PUBLIC_KEY=APP_USR-sua-public-key-de-producao
VITE_BACKEND_URL=https://seu-backend.up.railway.app
```

## 📚 Recursos Úteis

- [Documentação Oficial do Mercado Pago](https://www.mercadopago.com.br/developers/pt/docs)
- [API de Assinaturas (Pre-Approvals)](https://www.mercadopago.com.br/developers/pt/docs/subscriptions/introduction)
- [Cartões de Teste](https://www.mercadopago.com.br/developers/pt/docs/checkout-api/testing)
- [Webhooks](https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks)
- [Painel de Credenciais](https://www.mercadopago.com.br/developers/panel/credentials)

## 💡 Dicas Importantes

1. **Sempre teste com cartões de teste primeiro**
2. **Nunca commite suas credenciais no Git**
3. **Use `.env.example` como referência**
4. **Configure webhooks para receber notificações automáticas**
5. **Monitore o painel do Mercado Pago regularmente**

---

✅ **Pronto!** Agora você tem o Mercado Pago totalmente configurado e funcionando! 🎉
