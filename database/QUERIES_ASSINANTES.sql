-- =====================================================
-- QUERIES PRONTAS PARA CONSULTAR ASSINANTES
-- Execute no SQL Editor do Supabase
-- =====================================================

-- 📊 QUERY 1: Ver todos os assinantes com dados completos
-- Execute esta query após criar a view com CREATE_SUBSCRIBERS_VIEW.sql
SELECT * FROM subscribers_view;

-- ✅ QUERY 2: Ver apenas assinaturas ativas
SELECT
  name,
  email,
  cpf,
  phone,
  subscription_status,
  plan_amount,
  card_brand,
  card_last_digits,
  discount_percentage,
  coupon_code,
  next_billing_date,
  subscription_created_at
FROM subscribers_view
WHERE subscription_status = 'active'
ORDER BY subscription_created_at DESC;

-- 💰 QUERY 3: Calcular receita total de assinaturas ativas
SELECT
  COUNT(*) as total_assinaturas_ativas,
  SUM(plan_amount) as receita_mensal_recorrente,
  AVG(plan_amount) as ticket_medio
FROM subscribers_view
WHERE subscription_status = 'active';

-- 🎟️ QUERY 4: Ver assinaturas com cupom de desconto
SELECT
  name,
  email,
  coupon_code,
  discount_percentage,
  plan_amount,
  subscription_created_at
FROM subscribers_view
WHERE coupon_id IS NOT NULL
ORDER BY subscription_created_at DESC;

-- 📈 QUERY 5: Assinaturas criadas hoje
SELECT
  name,
  email,
  phone,
  cpf,
  plan_amount,
  subscription_status,
  subscription_created_at
FROM subscribers_view
WHERE DATE(subscription_created_at) = CURRENT_DATE
ORDER BY subscription_created_at DESC;

-- 🔍 QUERY 6: Buscar assinante por email
SELECT * FROM subscribers_view
WHERE email ILIKE '%nataliacsgoncalves21@gmail.com%';

-- 📊 QUERY 7: Estatísticas gerais de assinaturas
SELECT
  subscription_status,
  COUNT(*) as quantidade,
  SUM(plan_amount) as receita_total,
  AVG(plan_amount) as ticket_medio
FROM subscribers_view
GROUP BY subscription_status
ORDER BY quantidade DESC;

-- 💳 QUERY 8: Assinaturas por bandeira de cartão
SELECT
  card_brand,
  COUNT(*) as quantidade,
  SUM(plan_amount) as receita_total
FROM subscribers_view
WHERE subscription_status = 'active'
GROUP BY card_brand
ORDER BY quantidade DESC;

-- 🗓️ QUERY 9: Próximas cobranças (próximos 7 dias)
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

-- ❌ QUERY 10: Assinaturas com falha de pagamento
SELECT
  name,
  email,
  phone,
  plan_amount,
  subscription_status,
  subscription_created_at
FROM subscribers_view
WHERE subscription_status = 'payment_failed'
ORDER BY subscription_created_at DESC;

-- =====================================================
-- COMO USAR:
-- 1. Primeiro execute CREATE_SUBSCRIBERS_VIEW.sql no Supabase
-- 2. Depois você pode usar qualquer uma destas queries acima
-- 3. Cole a query no SQL Editor e clique em RUN
-- =====================================================
