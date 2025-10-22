-- ================================================
-- RLS PARA TABELA courtesy_users
-- ================================================

-- Permitir que usuários autenticados leiam seu próprio registro de cortesia
CREATE POLICY IF NOT EXISTS "allow_users_read_own_courtesy"
ON courtesy_users
FOR SELECT
TO authenticated
USING (auth.uid() = auth_user_id);

-- Verificar policies criadas
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'courtesy_users';
