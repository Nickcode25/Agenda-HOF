-- =====================================================
-- GRANT PERMISSIONS - Dar permissões explícitas
-- =====================================================
-- O problema pode ser falta de GRANT nas tabelas
-- Além das policies RLS, precisamos dar GRANT explícito
-- =====================================================

BEGIN;

-- =====================================================
-- PASSO 1: Revogar todas as permissões antigas
-- =====================================================

REVOKE ALL ON TABLE user_monthly_plans FROM anon, authenticated, service_role;
REVOKE ALL ON TABLE patient_subscriptions FROM anon, authenticated, service_role;
REVOKE ALL ON TABLE subscription_payments FROM anon, authenticated, service_role;

-- =====================================================
-- PASSO 2: Dar permissões para authenticated users
-- =====================================================

-- user_monthly_plans
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE user_monthly_plans TO authenticated;

-- patient_subscriptions
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE patient_subscriptions TO authenticated;

-- subscription_payments
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE subscription_payments TO authenticated;

-- =====================================================
-- PASSO 3: Dar permissões para service_role (admin)
-- =====================================================

GRANT ALL ON TABLE user_monthly_plans TO service_role;
GRANT ALL ON TABLE patient_subscriptions TO service_role;
GRANT ALL ON TABLE subscription_payments TO service_role;

-- =====================================================
-- PASSO 4: Verificar permissões
-- =====================================================

SELECT
  grantee,
  table_name,
  privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name IN ('user_monthly_plans', 'patient_subscriptions', 'subscription_payments')
  AND grantee IN ('anon', 'authenticated', 'service_role')
ORDER BY table_name, grantee, privilege_type;

-- =====================================================
-- PASSO 5: Mensagem final
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ PERMISSÕES CONFIGURADAS!';
  RAISE NOTICE '';
  RAISE NOTICE 'As seguintes permissões foram dadas:';
  RAISE NOTICE '  - authenticated: SELECT, INSERT, UPDATE, DELETE';
  RAISE NOTICE '  - service_role: ALL';
  RAISE NOTICE '';
  RAISE NOTICE 'As policies RLS ainda estão ativas e vão';
  RAISE NOTICE 'garantir que cada user veja apenas seus dados.';
  RAISE NOTICE '';
  RAISE NOTICE '🔄 TESTE AGORA:';
  RAISE NOTICE '  1. Recarregue o site (Ctrl+R)';
  RAISE NOTICE '  2. Tente criar o plano';
  RAISE NOTICE '';
END $$;

COMMIT;
