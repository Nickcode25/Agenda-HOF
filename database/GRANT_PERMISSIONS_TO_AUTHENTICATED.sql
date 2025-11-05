-- =====================================================
-- CONCEDER PERMISSÕES PARA AUTHENTICATED ROLE
-- =====================================================
--
-- O problema NÃO é o RLS - é que o role 'authenticated'
-- não tem permissões básicas (GRANT) na tabela!
--
-- Mesmo com RLS desabilitado, sem GRANT não funciona.
--
-- =====================================================

-- 1. Conceder TODAS as permissões para authenticated
GRANT ALL ON subscription_plans TO authenticated;

-- 2. Conceder USAGE no schema public (se necessário)
GRANT USAGE ON SCHEMA public TO authenticated;

-- 3. Verificar permissões concedidas
SELECT
  '✅ PERMISSÕES CONCEDIDAS' as info,
  grantee,
  privilege_type,
  is_grantable
FROM information_schema.table_privileges
WHERE table_name = 'subscription_plans'
AND grantee = 'authenticated'
ORDER BY privilege_type;

-- Mensagem
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════════╗';
  RAISE NOTICE '║     ✅ PERMISSÕES CONCEDIDAS COM SUCESSO           ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE '✅ MUDANÇAS APLICADAS:';
  RAISE NOTICE '   - GRANT ALL concedido para authenticated';
  RAISE NOTICE '   - Role pode fazer SELECT, INSERT, UPDATE, DELETE';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 TESTE AGORA:';
  RAISE NOTICE '   1. Recarregue a página (Ctrl+R)';
  RAISE NOTICE '   2. Tente criar/salvar um plano';
  RAISE NOTICE '   3. DEVE FUNCIONAR AGORA!';
  RAISE NOTICE '';
  RAISE NOTICE '💡 O QUE ESTAVA ERRADO:';
  RAISE NOTICE '   - RLS desabilitado não resolve nada';
  RAISE NOTICE '   - Faltava GRANT (permissões básicas) na tabela';
  RAISE NOTICE '   - Agora o role authenticated tem acesso';
  RAISE NOTICE '';
END $$;
