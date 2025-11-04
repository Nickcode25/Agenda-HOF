-- =====================================================
-- CORRIGIR ASSINATURA RECUSADA DA NATÁLIA
-- =====================================================

-- PROBLEMA:
-- Natália teve pagamento recusado mas:
-- 1. Assinatura ainda consta como "active"
-- 2. Dashboard conta como assinatura ativa
-- 3. Ela ainda tem acesso Premium no sistema

-- VER SITUAÇÃO ATUAL
SELECT
  'Assinaturas da Natália:' as info,
  id,
  status,
  plan_amount,
  discount_percentage,
  mercadopago_subscription_id,
  created_at,
  cancelled_at
FROM user_subscriptions
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'nataliacsgoncalves21@gmail.com'
)
ORDER BY created_at DESC;

-- =====================================================
-- CORREÇÃO 1: Cancelar assinaturas com payment_failed
-- =====================================================

UPDATE user_subscriptions
SET
  status = 'cancelled',
  cancelled_at = NOW()
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'nataliacsgoncalves21@gmail.com'
)
AND status IN ('payment_failed', 'active')
AND mercadopago_subscription_id IS NOT NULL;

-- =====================================================
-- CORREÇÃO 2: Verificar se há mais assinaturas problemáticas
-- =====================================================

-- Cancelar TODAS as assinaturas com status payment_failed
UPDATE user_subscriptions
SET
  status = 'cancelled',
  cancelled_at = NOW()
WHERE status = 'payment_failed'
  AND cancelled_at IS NULL;

-- =====================================================
-- VERIFICAR RESULTADO
-- =====================================================

-- Ver assinaturas da Natália após correção
SELECT
  'Após correção - Natália:' as info,
  id,
  status,
  plan_amount,
  discount_percentage,
  created_at,
  cancelled_at
FROM user_subscriptions
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'nataliacsgoncalves21@gmail.com'
)
ORDER BY created_at DESC;

-- Ver todas as assinaturas ativas (não deve incluir Natália)
SELECT
  'Assinaturas ATIVAS após correção:' as info,
  u.email,
  us.status,
  us.plan_amount,
  us.discount_percentage,
  (us.plan_amount * (1 - us.discount_percentage / 100.0)) as valor_real
FROM user_subscriptions us
LEFT JOIN auth.users u ON us.user_id = u.id
WHERE us.status = 'active'
ORDER BY us.created_at DESC;

-- Estatísticas finais
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
  RAISE NOTICE '';
  RAISE NOTICE '📊 ESTATÍSTICAS FINAIS:';
  RAISE NOTICE '  - Assinaturas ativas: %', active_count;
  RAISE NOTICE '  - Assinaturas canceladas: %', cancelled_count;
  RAISE NOTICE '  - Receita mensal recorrente: R$ %', ROUND(total_revenue, 2);
  RAISE NOTICE '';
  RAISE NOTICE '⚠️ PRÓXIMO PASSO:';
  RAISE NOTICE '  - Peça para Natália fazer LOGOUT e LOGIN novamente';
  RAISE NOTICE '  - O sistema vai detectar que não há assinatura ativa';
  RAISE NOTICE '  - Ela será redirecionada para a página de pricing';
END $$;
