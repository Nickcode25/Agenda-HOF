-- =====================================================
-- CORRIGIR VALORES DE PLAN_AMOUNT INCORRETOS
-- =====================================================

-- PROBLEMA:
-- Algumas assinaturas têm plan_amount com valor já descontado
-- Isso causa cálculo errado de receita

-- EXEMPLO DO ERRO:
-- plan_amount = 2.00 (já com desconto)
-- discount_percentage = 98
-- Cálculo: 2.00 * (1 - 0.98) = R$ 0,04 ❌
--
-- CORRETO:
-- plan_amount = 99.90 (valor cheio do plano)
-- discount_percentage = 98
-- Cálculo: 99.90 * (1 - 0.98) = R$ 1,998 ✅

-- Ver dados atuais
SELECT
  id,
  user_id,
  status,
  plan_amount as valor_atual,
  discount_percentage,
  (plan_amount * (1 - discount_percentage / 100.0)) as valor_calculado,
  created_at
FROM user_subscriptions
ORDER BY created_at DESC;

-- =====================================================
-- CORREÇÃO: Atualizar plan_amount para o valor correto
-- =====================================================

-- Corrigir assinaturas com plan_amount menor que 50
-- (assumindo que o plano real é R$ 99,90)
UPDATE user_subscriptions
SET plan_amount = 99.90
WHERE plan_amount < 50.00
  AND status IN ('active', 'payment_failed', 'cancelled');

-- Ver dados corrigidos
SELECT
  id,
  user_id,
  status,
  plan_amount as valor_corrigido,
  discount_percentage,
  (plan_amount * (1 - discount_percentage / 100.0)) as valor_real,
  created_at
FROM user_subscriptions
ORDER BY created_at DESC;

-- Verificar receita total
SELECT
  'Receita de assinaturas ATIVAS:' as info,
  COUNT(*) as quantidade,
  SUM(plan_amount * (1 - discount_percentage / 100.0)) as receita_total
FROM user_subscriptions
WHERE status = 'active';

-- Mensagem final
DO $$
DECLARE
  fixed_count integer;
BEGIN
  SELECT COUNT(*) INTO fixed_count
  FROM user_subscriptions
  WHERE plan_amount = 99.90;

  RAISE NOTICE '✅ Valores corrigidos!';
  RAISE NOTICE '📊 Total de assinaturas com plan_amount correto: %', fixed_count;
  RAISE NOTICE '💰 Recarregue o dashboard para ver a receita correta!';
END $$;
