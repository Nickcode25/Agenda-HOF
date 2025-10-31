-- Conceder permissões básicas na tabela user_subscriptions
-- Isso é necessário ANTES das políticas RLS funcionarem

-- 1. Conceder permissões para usuários autenticados
GRANT SELECT, INSERT, UPDATE ON user_subscriptions TO authenticated;

-- 2. Conceder permissões para o role anon (se necessário)
GRANT SELECT ON user_subscriptions TO anon;

-- 3. Reativar RLS
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- 4. Recriar políticas RLS (garantindo que estão corretas)
DROP POLICY IF EXISTS "Usuários podem ver suas próprias assinaturas" ON user_subscriptions;
CREATE POLICY "Usuários podem ver suas próprias assinaturas"
ON user_subscriptions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem criar suas próprias assinaturas" ON user_subscriptions;
CREATE POLICY "Usuários podem criar suas próprias assinaturas"
ON user_subscriptions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem atualizar suas próprias assinaturas" ON user_subscriptions;
CREATE POLICY "Usuários podem atualizar suas próprias assinaturas"
ON user_subscriptions
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 5. Políticas para super admin
DROP POLICY IF EXISTS "Super admin pode ver todas as assinaturas" ON user_subscriptions;
CREATE POLICY "Super admin pode ver todas as assinaturas"
ON user_subscriptions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM super_admins
    WHERE super_admins.email = auth.jwt() ->> 'email'
  )
);

DROP POLICY IF EXISTS "Super admin pode atualizar todas as assinaturas" ON user_subscriptions;
CREATE POLICY "Super admin pode atualizar todas as assinaturas"
ON user_subscriptions
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM super_admins
    WHERE super_admins.email = auth.jwt() ->> 'email'
  )
);
