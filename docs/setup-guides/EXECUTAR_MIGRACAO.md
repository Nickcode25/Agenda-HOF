# 🚀 Executar Migrações - Passo a Passo

## ⚠️ IMPORTANTE: Execute na ordem correta!

Os SQLs devem ser executados **nesta ordem exata**:

---

## 📋 Passo a Passo

### 1. Acesse o Supabase SQL Editor

1. Vá para: https://supabase.com/dashboard
2. Selecione seu projeto
3. Clique em **SQL Editor** no menu lateral esquerdo
4. Clique em **"New Query"**

---

### 2. Execute o SQL de Cupons (PRIMEIRO)

**Arquivo**: `01-create-coupons-table.sql`

1. Abra o arquivo: `/home/nicolas/Agenda-HOF/supabase-migrations/01-create-coupons-table.sql`
2. **Copie TODO o conteúdo** (Ctrl+A, Ctrl+C)
3. **Cole no SQL Editor** do Supabase
4. Clique em **RUN** ou pressione `Ctrl+Enter`
5. ✅ Deve aparecer: "✅ Tabela de cupons criada com sucesso!"

**Se der erro:**
- Certifique-se que copiou TODO o arquivo
- Verifique se não há erros de sintaxe
- Tente executar novamente

---

### 3. Execute o SQL de Assinaturas (SEGUNDO)

**Arquivo**: `02-create-subscriptions-table.sql`

1. Crie uma **nova query** no SQL Editor
2. Abra o arquivo: `/home/nicolas/Agenda-HOF/supabase-migrations/02-create-subscriptions-table.sql`
3. **Copie TODO o conteúdo** (Ctrl+A, Ctrl+C)
4. **Cole no SQL Editor** do Supabase
5. Clique em **RUN** ou pressione `Ctrl+Enter`
6. ✅ Deve aparecer: "✅ Tabela de assinaturas criada com sucesso!"

**Se der erro de "relation discount_coupons does not exist":**
- Você pulou o passo 2
- Execute o arquivo `01-create-coupons-table.sql` primeiro

---

## ✅ Verificar se funcionou

Execute este SQL para verificar as tabelas:

```sql
-- Verificar tabelas criadas
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'discount_coupons',
  'coupon_usage',
  'user_subscriptions',
  'subscription_payments',
  'pagbank_webhooks'
)
ORDER BY table_name;
```

**Deve retornar 5 linhas:**
- ✅ coupon_usage
- ✅ discount_coupons
- ✅ pagbank_webhooks
- ✅ subscription_payments
- ✅ user_subscriptions

---

## 🎯 Testar as Funções

### Testar função de cupom:

```sql
-- Criar um cupom de teste
INSERT INTO discount_coupons (code, discount_percentage, is_active)
VALUES ('TESTE10', 10, true);

-- Ver o cupom criado
SELECT * FROM discount_coupons;

-- Testar incrementar uso
SELECT increment_coupon_usage((SELECT id FROM discount_coupons WHERE code = 'TESTE10'));

-- Verificar se incrementou
SELECT code, current_uses FROM discount_coupons WHERE code = 'TESTE10';
-- Deve mostrar current_uses = 1
```

### Testar função de assinatura:

```sql
-- Verificar se função existe
SELECT is_subscription_active('00000000-0000-0000-0000-000000000000'::uuid);
-- Deve retornar: false (porque não tem assinatura para esse UUID)
```

---

## 🐛 Problemas Comuns

### Erro: "relation discount_coupons does not exist"
**Solução**: Execute o arquivo `01-create-coupons-table.sql` primeiro

### Erro: "relation users does not exist"
**Solução**: Isso está corrigido na nova versão. Use os arquivos `01-` e `02-`

### Erro: "permission denied"
**Solução**: Certifique-se que está logado como admin no Supabase

### Erro: "syntax error"
**Solução**:
1. Copie TODO o arquivo (não apenas parte dele)
2. Não edite o SQL manualmente
3. Cole direto no SQL Editor

---

## 📞 Próximo Passo

Depois de executar as migrações com sucesso, siga o guia:
**[ASSINATURA_AUTOMATICA_SETUP.md](ASSINATURA_AUTOMATICA_SETUP.md)**

Especialmente:
- ✅ Passo 2: Configurar Webhook no PagBank
- ✅ Passo 3: Verificar Token do PagBank
- ✅ Testar o sistema completo

---

## ✨ Dica

Você pode executar ambos os SQLs de uma vez só:

1. Copie o conteúdo de `01-create-coupons-table.sql`
2. Cole no SQL Editor
3. Adicione uma linha em branco
4. Cole o conteúdo de `02-create-subscriptions-table.sql` logo abaixo
5. Execute tudo de uma vez

**Mas é mais seguro executar um de cada vez!** 🎯
