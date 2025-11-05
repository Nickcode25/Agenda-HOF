-- Verificar policies atuais
SELECT
  '📋 POLICIES ATUAIS' as info,
  policyname,
  cmd,
  permissive,
  roles,
  qual as using_clause,
  with_check
FROM pg_policies
WHERE tablename = 'subscription_plans'
ORDER BY policyname;

-- Verificar se RLS está habilitado
SELECT
  '🔒 RLS STATUS' as info,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'subscription_plans';

-- Testar a função is_super_admin()
SELECT
  '🔍 TESTE is_super_admin()' as info,
  is_super_admin() as resultado;

-- Ver super admins
SELECT
  '👥 SUPER ADMINS' as info,
  email,
  is_active
FROM super_admins;
