# 📊 Sistema de Gestão de Assinantes

## 🎯 Melhorias Implementadas

### 1. **Captura de CPF e Telefone no Checkout**
Agora quando um usuário assina o plano, o sistema automaticamente salva:
- ✅ **CPF** (do campo do cartão)
- ✅ **Telefone** (do cadastro)

Esses dados são salvos nos **metadados do usuário** (`auth.users.raw_user_meta_data`) e ficam disponíveis para consulta.

**Arquivo modificado:** `src/pages/Checkout.tsx`

```typescript
// Atualizar metadados do usuário com CPF e telefone
await supabase.auth.updateUser({
  data: {
    cpf: cardCpf.replace(/\D/g, ''),
    phone: userData.phone
  }
})
```

---

### 2. **View SQL para Dados Completos de Assinantes**
Criamos uma **view** no Supabase que junta automaticamente:
- Dados da assinatura (`user_subscriptions`)
- Dados do usuário (`auth.users`)
- Dados do cupom (`discount_coupons`)

**Vantagens:**
- ✅ Consulta simplificada em uma única query
- ✅ Dados sempre atualizados
- ✅ Queries prontas para usar

---

## 🚀 Como Configurar

### Passo 1: Criar a View no Supabase

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **SQL Editor**
4. Abra o arquivo `CREATE_SUBSCRIBERS_VIEW.sql`
5. Cole todo o conteúdo no editor
6. Clique em **RUN** (ou Ctrl+Enter)

Você verá a mensagem: ✅ View subscribers_view criada com sucesso!

---

### Passo 2: Usar as Queries Prontas

Agora você pode usar qualquer query do arquivo `QUERIES_ASSINANTES.sql`:

#### 📋 Query Básica: Ver todos os assinantes
```sql
SELECT * FROM subscribers_view;
```

#### ✅ Apenas assinaturas ativas
```sql
SELECT
  name,
  email,
  cpf,
  phone,
  subscription_status,
  plan_amount,
  next_billing_date
FROM subscribers_view
WHERE subscription_status = 'active';
```

#### 💰 Receita mensal recorrente
```sql
SELECT
  COUNT(*) as total_assinaturas_ativas,
  SUM(plan_amount) as receita_mensal_recorrente
FROM subscribers_view
WHERE subscription_status = 'active';
```

#### 🎟️ Assinaturas com cupom
```sql
SELECT
  name,
  email,
  coupon_code,
  discount_percentage,
  plan_amount
FROM subscribers_view
WHERE coupon_id IS NOT NULL;
```

---

## 📂 Arquivos Criados

### 1. `CREATE_SUBSCRIBERS_VIEW.sql`
- Cria a view `subscribers_view` no Supabase
- Junta dados de assinaturas + usuários + cupons
- **Executar UMA VEZ no Supabase**

### 2. `QUERIES_ASSINANTES.sql`
- 10 queries prontas para consultar assinantes
- Copie e cole no SQL Editor do Supabase
- **Usar sempre que precisar consultar dados**

### 3. `README_ASSINANTES.md` (este arquivo)
- Documentação completa do sistema
- Instruções de uso

---

## 🔍 Campos Disponíveis na View

### Dados da Assinatura
- `subscription_id` - ID único da assinatura
- `mercadopago_subscription_id` - ID no Mercado Pago
- `subscription_status` - Status (active, payment_failed, cancelled)
- `plan_amount` - Valor da assinatura
- `billing_cycle` - Ciclo de cobrança (MONTHLY)
- `next_billing_date` - Data da próxima cobrança
- `card_last_digits` - Últimos 4 dígitos do cartão
- `card_brand` - Bandeira (visa, master, elo, etc)
- `discount_percentage` - % de desconto aplicado

### Dados do Usuário
- `name` - Nome completo
- `email` - Email
- `cpf` - CPF (agora salvo!)
- `phone` - Telefone (agora salvo!)
- `user_created_at` - Data de cadastro
- `last_sign_in_at` - Último login

### Dados do Cupom (se houver)
- `coupon_code` - Código do cupom (ex: PROMO98)
- `coupon_discount_value` - Valor do desconto

---

## 📊 Exemplos de Uso

### Encontrar um assinante específico
```sql
SELECT * FROM subscribers_view
WHERE email = 'nataliacsgoncalves21@gmail.com';
```

### Assinaturas criadas hoje
```sql
SELECT name, email, plan_amount, subscription_created_at
FROM subscribers_view
WHERE DATE(subscription_created_at) = CURRENT_DATE;
```

### Estatísticas por status
```sql
SELECT
  subscription_status,
  COUNT(*) as quantidade,
  SUM(plan_amount) as receita_total
FROM subscribers_view
GROUP BY subscription_status;
```

### Próximas cobranças (7 dias)
```sql
SELECT
  name,
  email,
  plan_amount,
  next_billing_date,
  DATE_PART('day', next_billing_date - NOW()) as dias_restantes
FROM subscribers_view
WHERE subscription_status = 'active'
  AND next_billing_date BETWEEN NOW() AND NOW() + INTERVAL '7 days'
ORDER BY next_billing_date ASC;
```

---

## 🎯 Benefícios

### Antes ❌
- CPF e telefone não eram salvos
- Precisava fazer múltiplas queries com JOINs complexos
- Dados espalhados em várias tabelas

### Depois ✅
- CPF e telefone salvos automaticamente
- Uma única query traz todos os dados
- Queries prontas para usar
- Visualização simplificada

---

## 🔐 Segurança

A view `subscribers_view` tem **Row Level Security (RLS)**:
- ✅ Usuários autenticados veem apenas suas próprias assinaturas
- ✅ Super admins veem todas as assinaturas
- ✅ Service role tem acesso total

---

## 💡 Dicas

1. **Sempre use a view** ao invés de fazer JOINs manuais
2. **Salve as queries úteis** como favoritas no Supabase
3. **Exporte para CSV** usando o botão no SQL Editor
4. **Use filtros** para análises específicas (por data, status, etc)

---

## 📞 Próximos Testes

Para testar se está funcionando:

1. Faça uma **nova assinatura** no site
2. Preencha o **CPF no checkout**
3. Execute no Supabase:
```sql
SELECT name, email, cpf, phone, plan_amount
FROM subscribers_view
ORDER BY subscription_created_at DESC
LIMIT 1;
```

4. Você deve ver os dados de CPF e telefone preenchidos! ✅

---

## 🎉 Resumo

Agora você tem:
- ✅ CPF e telefone salvos automaticamente
- ✅ View SQL para consultas simplificadas
- ✅ 10 queries prontas para usar
- ✅ Documentação completa
- ✅ Sistema profissional de gestão de assinantes

**Tudo pronto para produção!** 🚀
