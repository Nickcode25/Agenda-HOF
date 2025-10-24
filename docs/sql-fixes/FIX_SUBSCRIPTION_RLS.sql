-- ==========================================
-- FIX: RLS PARA TABELA user_subscriptions
-- ==========================================

-- Permitir que usuários autenticados leiam suas próprias subscriptions
CREATE POLICY "allow_users_read_own_subscriptions"
ON user_subscriptions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Permitir que usuários autenticados vejam suas subscriptions (alternativa)
-- Caso a policy acima não funcione, use esta:
-- DROP POLICY IF EXISTS "allow_users_read_own_subscriptions" ON user_subscriptions;
-- CREATE POLICY "users_read_own_subscriptions"
-- ON user_subscriptions
-- FOR SELECT
-- USING (auth.uid() = user_id);

-- Verificar policies criadas
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'user_subscriptions';
