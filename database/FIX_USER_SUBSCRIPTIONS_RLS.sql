-- Adicionar políticas RLS para user_subscriptions
-- Permitir que usuários criem e leiam suas próprias assinaturas

-- Habilitar RLS na tabela (se ainda não estiver habilitado)
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Política para usuários lerem suas próprias assinaturas
DROP POLICY IF EXISTS "Usuários podem ver suas próprias assinaturas" ON user_subscriptions;
CREATE POLICY "Usuários podem ver suas próprias assinaturas"
ON user_subscriptions
FOR SELECT
USING (auth.uid() = user_id);

-- Política para usuários criarem suas próprias assinaturas
DROP POLICY IF EXISTS "Usuários podem criar suas próprias assinaturas" ON user_subscriptions;
CREATE POLICY "Usuários podem criar suas próprias assinaturas"
ON user_subscriptions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Política para usuários atualizarem suas próprias assinaturas
DROP POLICY IF EXISTS "Usuários podem atualizar suas próprias assinaturas" ON user_subscriptions;
CREATE POLICY "Usuários podem atualizar suas próprias assinaturas"
ON user_subscriptions
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Política para super admin ver todas as assinaturas
DROP POLICY IF EXISTS "Super admin pode ver todas as assinaturas" ON user_subscriptions;
CREATE POLICY "Super admin pode ver todas as assinaturas"
ON user_subscriptions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM super_admins
    WHERE super_admins.email = auth.jwt() ->> 'email'
  )
);

-- Política para super admin atualizar todas as assinaturas
DROP POLICY IF EXISTS "Super admin pode atualizar todas as assinaturas" ON user_subscriptions;
CREATE POLICY "Super admin pode atualizar todas as assinaturas"
ON user_subscriptions
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM super_admins
    WHERE super_admins.email = auth.jwt() ->> 'email'
  )
);
