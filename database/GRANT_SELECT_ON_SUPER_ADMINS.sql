-- =====================================================
-- GRANT SELECT ON SUPER_ADMINS TO AUTHENTICATED
-- =====================================================

-- CONTEXTO:
-- Como último recurso, vamos dar permissão de SELECT na tabela super_admins
-- para o role authenticated, permitindo que as policies funcionem

-- =====================================================
-- GRANT PERMISSÕES
-- =====================================================

-- Dar permissão de SELECT para authenticated role
GRANT SELECT ON super_admins TO authenticated;

-- Verificar se funcionou
SELECT
  'PERMISSÕES CONCEDIDAS' as info,
  grantee,
  privilege_type,
  table_name
FROM information_schema.role_table_grants
WHERE table_name = 'super_admins'
AND grantee = 'authenticated';

-- Mensagem final
DO $$
BEGIN
  RAISE NOTICE '✅ Permissão SELECT concedida para authenticated role';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 SEGURANÇA:';
  RAISE NOTICE '   - Role authenticated pode ver super_admins';
  RAISE NOTICE '   - Mas RLS ainda protege os dados';
  RAISE NOTICE '   - Apenas queries dentro das policies podem ver os dados';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 PRÓXIMOS PASSOS:';
  RAISE NOTICE '   1. Faça LOGOUT no Admin Panel';
  RAISE NOTICE '   2. Faça LOGIN novamente com agendahof.site@gmail.com';
  RAISE NOTICE '   3. Tente criar/salvar um plano';
  RAISE NOTICE '';
  RAISE NOTICE '💡 SE AINDA NÃO FUNCIONAR:';
  RAISE NOTICE '   - Abra o console do navegador (F12)';
  RAISE NOTICE '   - Digite: localStorage.clear()';
  RAISE NOTICE '   - Recarregue a página';
  RAISE NOTICE '   - Faça login novamente';
END $$;
