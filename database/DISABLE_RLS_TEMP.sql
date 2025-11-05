-- =====================================================
-- DESABILITAR RLS TEMPORARIAMENTE
-- =====================================================
--
-- IMPORTANTE: Esta é uma solução TEMPORÁRIA para desbloquear o trabalho
-- NÃO use em produção sem antes configurar as policies corretamente!
--
-- =====================================================

-- 1. Desabilitar RLS em subscription_plans
ALTER TABLE subscription_plans DISABLE ROW LEVEL SECURITY;

-- 2. Verificar
SELECT
  '✅ RLS DESABILITADO' as info,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'subscription_plans';

-- Mensagem
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════════╗';
  RAISE NOTICE '║     ⚠️  RLS DESABILITADO TEMPORARIAMENTE  ⚠️       ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE '✅ MUDANÇAS APLICADAS:';
  RAISE NOTICE '   - RLS desabilitado em subscription_plans';
  RAISE NOTICE '   - Todos os usuários autenticados têm acesso total';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 PRÓXIMOS PASSOS:';
  RAISE NOTICE '   1. Recarregue a página (Ctrl+R)';
  RAISE NOTICE '   2. Tente criar/salvar um plano';
  RAISE NOTICE '   3. DEVE FUNCIONAR agora!';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️ IMPORTANTE:';
  RAISE NOTICE '   Esta é uma solução TEMPORÁRIA';
  RAISE NOTICE '   Antes de ir para produção, habilite RLS novamente';
  RAISE NOTICE '   e configure as policies corretamente';
  RAISE NOTICE '';
END $$;
