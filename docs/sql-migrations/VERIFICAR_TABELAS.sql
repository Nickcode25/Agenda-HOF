-- =====================================================
-- VERIFICAR SE AS TABELAS FORAM CRIADAS
-- Execute este SQL no Supabase para confirmar
-- =====================================================

-- 1. Verificar todas as tabelas criadas
SELECT
  table_name,
  CASE
    WHEN table_name = 'discount_coupons' THEN '✅ Cupons de desconto'
    WHEN table_name = 'coupon_usage' THEN '✅ Histórico de uso de cupons'
    WHEN table_name = 'user_subscriptions' THEN '✅ Assinaturas dos usuários'
    WHEN table_name = 'subscription_payments' THEN '✅ Pagamentos recorrentes'
    WHEN table_name = 'pagbank_webhooks' THEN '✅ Log de webhooks do PagBank'
  END as descricao
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'discount_coupons',
  'coupon_usage',
  'user_subscriptions',
  'subscription_payments',
  'pagbank_webhooks'
)
ORDER BY
  CASE table_name
    WHEN 'discount_coupons' THEN 1
    WHEN 'coupon_usage' THEN 2
    WHEN 'user_subscriptions' THEN 3
    WHEN 'subscription_payments' THEN 4
    WHEN 'pagbank_webhooks' THEN 5
  END;

-- 2. Criar um cupom de teste
INSERT INTO discount_coupons (code, discount_percentage, is_active, max_uses)
VALUES ('BEMVINDO20', 20, true, 100)
ON CONFLICT (code) DO NOTHING;

INSERT INTO discount_coupons (code, discount_percentage, is_active)
VALUES ('PROMO10', 10, true)
ON CONFLICT (code) DO NOTHING;

-- 3. Ver cupons criados
SELECT
  code as "Código",
  discount_percentage as "Desconto %",
  CASE WHEN is_active THEN '✅ Ativo' ELSE '❌ Inativo' END as "Status",
  COALESCE(max_uses::text, 'Ilimitado') as "Usos Máximos",
  current_uses as "Usos Atuais",
  TO_CHAR(created_at, 'DD/MM/YYYY HH24:MI') as "Criado em"
FROM discount_coupons
ORDER BY created_at DESC;

-- 4. Verificar funções criadas
SELECT
  routine_name as "Função",
  CASE routine_name
    WHEN 'increment_coupon_usage' THEN '✅ Incrementa uso do cupom'
    WHEN 'is_subscription_active' THEN '✅ Verifica se assinatura está ativa'
    WHEN 'update_subscriptions_updated_at' THEN '✅ Atualiza data de modificação'
    WHEN 'update_discount_coupons_updated_at' THEN '✅ Atualiza data do cupom'
  END as "Descrição"
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
  'increment_coupon_usage',
  'is_subscription_active',
  'update_subscriptions_updated_at',
  'update_discount_coupons_updated_at'
)
ORDER BY routine_name;

-- 5. Testar função de incrementar cupom
DO $$
DECLARE
  cupom_id UUID;
BEGIN
  -- Pegar ID do cupom PROMO10
  SELECT id INTO cupom_id FROM discount_coupons WHERE code = 'PROMO10' LIMIT 1;

  IF cupom_id IS NOT NULL THEN
    -- Incrementar uso
    PERFORM increment_coupon_usage(cupom_id);
    RAISE NOTICE '✅ Função increment_coupon_usage funcionou!';
  END IF;
END $$;

-- 6. Verificar se incrementou
SELECT
  code,
  current_uses,
  CASE WHEN current_uses > 0 THEN '✅ Funcionou!' ELSE '⚠️ Não incrementou' END as status
FROM discount_coupons
WHERE code = 'PROMO10';

-- 7. Mostrar estrutura das tabelas
SELECT
  table_name as "Tabela",
  column_name as "Coluna",
  data_type as "Tipo",
  CASE WHEN is_nullable = 'YES' THEN 'Sim' ELSE 'Não' END as "Nulo?"
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name IN (
  'discount_coupons',
  'user_subscriptions',
  'subscription_payments'
)
ORDER BY
  CASE table_name
    WHEN 'discount_coupons' THEN 1
    WHEN 'user_subscriptions' THEN 2
    WHEN 'subscription_payments' THEN 3
  END,
  ordinal_position;
