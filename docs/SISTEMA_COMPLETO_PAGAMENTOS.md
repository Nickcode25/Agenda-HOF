# 🎉 SISTEMA COMPLETO DE PAGAMENTOS E ASSINATURAS - AGENDA HOF

## 📋 ÍNDICE
- [Visão Geral](#visão-geral)
- [Arquitetura](#arquitetura)
- [Configurações em Produção](#configurações-em-produção)
- [Webhook e Automação](#webhook-e-automação)
- [Gestão de Assinaturas](#gestão-de-assinaturas)
- [Banco de Dados](#banco-de-dados)
- [Testes](#testes)
- [Troubleshooting](#troubleshooting)

---

## 🎯 VISÃO GERAL

Sistema completo de assinaturas recorrentes integrado com **Mercado Pago** em modo **PRODUÇÃO**.

### **URLs em Produção:**
- **Frontend**: https://agendahof.com
- **Backend**: https://agenda-hof-production.up.railway.app
- **Gerenciamento**: https://agendahof.com/app/assinatura

### **Valores:**
- **Plano Profissional**: R$ 99,90/mês
- **Período de Trial**: 7 dias gratuitos
- **Renovação**: Automática mensal

---

## 🏗️ ARQUITETURA

```
┌─────────────────┐
│   agendahof.com │ (Frontend - Vercel)
│   React + Vite  │
└────────┬────────┘
         │
         │ HTTPS/SSL
         │
┌────────▼────────────────────────────┐
│  Railway Backend                    │
│  https://agenda-hof-production...   │
│  Node.js + Express                  │
└────────┬────────────────────────────┘
         │
    ┌────┴─────┬─────────────┬──────────────┐
    │          │             │              │
┌───▼──────┐ ┌─▼──────────┐ ┌▼───────────┐ ┌▼──────────┐
│ Mercado  │ │  Supabase  │ │  Webhook   │ │   User    │
│   Pago   │ │ PostgreSQL │ │  Events    │ │  Frontend │
└──────────┘ └────────────┘ └────────────┘ └───────────┘
```

---

## ⚙️ CONFIGURAÇÕES EM PRODUÇÃO

### **1. Mercado Pago**

**Credenciais de Produção:**
```
Public Key: APP_USR-f03fc6c1-5697-4801-ba56-18a7a1d0a3d5
Access Token: APP_USR-231348987664660-102309-042e1481b03019c34d564d50f4890242-21577853
```

**Painel de Desenvolvedores:**
- https://www.mercadopago.com.br/developers/panel/credentials

---

### **2. Railway (Backend)**

**Variáveis de Ambiente:**
```bash
MERCADOPAGO_ACCESS_TOKEN=APP_USR-231348987664660-102309-042e1481b03019c34d564d50f4890242-21577853
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://agendahof.com
SUPABASE_URL=https://zgdxszwjbbxepsvyjtrb.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpnZHhzendqYmJ4ZXBzdnlqdHJiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTQxNTgxMCwiZXhwIjoyMDc0OTkxODEwfQ.SGMcaNsBiLa4jl2cL9Bq6KCJfzrZJdhWZKyuNRx1ebs
```

**URL do Serviço:**
```
https://agenda-hof-production.up.railway.app
```

---

### **3. Vercel (Frontend)**

**Variáveis de Ambiente:**
```bash
VITE_SUPABASE_URL=https://zgdxszwjbbxepsvyjtrb.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpnZHhzendqYmJ4ZXBzdnlqdHJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MTU4MTAsImV4cCI6MjA3NDk5MTgxMH0.NZdEYYCOZlMUo5h7TM-gsSTxmgMx7ta9W_gsi7ZNHCA
VITE_BACKEND_URL=https://agenda-hof-production.up.railway.app
VITE_MERCADOPAGO_PUBLIC_KEY=APP_USR-f03fc6c1-5697-4801-ba56-18a7a1d0a3d5
```

**Domínio:**
```
agendahof.com
www.agendahof.com
```

---

### **4. GoDaddy (DNS)**

**Registros DNS:**
```
Tipo A:
Nome: @
Valor: 76.76.21.21

Tipo CNAME:
Nome: www
Valor: cname.vercel-dns.com
```

---

## 🔔 WEBHOOK E AUTOMAÇÃO

### **Configuração do Webhook**

**URL do Webhook:**
```
https://agenda-hof-production.up.railway.app/api/mercadopago/webhook
```

**Eventos Monitorados:**
- ✅ `payment` - Pagamentos
- ✅ `subscription_preapproval` - Assinaturas pré-aprovadas
- ✅ `subscription_authorized_payment` - Pagamentos recorrentes autorizados

**Painel de Webhooks:**
- https://www.mercadopago.com.br/developers/panel/notifications/webhooks

---

### **Fluxo do Webhook**

```
1. Mercado Pago detecta evento (pagamento, renovação, cancelamento)
   ↓
2. Envia POST para /api/mercadopago/webhook
   ↓
3. Backend processa e salva em:
   - mercadopago_webhooks (auditoria)
   - payment_history (histórico)
   - user_subscriptions (atualiza status)
   ↓
4. Usuário vê mudanças automaticamente no painel
```

---

### **Endpoints do Backend**

**Health Check:**
```bash
GET https://agenda-hof-production.up.railway.app/health
```

**Criar Assinatura:**
```bash
POST /api/mercadopago/create-subscription
```

**Cancelar Assinatura:**
```bash
POST /api/mercadopago/cancel-subscription/:id
```

**Webhook:**
```bash
POST /api/mercadopago/webhook
```

---

## 💼 GESTÃO DE ASSINATURAS

### **Página de Gerenciamento**

**URL:** https://agendahof.com/app/assinatura

**Funcionalidades:**
1. ✅ Visualizar detalhes da assinatura
2. ✅ Ver próxima data de cobrança
3. ✅ Cancelar assinatura
4. ✅ Histórico de pagamentos
5. ✅ Status em tempo real

**Acesso:**
- Clique no badge "Premium" no header
- Ou acesse diretamente `/app/assinatura`

---

### **Tipos de Usuário**

**1. Trial (Período de Teste)**
- 7 dias gratuitos
- Acesso completo ao sistema
- Sem badge Premium
- Pode assinar a qualquer momento

**2. Assinante Pago**
- Badge Premium no header
- R$ 99,90/mês
- Renovação automática
- Pode cancelar quando quiser

**3. Sem Assinatura**
- Acesso bloqueado após trial
- Pode assinar para reativar

---

## 💾 BANCO DE DADOS

### **Tabelas**

**1. user_subscriptions**
```sql
Colunas principais:
- id (UUID)
- user_id (UUID)
- subscription_id (TEXT) -- ID do Mercado Pago
- status (TEXT) -- active, cancelled, paused
- plan_type (TEXT) -- professional
- amount (NUMERIC) -- 99.90
- next_billing_date (TIMESTAMP)
- last_payment_date (TIMESTAMP)
- cancelled_at (TIMESTAMP)
- created_at (TIMESTAMP)
```

**2. mercadopago_webhooks**
```sql
Colunas principais:
- id (UUID)
- event_type (TEXT) -- payment, subscription_preapproval
- event_action (TEXT) -- created, updated
- resource_id (TEXT) -- ID do recurso
- payload (JSONB) -- Dados completos do evento
- processed (BOOLEAN)
- processed_at (TIMESTAMP)
- created_at (TIMESTAMP)
```

**3. payment_history**
```sql
Colunas principais:
- id (UUID)
- payment_id (TEXT UNIQUE)
- subscription_id (TEXT)
- amount (NUMERIC)
- status (TEXT) -- approved, rejected, pending
- status_detail (TEXT)
- payment_method (TEXT)
- payer_email (TEXT)
- created_at (TIMESTAMP)
```

---

### **Scripts SQL Importantes**

**Criar tabelas de webhook:**
```bash
/database/CREATE_WEBHOOK_AND_PAYMENT_TABLES.sql
```

**Corrigir colunas de assinatura:**
```bash
/database/FIX_USER_SUBSCRIPTIONS_COLUMNS.sql
```

**Verificar estrutura:**
```bash
/database/CHECK_USER_SUBSCRIPTIONS.sql
```

---

## 🧪 TESTES

### **Testar Pagamento em Produção**

1. Acesse: https://agendahof.com/checkout
2. Use um cartão de crédito REAL
3. Será cobrado R$ 99,90/mês

### **Testar Webhook**

1. Faça um pagamento
2. Verifique logs no Railway
3. Confira tabelas no Supabase:
   - `mercadopago_webhooks` deve ter novo registro
   - `payment_history` deve ter novo pagamento
   - `user_subscriptions` deve ter status atualizado

### **Testar Cancelamento**

1. Acesse: https://agendahof.com/app/assinatura
2. Clique em "Cancelar Assinatura"
3. Confirme
4. Verifique que status mudou para `cancelled`

---

## 🔧 TROUBLESHOOTING

### **Problema: Backend crashou no Railway**

**Solução:**
1. Verifique se todas as variáveis de ambiente estão configuradas
2. Clique em "Restart" no Railway
3. Verifique logs em "Deployments" → "View logs"

---

### **Problema: Webhook não está sendo recebido**

**Verificar:**
1. URL do webhook está correta no Mercado Pago?
2. Backend está rodando? (https://agenda-hof-production.up.railway.app/health)
3. Eventos corretos estão marcados?

**Logs:**
- Railway → Logs → Buscar por "📬 Webhook recebido"

---

### **Problema: Dados não aparecem na página de gerenciamento**

**Verificar:**
1. Tabela `user_subscriptions` tem a coluna `subscription_id`?
2. Execute: `/database/FIX_USER_SUBSCRIPTIONS_COLUMNS.sql`
3. Verifique se `amount` e `next_billing_date` estão preenchidos

---

### **Problema: SSL Certificate Required**

**Causa:** Tentando usar credenciais de PRODUÇÃO em localhost (HTTP)

**Solução:**
- Use credenciais de TESTE para desenvolvimento local
- Ou use ngrok para criar túnel HTTPS

---

## 📊 MONITORAMENTO

### **Logs do Backend (Railway)**

```bash
# Ver webhooks recebidos
grep "📬 Webhook recebido" logs

# Ver pagamentos aprovados
grep "✅ Pagamento aprovado" logs

# Ver assinaturas canceladas
grep "🚫 Assinatura cancelada" logs
```

### **Supabase Dashboard**

**Tabelas para monitorar:**
1. `mercadopago_webhooks` - Todos os eventos recebidos
2. `payment_history` - Histórico de pagamentos
3. `user_subscriptions` - Status das assinaturas

---

## 🎯 CHECKLIST DE DEPLOYMENT

### **Antes de ir para produção:**

- [x] Credenciais de PRODUÇÃO configuradas
- [x] Backend com SSL (Railway)
- [x] Frontend com SSL (Vercel)
- [x] Domínio configurado (agendahof.com)
- [x] Webhook configurado no Mercado Pago
- [x] Tabelas criadas no Supabase
- [x] Variáveis de ambiente no Railway
- [x] Variáveis de ambiente na Vercel
- [x] Testes de pagamento realizados
- [x] Página de gerenciamento funcionando

---

## 📞 CONTATOS E LINKS ÚTEIS

**Mercado Pago:**
- Painel: https://www.mercadopago.com.br/developers/panel
- Webhooks: https://www.mercadopago.com.br/developers/panel/notifications/webhooks
- Documentação: https://www.mercadopago.com.br/developers/pt/docs

**Railway:**
- Dashboard: https://railway.app
- Projeto: https://railway.app/project/7e688368-3408-4ef2-99c1-a6814cbc6404

**Vercel:**
- Dashboard: https://vercel.com
- Projeto: https://vercel.com/nicolas-gomes-da-costas-projects/agenda-hof

**Supabase:**
- Dashboard: https://supabase.com/dashboard/project/zgdxszwjbbxepsvyjtrb

---

## 🎉 CONCLUSÃO

Sistema completo de assinaturas recorrentes implementado com sucesso!

**Capacidades:**
- ✅ Aceita pagamentos reais (R$ 99,90/mês)
- ✅ Renovação automática mensal
- ✅ Webhook para processar eventos
- ✅ Gestão completa de assinaturas
- ✅ Histórico de pagamentos
- ✅ Cancelamento pelo usuário
- ✅ 100% em produção com SSL

**Desenvolvido em:** 02 de Novembro de 2025
**Status:** ✅ PRODUÇÃO ATIVA

---

🤖 **Gerado com Claude Code**
