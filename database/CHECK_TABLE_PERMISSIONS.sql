-- Verificar permissões da tabela subscription_plans
SELECT
  '📋 PERMISSÕES DA TABELA' as info,
  grantee,
  privilege_type,
  is_grantable
FROM information_schema.table_privileges
WHERE table_name = 'subscription_plans'
AND table_schema = 'public'
ORDER BY grantee, privilege_type;

-- Verificar se RLS está habilitado
SELECT
  '🔒 STATUS DO RLS' as info,
  tablename,
  rowsecurity as rls_enabled,
  relrowsecurity as row_security_forced
FROM pg_tables
LEFT JOIN pg_class ON pg_tables.tablename = pg_class.relname
WHERE tablename = 'subscription_plans';

-- Verificar policies ativas
SELECT
  '📜 POLICIES ATIVAS' as info,
  policyname,
  cmd,
  permissive,
  roles
FROM pg_policies
WHERE tablename = 'subscription_plans';
