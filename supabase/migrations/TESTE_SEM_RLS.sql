-- =====================================================
-- TESTE SEM RLS - Desabilitar temporariamente
-- =====================================================
-- ⚠️ ATENÇÃO: Isso remove a segurança temporariamente!
-- Use APENAS para testar se o problema é com RLS
-- =====================================================

-- Desabilitar RLS temporariamente
ALTER TABLE user_monthly_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE patient_subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_payments DISABLE ROW LEVEL SECURITY;

-- Verificar status
SELECT
  tablename,
  CASE
    WHEN rowsecurity THEN '🔒 RLS HABILITADO'
    ELSE '🔓 RLS DESABILITADO'
  END as status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('user_monthly_plans', 'patient_subscriptions', 'subscription_payments')
ORDER BY tablename;

-- Mensagem
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '⚠️ RLS DESABILITADO TEMPORARIAMENTE!';
  RAISE NOTICE '';
  RAISE NOTICE '🧪 TESTE AGORA:';
  RAISE NOTICE '  1. Recarregue o site';
  RAISE NOTICE '  2. Tente criar o plano';
  RAISE NOTICE '  3. Se funcionar, o problema é com as políticas RLS';
  RAISE NOTICE '  4. Se não funcionar, o problema é outra coisa';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️ LEMBRE-SE: Reabilitar o RLS depois do teste!';
  RAISE NOTICE '';
END $$;
