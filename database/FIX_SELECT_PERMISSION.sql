-- Verificar e corrigir permissão de SELECT em user_subscriptions

-- 1. Verificar políticas existentes
SELECT
    policyname,
    cmd,
    roles,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'user_subscriptions';

-- 2. Garantir que authenticated tem permissão de SELECT
GRANT SELECT ON user_subscriptions TO authenticated;

-- 3. Recriar política de SELECT de forma mais simples
DROP POLICY IF EXISTS "Usuários podem ver suas próprias assinaturas" ON user_subscriptions;
CREATE POLICY "Usuários podem ver suas próprias assinaturas"
ON user_subscriptions
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- 4. Verificar novamente
SELECT
    policyname,
    cmd,
    roles,
    qual
FROM pg_policies
WHERE tablename = 'user_subscriptions'
ORDER BY cmd, policyname;
