-- =====================================================
-- DEBUG AUTH - Verificar contexto de autenticação
-- =====================================================
-- Este SQL precisa ser executado enquanto você está
-- logado no site (com o JWT token ativo)
-- =====================================================

-- 1. Verificar se auth.uid() está funcionando
SELECT
  auth.uid() as current_user_id,
  auth.role() as current_role,
  current_setting('request.jwt.claims', true)::json->>'sub' as jwt_sub,
  current_setting('request.jwt.claims', true)::json->>'role' as jwt_role;

-- 2. Verificar as políticas existentes
SELECT
  tablename,
  policyname,
  cmd as operation,
  roles,
  permissive
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('user_monthly_plans', 'patient_subscriptions', 'subscription_payments')
ORDER BY tablename, cmd;

-- 3. Verificar se RLS está habilitado
SELECT
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('user_monthly_plans', 'patient_subscriptions', 'subscription_payments');

-- 4. Testar se consegue ler a tabela
SELECT
  COUNT(*) as total_plans,
  'Se você vê este resultado, as policies estão funcionando!' as status
FROM user_monthly_plans
WHERE user_id = auth.uid();
