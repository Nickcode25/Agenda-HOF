-- =====================================================
-- DIAGNÓSTICO DE SUPER ADMIN
-- =====================================================

-- CONTEXTO:
-- Verificar se o usuário atual está registrado como super admin
-- e se as permissões estão corretas

-- =====================================================
-- 1. VERIFICAR USUÁRIO ATUAL
-- =====================================================

SELECT
  'USUÁRIO ATUAL' as info,
  auth.uid() as user_id,
  auth.email() as email;

-- =====================================================
-- 2. VERIFICAR SE ESTÁ NA TABELA SUPER_ADMINS
-- =====================================================

SELECT
  'SUPER ADMINS REGISTRADOS' as info,
  id,
  email,
  is_active,
  created_at
FROM super_admins;

-- =====================================================
-- 3. VERIFICAR SE O USUÁRIO ATUAL É SUPER ADMIN
-- =====================================================

SELECT
  'VERIFICAÇÃO DO USUÁRIO ATUAL' as info,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM super_admins
      WHERE id = auth.uid()
      AND is_active = true
    ) THEN '✅ É super admin ativo'
    ELSE '❌ NÃO é super admin ou está inativo'
  END as status;

-- =====================================================
-- 4. TESTAR A FUNÇÃO is_super_admin()
-- =====================================================

SELECT
  'TESTE DA FUNÇÃO is_super_admin()' as info,
  is_super_admin() as resultado;

-- =====================================================
-- 5. VERIFICAR POLICIES DA TABELA subscription_plans
-- =====================================================

SELECT
  'POLICIES DA TABELA subscription_plans' as info,
  policyname,
  cmd as operacao,
  roles,
  qual as condicao_using,
  with_check as condicao_with_check
FROM pg_policies
WHERE tablename = 'subscription_plans'
ORDER BY cmd, policyname;

-- =====================================================
-- 6. VERIFICAR SE A FUNÇÃO is_super_admin EXISTE
-- =====================================================

SELECT
  'FUNÇÃO is_super_admin()' as info,
  p.proname as nome_funcao,
  pg_get_functiondef(p.oid) as definicao
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'is_super_admin'
AND n.nspname = 'public';

-- =====================================================
-- 7. ADICIONAR USUÁRIO ATUAL COMO SUPER ADMIN (SE NÃO EXISTIR)
-- =====================================================

DO $$
DECLARE
  current_user_id uuid;
  current_user_email text;
  user_exists boolean;
BEGIN
  -- Pegar ID e email do usuário atual
  current_user_id := auth.uid();
  current_user_email := auth.email();

  IF current_user_id IS NULL THEN
    RAISE NOTICE '⚠️ Nenhum usuário autenticado encontrado!';
    RAISE NOTICE 'Por favor, faça login no sistema antes de executar este script.';
    RETURN;
  END IF;

  -- Verificar se já existe
  SELECT EXISTS (
    SELECT 1 FROM super_admins WHERE id = current_user_id
  ) INTO user_exists;

  IF user_exists THEN
    -- Atualizar para garantir que está ativo
    UPDATE super_admins
    SET is_active = true
    WHERE id = current_user_id;

    RAISE NOTICE '✅ Super admin já existe e foi marcado como ativo';
    RAISE NOTICE '   Email: %', current_user_email;
  ELSE
    -- Inserir novo super admin
    INSERT INTO super_admins (id, email, is_active)
    VALUES (current_user_id, current_user_email, true);

    RAISE NOTICE '✅ Novo super admin criado!';
    RAISE NOTICE '   Email: %', current_user_email;
  END IF;
END $$;

-- =====================================================
-- 8. VERIFICAÇÃO FINAL
-- =====================================================

SELECT
  '📊 RESUMO FINAL' as info,
  (SELECT COUNT(*) FROM super_admins WHERE is_active = true) as total_super_admins_ativos,
  (SELECT is_super_admin()) as usuario_atual_e_super_admin,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'subscription_plans') as total_policies_subscription_plans;

-- Mensagem final
DO $$
DECLARE
  is_admin boolean;
  admin_count integer;
BEGIN
  SELECT is_super_admin() INTO is_admin;
  SELECT COUNT(*) INTO admin_count FROM super_admins WHERE is_active = true;

  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════════╗';
  RAISE NOTICE '║           DIAGNÓSTICO DE SUPER ADMIN               ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE '👤 Usuário atual:';
  RAISE NOTICE '   - Email: %', auth.email();
  RAISE NOTICE '   - ID: %', auth.uid();
  RAISE NOTICE '';
  RAISE NOTICE '🔐 Status de Super Admin:';
  RAISE NOTICE '   - É super admin? %', CASE WHEN is_admin THEN '✅ SIM' ELSE '❌ NÃO' END;
  RAISE NOTICE '   - Total de super admins ativos: %', admin_count;
  RAISE NOTICE '';

  IF is_admin THEN
    RAISE NOTICE '✨ TUDO CERTO! Você pode:';
    RAISE NOTICE '   - Criar planos de assinatura';
    RAISE NOTICE '   - Editar planos existentes';
    RAISE NOTICE '   - Gerenciar cupons';
    RAISE NOTICE '   - Visualizar todos os dados do admin panel';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 PRÓXIMO PASSO:';
    RAISE NOTICE '   - Recarregue a página do Admin Panel (Ctrl+R)';
    RAISE NOTICE '   - Tente criar/salvar um plano novamente';
  ELSE
    RAISE NOTICE '⚠️ ATENÇÃO: Você NÃO é super admin!';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 SOLUÇÃO:';
    RAISE NOTICE '   1. Certifique-se de estar logado no sistema';
    RAISE NOTICE '   2. Execute este script novamente estando logado';
    RAISE NOTICE '   3. Ou adicione manualmente seu usuário:';
    RAISE NOTICE '      INSERT INTO super_admins (id, email, is_active)';
    RAISE NOTICE '      VALUES (''SEU_USER_ID'', ''seu@email.com'', true);';
  END IF;

  RAISE NOTICE '';
END $$;
