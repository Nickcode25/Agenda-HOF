-- =====================================================
-- FIX SUBSCRIPTION PLANS RLS PERMISSIONS
-- =====================================================

-- CONTEXTO:
-- As policies de subscription_plans estão falhando porque o authenticated
-- role não tem permissão para acessar a tabela super_admins diretamente.
-- Vamos criar uma função SECURITY DEFINER para verificar se é super admin.

-- =====================================================
-- CRIAR FUNÇÃO SECURITY DEFINER
-- =====================================================

-- Primeiro, garantir que a função is_super_admin existe
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM super_admins
    WHERE id = auth.uid()
    AND is_active = true
  );
END;
$$;

-- Comentário na função
COMMENT ON FUNCTION is_super_admin() IS 'Verifica se o usuário autenticado é um super admin ativo (SECURITY DEFINER)';

-- =====================================================
-- REMOVER POLICIES ANTIGAS
-- =====================================================

DROP POLICY IF EXISTS "Super admin pode visualizar todos os planos" ON subscription_plans;
DROP POLICY IF EXISTS "Super admin pode inserir planos" ON subscription_plans;
DROP POLICY IF EXISTS "Super admin pode atualizar planos" ON subscription_plans;
DROP POLICY IF EXISTS "Super admin pode deletar planos" ON subscription_plans;
DROP POLICY IF EXISTS "Usuários podem visualizar planos ativos" ON subscription_plans;

-- =====================================================
-- CRIAR NOVAS POLICIES USANDO A FUNÇÃO
-- =====================================================

-- Super admin pode visualizar todos os planos
CREATE POLICY "Super admin pode visualizar todos os planos"
  ON subscription_plans
  FOR SELECT
  TO authenticated
  USING (is_super_admin());

-- Super admin pode inserir planos
CREATE POLICY "Super admin pode inserir planos"
  ON subscription_plans
  FOR INSERT
  TO authenticated
  WITH CHECK (is_super_admin());

-- Super admin pode atualizar planos
CREATE POLICY "Super admin pode atualizar planos"
  ON subscription_plans
  FOR UPDATE
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- Super admin pode deletar planos
CREATE POLICY "Super admin pode deletar planos"
  ON subscription_plans
  FOR DELETE
  TO authenticated
  USING (is_super_admin());

-- Usuários autenticados podem visualizar planos ativos
CREATE POLICY "Usuários podem visualizar planos ativos"
  ON subscription_plans
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- =====================================================
-- GARANTIR QUE RLS ESTÁ HABILITADO
-- =====================================================

ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- VERIFICAR RESULTADO
-- =====================================================

-- Ver policies criadas
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'subscription_plans'
ORDER BY policyname;

-- Mensagem final
DO $$
DECLARE
  policies_count integer;
BEGIN
  SELECT COUNT(*) INTO policies_count
  FROM pg_policies
  WHERE tablename = 'subscription_plans';

  RAISE NOTICE '✅ RLS policies para subscription_plans corrigidas!';
  RAISE NOTICE '';
  RAISE NOTICE '📊 RESULTADO:';
  RAISE NOTICE '  - Função is_super_admin(): SECURITY DEFINER criada';
  RAISE NOTICE '  - Total de policies: %', policies_count;
  RAISE NOTICE '  - RLS habilitado: Sim';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 SEGURANÇA:';
  RAISE NOTICE '  - Super admins: Acesso completo (via função segura)';
  RAISE NOTICE '  - Usuários: Apenas visualizam planos ativos';
  RAISE NOTICE '  - Sem acesso direto à tabela super_admins';
  RAISE NOTICE '';
  RAISE NOTICE '✨ PRONTO PARA USAR:';
  RAISE NOTICE '  - Tente salvar um plano novamente no Admin Panel';
END $$;
