# 🚀 Configuração do Mercado Pago - PRODUÇÃO

## 📋 Passo 1: Obter Credenciais de Produção

### 1.1 Acesse o Painel do Mercado Pago
- URL: https://www.mercadopago.com.br/developers/panel/credentials
- Faça login com sua conta

### 1.2 Selecione "Credenciais de produção"
- **NÃO** use "Credenciais de teste"
- Procure pela opção "Credenciais de produção" ou "Production credentials"

### 1.3 Copie as credenciais:
- **Public Key** (começa com `APP_USR-...`)
  - Esta chave será usada no frontend
  - Exemplo: `APP_USR-12345678-abcd-1234-abcd-123456789012`

- **Access Token** (começa com `APP_USR-...`)
  - Esta chave será usada no backend
  - Exemplo: `APP_USR-1234567890123456-123456-abc123def456...`

### ⚠️ IMPORTANTE:
- Credenciais de TESTE começam com `TEST-`
- Credenciais de PRODUÇÃO começam com `APP_USR-`
- **NUNCA** compartilhe suas credenciais publicamente
- **NUNCA** commite o arquivo `.env` no Git

---

## 🔧 Passo 2: Configurar Variáveis de Ambiente

### 2.1 Frontend (.env)
Edite o arquivo `.env` na raiz do projeto:

```bash
# Supabase (manter como está)
VITE_SUPABASE_URL=sua_url_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_supabase

# Backend URL (alterar em produção)
VITE_BACKEND_URL=http://localhost:3001

# Mercado Pago - PRODUÇÃO
VITE_MERCADOPAGO_PUBLIC_KEY=APP_USR-sua-public-key-aqui
```

### 2.2 Backend (backend/.env)
Edite o arquivo `backend/.env`:

```bash
# Mercado Pago - PRODUÇÃO
MERCADOPAGO_ACCESS_TOKEN=APP_USR-seu-access-token-aqui

# Frontend URL
FRONTEND_URL=http://localhost:5175

# Porta e ambiente
PORT=3001
NODE_ENV=production
```

---

## 🔔 Passo 3: Configurar Webhook

### 3.1 O que é Webhook?
O webhook é uma URL que o Mercado Pago chama automaticamente quando:
- Um pagamento é aprovado
- Uma assinatura é renovada
- Uma assinatura é cancelada
- Um pagamento falha

### 3.2 Preparar URL pública
Para testes locais, você precisa de uma URL pública. Opções:

**Opção 1: ngrok (recomendado para testes)**
```bash
# Instalar ngrok
npm install -g ngrok

# Expor porta 3001
ngrok http 3001

# Você receberá uma URL como:
# https://abc123.ngrok.io
```

**Opção 2: Deploy em produção**
- Railway: https://railway.app
- Heroku: https://heroku.com
- Render: https://render.com

### 3.3 Configurar Webhook no Mercado Pago
1. Acesse: https://www.mercadopago.com.br/developers/panel/notifications/webhooks
2. Clique em "Criar webhook"
3. Configure:
   - **URL**: `https://sua-url-publica/api/mercadopago/webhook`
   - **Eventos**: Selecione todos relacionados a pagamentos e assinaturas
   - **Modo**: Produção

### 3.4 Testar Webhook
```bash
# O Mercado Pago enviará um POST para:
POST https://sua-url-publica/api/mercadopago/webhook

# Você pode simular localmente:
curl -X POST http://localhost:3001/api/mercadopago/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "type": "payment",
    "data": {"id": "123456789"}
  }'
```

---

## 💳 Passo 4: Testar Pagamentos Reais

### 4.1 Cartões de Teste (NÃO USE EM PRODUÇÃO)
**Apenas para homologação:**
- Aprovado: `5031 4332 1540 6351`
- CVV: `123`
- Validade: `11/25`

### 4.2 Cartões Reais
Use seu próprio cartão de crédito real para testar.

⚠️ **ATENÇÃO**: Pagamentos reais serão cobrados de verdade!

### 4.3 Fluxo de teste
1. Acesse o sistema
2. Clique em "Assinar Agora"
3. Preencha com cartão real
4. Confirme pagamento
5. Verifique:
   - Email de confirmação do Mercado Pago
   - Assinatura salva no banco
   - Badge Premium apareceu
   - Banner de trial sumiu

---

## 🔐 Passo 5: Deploy em Produção

### 5.1 Frontend (Vercel)
Já configurado! Adicione variáveis de ambiente:
- Dashboard: https://vercel.com/seu-projeto/settings/environment-variables
- Adicione: `VITE_MERCADOPAGO_PUBLIC_KEY` com valor de produção

### 5.2 Backend (Railway/Heroku)
Configure variáveis:
- `MERCADOPAGO_ACCESS_TOKEN` (produção)
- `FRONTEND_URL` (URL do Vercel)
- `NODE_ENV=production`
- `PORT=3001`

### 5.3 Atualizar URLs
- Frontend `.env`: `VITE_BACKEND_URL=https://seu-backend.railway.app`
- Backend `.env`: `FRONTEND_URL=https://seu-site.vercel.app`

---

## ✅ Checklist Final

Antes de ir para produção, verifique:

- [ ] Credenciais de PRODUÇÃO configuradas
- [ ] Webhook configurado e testado
- [ ] Pagamento real testado em homologação
- [ ] Backend deployado e acessível
- [ ] Frontend com URL do backend atualizada
- [ ] Variáveis de ambiente corretas no Vercel/Railway
- [ ] Email de confirmação funcionando
- [ ] Renovação automática testada
- [ ] Cancelamento de assinatura funcionando
- [ ] Logs de erro configurados

---

## 📞 Suporte

- Documentação Mercado Pago: https://www.mercadopago.com.br/developers/pt/docs
- Suporte: https://www.mercadopago.com.br/developers/pt/support
- Status da API: https://status.mercadopago.com

---

## 🚨 Problemas Comuns

### Erro: "Invalid credentials"
- Verifique se está usando credenciais de PRODUÇÃO (APP_USR-)
- Verifique se as credenciais estão corretas

### Webhook não recebe notificações
- Verifique se a URL é pública e acessível
- Teste com: https://webhook.site
- Verifique logs no painel do Mercado Pago

### Pagamento aprovado mas assinatura não salva
- Verifique logs do backend
- Verifique políticas RLS do Supabase
- Verifique se webhook foi chamado

---

**Documentação criada em:** 02/11/2025
**Última atualização:** 02/11/2025
