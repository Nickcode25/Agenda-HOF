-- Verificar status do RLS e políticas existentes
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'discount_coupons';

-- Ver todas as políticas da tabela discount_coupons
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'discount_coupons';
