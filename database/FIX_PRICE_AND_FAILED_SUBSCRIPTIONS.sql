-- =====================================================
-- CORRIGIR PREÇOS E ASSINATURAS RECUSADAS
-- =====================================================

-- PROBLEMA 1: Preço antigo (R$ 109,90) vs novo (R$ 99,90)
-- PROBLEMA 2: Assinaturas com payment_failed devem ser cancelled
-- PROBLEMA 3: Valores muito baixos (R$ 2,00) são recusados pelo MP

-- ========================================
-- PARTE 1: VER SITUAÇÃO ATUAL
-- ========================================

SELECT
  'Situação atual das assinaturas:' as info,
  status,
  plan_amount,
  discount_percentage,
  (plan_amount * (1 - discount_percentage / 100.0)) as valor_real,
  COUNT(*) as quantidade
FROM user_subscriptions
GROUP BY status, plan_amount, discount_percentage
ORDER BY status, plan_amount;

-- ========================================
-- PARTE 2: ATUALIZAR PREÇO ANTIGO
-- ========================================

-- Atualizar planos de R$ 109,90 para R$ 99,90 (novo preço)
UPDATE user_subscriptions
SET plan_amount = 99.90
WHERE plan_amount = 109.90;

-- ========================================
-- PARTE 3: CANCELAR ASSINATURAS RECUSADAS
-- ========================================

-- Assinaturas com payment_failed devem ser cancelled
UPDATE user_subscriptions
SET
  status = 'cancelled',
  cancelled_at = NOW()
WHERE status = 'payment_failed'
  AND cancelled_at IS NULL;

-- ========================================
-- PARTE 4: VERIFICAR RESULTADO
-- ========================================

SELECT
  'Após correções:' as info,
  status,
  plan_amount,
  discount_percentage,
  (plan_amount * (1 - discount_percentage / 100.0)) as valor_real,
  COUNT(*) as quantidade,
  SUM(plan_amount * (1 - discount_percentage / 100.0)) as receita_total
FROM user_subscriptions
WHERE status = 'active'
GROUP BY status, plan_amount, discount_percentage
ORDER BY plan_amount;

-- ========================================
-- PARTE 5: ESTATÍSTICAS FINAIS
-- ========================================

DO $$
DECLARE
  active_count integer;
  cancelled_count integer;
  total_revenue numeric;
BEGIN
  SELECT COUNT(*) INTO active_count FROM user_subscriptions WHERE status = 'active';
  SELECT COUNT(*) INTO cancelled_count FROM user_subscriptions WHERE status = 'cancelled';
  SELECT SUM(plan_amount * (1 - discount_percentage / 100.0)) INTO total_revenue
  FROM user_subscriptions WHERE status = 'active';

  RAISE NOTICE '✅ Correções aplicadas!';
  RAISE NOTICE '📊 Assinaturas ativas: %', active_count;
  RAISE NOTICE '❌ Assinaturas canceladas: %', cancelled_count;
  RAISE NOTICE '💰 Receita mensal recorrente: R$ %', ROUND(total_revenue, 2);
  RAISE NOTICE '';
  RAISE NOTICE '⚠️ IMPORTANTE:';
  RAISE NOTICE '- Assinaturas com valor muito baixo (< R$ 10) podem ser recusadas';
  RAISE NOTICE '- Considere limitar descontos a no máximo 70%%;';
  RAISE NOTICE '- Ou use período de trial gratuito ao invés de cupom extremo';
END $$;

-- ========================================
-- RECOMENDAÇÃO: LIMITAR DESCONTOS
-- ========================================

-- Para evitar problemas futuros, considere:
-- 1. Limitar discount_percentage máximo a 70%
-- 2. Definir valor mínimo de assinatura em R$ 10,00
-- 3. Usar trial period para ofertas especiais

-- Exemplo de validação (implementar no código):
-- if (finalPrice < 10.00) {
--   throw new Error('Valor mínimo da assinatura: R$ 10,00')
-- }
