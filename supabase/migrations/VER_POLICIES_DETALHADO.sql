-- =====================================================
-- VER DETALHES COMPLETOS DAS POLICIES
-- =====================================================

-- Ver as definições completas das políticas
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as command,
  pg_get_expr(qual, (schemaname || '.' || tablename)::regclass) as using_expression,
  pg_get_expr(with_check, (schemaname || '.' || tablename)::regclass) as with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('user_monthly_plans', 'patient_subscriptions', 'subscription_payments')
ORDER BY tablename, policyname;
