-- =====================================================
-- NUCLEAR FIX - REMOVER POLICIES TEMPORARIAMENTE
-- =====================================================

-- CONTEXTO:
-- Como ÚLTIMO recurso, vamos remover TODAS as policies de subscription_plans
-- para permitir acesso total enquanto investigamos o problema

-- ⚠️ ATENÇÃO: ISSO REMOVE A SEGURANÇA TEMPORARIAMENTE!
-- Execute apenas em ambiente de desenvolvimento!

-- =====================================================
-- 1. REMOVER TODAS AS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Super admin pode visualizar todos os planos" ON subscription_plans;
DROP POLICY IF EXISTS "Super admin pode inserir planos" ON subscription_plans;
DROP POLICY IF EXISTS "Super admin pode atualizar planos" ON subscription_plans;
DROP POLICY IF EXISTS "Super admin pode deletar planos" ON subscription_plans;
DROP POLICY IF EXISTS "Usuários podem visualizar planos ativos" ON subscription_plans;

-- =====================================================
-- 2. CRIAR UMA ÚNICA POLICY PERMISSIVA TEMPORÁRIA
-- =====================================================

-- Permitir TUDO para authenticated users (TEMPORÁRIO!)
CREATE POLICY "TEMP - Permitir tudo"
  ON subscription_plans
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 3. VERIFICAR
-- =====================================================

SELECT
  '⚠️ CONFIGURAÇÃO TEMPORÁRIA' as info,
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'subscription_plans';

-- Mensagem final
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════════╗';
  RAISE NOTICE '║         ⚠️ NUCLEAR FIX APLICADO ⚠️                 ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️ ATENÇÃO:';
  RAISE NOTICE '   - TODAS as policies de segurança foram REMOVIDAS';
  RAISE NOTICE '   - Qualquer usuário autenticado pode fazer QUALQUER COISA';
  RAISE NOTICE '   - Esta é uma configuração TEMPORÁRIA para testes';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 TESTE AGORA:';
  RAISE NOTICE '   1. Recarregue a página (Ctrl+R)';
  RAISE NOTICE '   2. Tente criar/salvar um plano';
  RAISE NOTICE '   3. Se FUNCIONAR: o problema é nas policies';
  RAISE NOTICE '   4. Se NÃO FUNCIONAR: o problema é no código/auth';
  RAISE NOTICE '';
  RAISE NOTICE '📝 IMPORTANTE:';
  RAISE NOTICE '   Depois de testar, avise para restaurarmos as policies!';
  RAISE NOTICE '';
END $$;
