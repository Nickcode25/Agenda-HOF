-- =====================================================
-- RESTAURAR POLICIES DE SEGURANÇA CORRETAS
-- =====================================================
--
-- Este script restaura as policies de segurança corretas
-- caso você tenha aplicado o NUCLEAR_FIX.sql temporariamente
--
-- Execute este script DEPOIS de confirmar que o login
-- e criação de planos estão funcionando corretamente
--
-- =====================================================

-- 1. Remover policies temporárias
DROP POLICY IF EXISTS "TEMP - Permitir tudo" ON subscription_plans;

-- 2. Remover policies antigas se existirem
DROP POLICY IF EXISTS "Super admin pode visualizar todos os planos" ON subscription_plans;
DROP POLICY IF EXISTS "Super admin pode inserir planos" ON subscription_plans;
DROP POLICY IF EXISTS "Super admin pode atualizar planos" ON subscription_plans;
DROP POLICY IF EXISTS "Super admin pode deletar planos" ON subscription_plans;
DROP POLICY IF EXISTS "Usuários podem visualizar planos ativos" ON subscription_plans;

-- 3. Criar policies de segurança corretas

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

-- 4. Garantir que RLS está habilitado
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- 5. Verificar configuração final
SELECT
  '📊 POLICIES RESTAURADAS' as info,
  policyname,
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

  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════════╗';
  RAISE NOTICE '║       ✅ POLICIES DE SEGURANÇA RESTAURADAS         ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE '📊 CONFIGURAÇÃO:';
  RAISE NOTICE '   - Total de policies: %', policies_count;
  RAISE NOTICE '   - RLS habilitado: Sim';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 SEGURANÇA:';
  RAISE NOTICE '   ✅ Super admins: Acesso completo via is_super_admin()';
  RAISE NOTICE '   ✅ Usuários: Apenas visualizam planos ativos';
  RAISE NOTICE '   ✅ Proteção: RLS habilitado';
  RAISE NOTICE '';
  RAISE NOTICE '✨ Sistema está seguro e funcional!';
  RAISE NOTICE '';
END $$;
