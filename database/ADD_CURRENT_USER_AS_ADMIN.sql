-- =====================================================
-- ADICIONAR USUÁRIO ESPECÍFICO COMO SUPER ADMIN
-- =====================================================

-- CONTEXTO:
-- Este script adiciona um usuário específico como super admin
-- Use este script se o DIAGNOSE_SUPER_ADMIN não funcionou

-- =====================================================
-- PASSO 1: VER TODOS OS USUÁRIOS REGISTRADOS
-- =====================================================

SELECT
  'USUÁRIOS REGISTRADOS NO AUTH' as info,
  id,
  email,
  created_at,
  last_sign_in_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- =====================================================
-- PASSO 2: VER SUPER ADMINS ATUAIS
-- =====================================================

SELECT
  'SUPER ADMINS ATUAIS' as info,
  sa.id,
  sa.email,
  sa.is_active,
  au.email as email_no_auth,
  au.last_sign_in_at
FROM super_admins sa
LEFT JOIN auth.users au ON sa.id = au.id
ORDER BY sa.created_at DESC;

-- =====================================================
-- PASSO 3: ADICIONAR USUÁRIO ATUAL COMO SUPER ADMIN
-- =====================================================

-- IMPORTANTE: Substitua 'SEU_EMAIL_AQUI' pelo email que você usa para fazer login
-- Exemplo: 'nicolas@example.com'

DO $$
DECLARE
  target_email text := 'agendahof.site@gmail.com'; -- ⬅️ EDITE AQUI SE NECESSÁRIO
  target_user_id uuid;
  user_exists_in_super_admins boolean;
BEGIN
  -- Buscar o ID do usuário pelo email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = target_email;

  -- Verificar se encontrou o usuário
  IF target_user_id IS NULL THEN
    RAISE NOTICE '❌ ERRO: Usuário com email "%" não encontrado!', target_email;
    RAISE NOTICE '';
    RAISE NOTICE '🔍 Verifique:';
    RAISE NOTICE '   1. O email está correto?';
    RAISE NOTICE '   2. O usuário já fez login no sistema?';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Usuários disponíveis:';
    -- Mostrar usuários disponíveis
    FOR target_email IN
      SELECT email FROM auth.users ORDER BY created_at DESC LIMIT 5
    LOOP
      RAISE NOTICE '   - %', target_email;
    END LOOP;
    RETURN;
  END IF;

  -- Verificar se já existe na tabela super_admins
  SELECT EXISTS (
    SELECT 1 FROM super_admins WHERE id = target_user_id
  ) INTO user_exists_in_super_admins;

  IF user_exists_in_super_admins THEN
    -- Atualizar para garantir que está ativo
    UPDATE super_admins
    SET
      is_active = true,
      email = target_email
    WHERE id = target_user_id;

    RAISE NOTICE '✅ Super admin atualizado!';
    RAISE NOTICE '   Email: %', target_email;
    RAISE NOTICE '   ID: %', target_user_id;
    RAISE NOTICE '   Status: ATIVO';
  ELSE
    -- Inserir novo super admin
    INSERT INTO super_admins (id, email, is_active)
    VALUES (target_user_id, target_email, true);

    RAISE NOTICE '✅ Novo super admin criado!';
    RAISE NOTICE '   Email: %', target_email;
    RAISE NOTICE '   ID: %', target_user_id;
    RAISE NOTICE '   Status: ATIVO';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '🎯 PRÓXIMOS PASSOS:';
  RAISE NOTICE '   1. Recarregue a página do Admin Panel (Ctrl+R)';
  RAISE NOTICE '   2. Verifique se consegue criar/editar planos';
  RAISE NOTICE '   3. Se ainda não funcionar, verifique se está logado com o email correto';
END $$;

-- =====================================================
-- PASSO 4: VERIFICAR SE DEU CERTO
-- =====================================================

SELECT
  'VERIFICAÇÃO FINAL' as info,
  sa.id,
  sa.email,
  sa.is_active,
  au.last_sign_in_at as ultimo_login
FROM super_admins sa
JOIN auth.users au ON sa.id = au.id
WHERE sa.is_active = true;

-- Mensagem final
DO $$
DECLARE
  admin_count integer;
BEGIN
  SELECT COUNT(*) INTO admin_count FROM super_admins WHERE is_active = true;

  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════════╗';
  RAISE NOTICE '║              CONFIGURAÇÃO CONCLUÍDA                ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Total de super admins ativos: %', admin_count;
  RAISE NOTICE '';
  RAISE NOTICE '✅ IMPORTANTE:';
  RAISE NOTICE '   - Certifique-se de estar logado no sistema';
  RAISE NOTICE '   - Use o mesmo email que foi configurado como super admin';
  RAISE NOTICE '   - Recarregue a página após fazer login';
  RAISE NOTICE '';
END $$;
