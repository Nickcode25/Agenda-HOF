-- Limpar todas as políticas duplicadas e criar apenas uma de cada tipo

-- 1. REMOVER TODAS as políticas existentes
DROP POLICY IF EXISTS "Service role can manage subscriptions" ON user_subscriptions;
DROP POLICY IF EXISTS "Users can insert own subscriptions" ON user_subscriptions;
DROP POLICY IF EXISTS "Users can insert their own subscriptions" ON user_subscriptions;
DROP POLICY IF EXISTS "Usuários podem criar suas próprias assinaturas" ON user_subscriptions;
DROP POLICY IF EXISTS "Super admin pode ver todas as assinaturas" ON user_subscriptions;
DROP POLICY IF EXISTS "Users can view own subscriptions" ON user_subscriptions;
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON user_subscriptions;
DROP POLICY IF EXISTS "Usuários podem ver suas próprias assinaturas" ON user_subscriptions;
DROP POLICY IF EXISTS "allow_users_read_own_subscriptions" ON user_subscriptions;
DROP POLICY IF EXISTS "Super admin pode atualizar todas as assinaturas" ON user_subscriptions;
DROP POLICY IF EXISTS "Users can update their own subscriptions" ON user_subscriptions;
DROP POLICY IF EXISTS "Usuários podem atualizar suas próprias assinaturas" ON user_subscriptions;

-- 2. Garantir permissões GRANT
GRANT SELECT, INSERT, UPDATE ON user_subscriptions TO authenticated;
GRANT SELECT ON user_subscriptions TO anon;

-- 3. Habilitar RLS
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas LIMPAS (apenas uma de cada)
CREATE POLICY "users_select_own"
ON user_subscriptions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own"
ON user_subscriptions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_update_own"
ON user_subscriptions
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 5. Política para service_role (acesso total)
CREATE POLICY "service_role_all"
ON user_subscriptions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 6. Verificar resultado
SELECT
    policyname,
    cmd,
    roles
FROM pg_policies
WHERE tablename = 'user_subscriptions'
ORDER BY cmd, policyname;
