# 🔄 Assinatura Automática - Guia Completo de Setup

## ✅ O que foi implementado:

Sistema completo de **cobrança recorrente automática** usando PagBank. Agora seus clientes serão cobrados automaticamente **R$ 109,90 todo mês** no mesmo cartão que usaram no cadastro.

---

## 📋 Pré-requisitos

1. ✅ Token do PagBank válido (produção)
2. ✅ Backend rodando na porta 3001
3. ✅ Frontend rodando na porta 5175
4. ⚠️ **IMPORTANTE**: Configurar webhook no painel do PagBank

---

## 🚀 Passo a Passo para Ativar

### 1. Executar Migrações SQL no Supabase

Acesse: https://supabase.com/dashboard/project/YOUR_PROJECT/editor

Execute os seguintes SQLs em ordem:

#### 1.1. Criar tabelas de assinaturas
```sql
-- Copie TODO o conteúdo do arquivo:
/home/nicolas/Agenda-HOF/supabase-migrations/create-subscriptions-table.sql
```

#### 1.2. Criar tabelas de cupons
```sql
-- Copie TODO o conteúdo do arquivo:
/home/nicolas/Agenda-HOF/supabase-migrations/create-coupons-table.sql
```

#### 1.3. Criar função para incrementar uso de cupom
```sql
CREATE OR REPLACE FUNCTION increment_coupon_usage(coupon_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE discount_coupons
  SET current_uses = current_uses + 1
  WHERE id = coupon_id;
END;
$$ LANGUAGE plpgsql;
```

---

### 2. Configurar Webhook no PagBank

O PagBank precisa enviar notificações quando acontecer:
- ✅ Pagamento confirmado
- ❌ Pagamento falhou
- 🔄 Assinatura renovada
- 🚫 Assinatura cancelada

#### Como configurar:

1. **Acesse**: https://pagseguro.uol.com.br/preferencias/integracoes.jhtml
2. **Procure por "Webhooks" ou "Notificações"**
3. **Configure a URL do webhook**:
   - **Desenvolvimento**: `http://SEU_IP_PUBLICO:3001/api/pagbank/webhook`
   - **Produção**: `https://seu-dominio.com/api/pagbank/webhook`

4. **Selecione os eventos**:
   - [x] SUBSCRIPTION.CREATED
   - [x] SUBSCRIPTION.ACTIVATED
   - [x] SUBSCRIPTION.SUSPENDED
   - [x] SUBSCRIPTION.CANCELLED
   - [x] CHARGE.PAID
   - [x] CHARGE.FAILED

5. **Salve a configuração**

#### ⚠️ IMPORTANTE: Expor o backend para internet

Para receber webhooks em desenvolvimento, você precisa expor o backend:

**Opção 1: Usar ngrok (Recomendado)**
```bash
# Instalar ngrok
snap install ngrok

# Expor porta 3001
ngrok http 3001

# Copie a URL fornecida (ex: https://abc123.ngrok.io)
# Use: https://abc123.ngrok.io/api/pagbank/webhook
```

**Opção 2: Fazer deploy em produção**
- Deploy no Railway, Render, ou Heroku
- Use a URL pública no webhook

---

### 3. Verificar Token do PagBank

O token atual pode estar inválido. Verifique:

```bash
# Ver token atual
cat /home/nicolas/Agenda-HOF/backend/.env | grep PAGBANK_TOKEN
```

Se estiver dando erro "unauthorized", gere um novo token:

1. Acesse: https://pagseguro.uol.com.br/
2. Vá em **Integrações** > **Tokens**
3. Gere um **novo token de produção**
4. Atualize no `.env`:
   ```
   PAGBANK_TOKEN=SEU_NOVO_TOKEN_AQUI
   ```
5. Reinicie o backend:
   ```bash
   cd /home/nicolas/Agenda-HOF/backend
   pkill -f "npm run dev"
   npm run dev
   ```

---

## 🧪 Testar o Sistema

### 1. Criar um cupom de teste (Opcional)

1. Acesse: http://localhost:5175/admin/login
2. Faça login no painel admin
3. Vá em **Cupons** no menu
4. Crie um cupom:
   - Código: `TESTE10`
   - Desconto: `10%`
   - Deixe ilimitado
   - Marque como ativo

### 2. Testar cadastro com assinatura

1. Acesse: http://localhost:5175
2. Clique em **"Começar Agora"**
3. Preencha os dados de cadastro
4. Na página de checkout:
   - (Opcional) Digite `TESTE10` no campo de cupom
   - Preencha dados do cartão
   - **Use cartão de teste do PagBank**:
     ```
     Número: 4111 1111 1111 1111
     Validade: 12/28
     CVV: 123
     CPF: qualquer CPF válido
     ```
5. Clique em **"Pagar R$ 109,90"**

### 3. Verificar se funcionou

**No Backend (console):**
```
🔄 Criando assinatura recorrente: { customerEmail: 'test@example.com', cardNumber: '****1111' }
✅ Plano criado: plan_abc123
✅ Assinatura criada: sub_xyz789 Status: ACTIVE
```

**No Frontend (alert):**
```
🎉 Assinatura criada com sucesso!

💳 Cartão: **** **** **** 1111
💰 Valor mensal: R$ 109,90
📅 Próxima cobrança: 22/11/2025

✅ Sua conta foi criada e o acesso está liberado!
🔄 Você será cobrado automaticamente todo mês no mesmo cartão.
```

**No Supabase:**
- Verifique a tabela `user_subscriptions`
- Deve ter 1 registro com `status = 'active'`

---

## 📊 Como Funciona a Cobrança Automática

### Fluxo de Pagamento

```
1. Cliente preenche cadastro
2. Cliente adiciona cartão de crédito
3. PagBank cria assinatura (cobra R$ 109,90 imediatamente)
4. Cliente é redirecionado para o app
5. **Todo dia X do mês, PagBank cobra automaticamente**
6. PagBank envia webhook confirmando pagamento
7. Sistema atualiza status da assinatura
```

### Timeline de Pagamentos

```
Dia 22/10/2025 - Cadastro
├─ Cobrança: R$ 109,90 (imediata)
├─ Status: ACTIVE
└─ Próxima cobrança: 22/11/2025

Dia 22/11/2025 - Renovação automática
├─ PagBank tenta cobrar R$ 109,90
├─ Se sucesso: mantém ACTIVE
├─ Se falha: status vira PAST_DUE
└─ Próxima tentativa: 23/11/2025

Dia 23/11/2025 - Segunda tentativa (se falhou)
├─ PagBank tenta novamente
├─ Se sucesso: volta para ACTIVE
└─ Se falha: mais 2 tentativas nos próximos dias

Dia 26/11/2025 - Última tentativa
├─ Se sucesso: ACTIVE
└─ Se falha: SUSPENDED (bloquear acesso)
```

---

## 🔧 Gerenciar Assinaturas

### Ver assinaturas ativas

```sql
SELECT
  u.email,
  s.status,
  s.plan_amount,
  s.next_billing_date,
  s.card_last_digits
FROM user_subscriptions s
JOIN auth.users u ON u.id = s.user_id
WHERE s.status = 'active'
ORDER BY s.created_at DESC;
```

### Ver pagamentos do último mês

```sql
SELECT
  u.email,
  p.amount,
  p.status,
  p.paid_at
FROM subscription_payments p
JOIN user_subscriptions s ON s.id = p.subscription_id
JOIN auth.users u ON u.id = s.user_id
WHERE p.created_at >= NOW() - INTERVAL '30 days'
ORDER BY p.created_at DESC;
```

### Cancelar assinatura manualmente

1. Pegue o `pagbank_subscription_id` do banco:
   ```sql
   SELECT pagbank_subscription_id
   FROM user_subscriptions
   WHERE user_id = 'USER_ID_HERE';
   ```

2. Faça POST para o endpoint:
   ```bash
   curl -X POST http://localhost:3001/api/pagbank/cancel-subscription/SUB_ID_AQUI
   ```

3. Atualize status no banco:
   ```sql
   UPDATE user_subscriptions
   SET status = 'cancelled', cancelled_at = NOW()
   WHERE pagbank_subscription_id = 'SUB_ID_AQUI';
   ```

---

## 🚨 Troubleshooting

### Erro: "unauthorized" do PagBank
**Solução**: Token expirado. Gere novo token (ver passo 3)

### Erro: "Erro ao criar plano"
**Solução**: Token sem permissão para criar planos. Use token de **produção**, não sandbox.

### Webhook não está chegando
**Soluções**:
1. Verifique se configurou URL correta no PagBank
2. Verifique se backend está acessível publicamente
3. Use ngrok em desenvolvimento
4. Verifique logs do backend: `tail -f backend/logs.txt`

### Assinatura criada mas não aparece no banco
**Solução**: Verificar se usuário foi criado primeiro:
```sql
SELECT * FROM auth.users WHERE email = 'EMAIL_DO_CLIENTE';
```

### Cliente não consegue acessar o app
**Soluções**:
1. Verificar se assinatura está `active`:
   ```sql
   SELECT status FROM user_subscriptions WHERE user_id = 'USER_ID';
   ```
2. Verificar se não há bloqueio por falta de pagamento

---

## 📈 Próximos Passos

### 1. Implementar bloqueio automático
Criar job que roda diariamente:
```sql
-- Bloquear usuários com assinatura suspensa
UPDATE users
SET is_blocked = TRUE
WHERE id IN (
  SELECT user_id
  FROM user_subscriptions
  WHERE status IN ('suspended', 'past_due', 'cancelled')
);
```

### 2. Enviar emails de lembrete
- 7 dias antes do vencimento
- 1 dia antes do vencimento
- Quando pagamento falhar

### 3. Criar dashboard de métricas
- MRR (Monthly Recurring Revenue)
- Churn Rate
- Assinaturas ativas vs canceladas
- Taxa de falha de pagamento

---

## 💡 Dicas Importantes

1. **Sempre use HTTPS em produção** - PagBank não envia webhooks para HTTP
2. **Valide a assinatura do webhook** - PagBank envia um header `x-pagseguro-signature`
3. **Mantenha logs de todos os webhooks** - Tabela `pagbank_webhooks` já está configurada
4. **Teste com cartões reais antes de lançar** - Sandbox tem comportamento diferente
5. **Monitore falhas de pagamento** - Implemente alertas para quando taxa de falha subir

---

## 📞 Suporte

**Documentação PagBank**:
- Assinaturas: https://dev.pagseguro.uol.com.br/reference/criar-assinatura
- Webhooks: https://dev.pagseguro.uol.com.br/reference/webhooks-1

**Problemas?**
- Verifique logs do backend: `tail -f backend/logs.txt`
- Verifique logs do PagBank no painel deles
- Entre em contato com suporte do PagBank

---

## ✅ Checklist Final

Antes de colocar em produção, verifique:

- [ ] Executou todas as migrações SQL
- [ ] Token do PagBank é de **produção** (não sandbox)
- [ ] Webhook configurado no painel do PagBank
- [ ] Backend acessível publicamente (não localhost)
- [ ] Testou cadastro completo com cartão real
- [ ] Verificou que assinatura aparece no banco
- [ ] Testou cancelamento de assinatura
- [ ] Configurou emails de notificação
- [ ] Implementou bloqueio automático por falta de pagamento
- [ ] Criou plano de backup para quando PagBank cair

**Tudo pronto? Parabéns! Seu sistema de assinatura automática está funcionando! 🎉**
