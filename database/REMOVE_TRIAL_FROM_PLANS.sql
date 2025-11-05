-- =====================================================
-- REMOVER TRIAL DOS PLANOS EXISTENTES
-- =====================================================
--
-- Como os usuários já ganham 7 dias de trial ao se cadastrar,
-- não faz sentido os planos terem trial também.
--
-- =====================================================

-- Desabilitar trial em todos os planos
UPDATE subscription_plans
SET 
  has_trial = false,
  trial_days = 0
WHERE has_trial = true;

-- Verificar resultado
SELECT 
  name,
  price,
  has_trial,
  trial_days,
  is_active
FROM subscription_plans
ORDER BY price ASC;

-- Mensagem
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ Trial removido dos planos!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 IMPORTANTE:';
  RAISE NOTICE '   - Usuários ganham 7 dias de trial ao se cadastrar';
  RAISE NOTICE '   - Planos não oferecem trial adicional';
  RAISE NOTICE '   - Após trial, usuário deve escolher e pagar um plano';
  RAISE NOTICE '';
END $$;
