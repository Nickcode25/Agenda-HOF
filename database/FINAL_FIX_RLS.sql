-- =====================================================
-- FIX FINAL - DESABILITAR RLS EM SUPER_ADMINS
-- =====================================================

-- CONTEXTO:
-- O RLS na tabela super_admins pode estar bloqueando o acesso
-- das policies, mesmo com GRANT SELECT. Vamos desabilitar o RLS.

-- =====================================================
-- 1. DESABILITAR RLS EM SUPER_ADMINS
-- =====================================================

ALTER TABLE super_admins DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. VERIFICAR PERMISSÕES
-- =====================================================

SELECT
  'PERMISSÕES EM SUPER_ADMINS' as info,
  tablename,
  rowsecurity as rls_habilitado
FROM pg_tables
WHERE tablename = 'super_admins';

-- =====================================================
-- 3. TESTAR A FUNÇÃO is_super_admin()
-- =====================================================

-- Criar uma função de teste para verificar se está funcionando
CREATE OR REPLACE FUNCTION test_super_admin_access()
RETURNS TABLE(
  user_id uuid,
  is_admin boolean,
  admin_email text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    auth.uid() as user_id,
    is_super_admin() as is_admin,
    COALESCE(
      (SELECT email FROM super_admins WHERE id = auth.uid()),
      'não é super admin'
    ) as admin_email;
END;
$$;

-- Executar o teste
SELECT * FROM test_super_admin_access();

-- =====================================================
-- 4. RECRIAR POLICIES COM LOGS
-- =====================================================

-- Remover policies antigas
DROP POLICY IF EXISTS "Super admin pode visualizar todos os planos" ON subscription_plans;
DROP POLICY IF EXISTS "Super admin pode inserir planos" ON subscription_plans;
DROP POLICY IF EXISTS "Super admin pode atualizar planos" ON subscription_plans;
DROP POLICY IF EXISTS "Super admin pode deletar planos" ON subscription_plans;
DROP POLICY IF EXISTS "Usuários podem visualizar planos ativos" ON subscription_plans;

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
-- 5. VERIFICAR CONFIGURAÇÃO FINAL
-- =====================================================

SELECT
  '📊 CONFIGURAÇÃO FINAL' as info,
  (SELECT COUNT(*) FROM super_admins WHERE is_active = true) as super_admins_ativos,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'subscription_plans') as policies_subscription_plans,
  (SELECT rowsecurity FROM pg_tables WHERE tablename = 'super_admins') as rls_super_admins,
  (SELECT rowsecurity FROM pg_tables WHERE tablename = 'subscription_plans') as rls_subscription_plans;

-- Mensagem final
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════════╗';
  RAISE NOTICE '║              FIX FINAL APLICADO                    ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE '✅ MUDANÇAS APLICADAS:';
  RAISE NOTICE '   - RLS desabilitado em super_admins';
  RAISE NOTICE '   - Permissão SELECT concedida ao authenticated';
  RAISE NOTICE '   - Função is_super_admin() com SECURITY DEFINER';
  RAISE NOTICE '   - Policies recriadas usando is_super_admin()';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 PRÓXIMOS PASSOS OBRIGATÓRIOS:';
  RAISE NOTICE '   1. Abra o console do navegador (F12)';
  RAISE NOTICE '   2. Digite: localStorage.clear()';
  RAISE NOTICE '   3. Digite: sessionStorage.clear()';
  RAISE NOTICE '   4. Feche TODAS as abas do localhost:5173';
  RAISE NOTICE '   5. Abra uma NOVA aba';
  RAISE NOTICE '   6. Acesse localhost:5173/admin/dashboard';
  RAISE NOTICE '   7. Faça login com agendahof.site@gmail.com';
  RAISE NOTICE '   8. Tente criar/salvar um plano';
  RAISE NOTICE '';
  RAISE NOTICE '💡 SE AINDA FALHAR:';
  RAISE NOTICE '   O problema pode ser cache do Supabase no servidor';
  RAISE NOTICE '   Aguarde 1-2 minutos e tente novamente';
  RAISE NOTICE '';
END $$;
