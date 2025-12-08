-- =====================================================
-- FIX: Função get_all_users não retorna dados
-- Execute este SQL no Supabase SQL Editor
-- =====================================================

-- 1. Primeiro, verificar se você é super admin
SELECT
  sa.id,
  sa.email,
  sa.is_active,
  (auth.uid() = sa.id) as is_current_user
FROM super_admins sa;

-- 2. Verificar se a função is_super_admin funciona
SELECT is_super_admin() as "Sou Super Admin?";

-- 3. Recriar a função get_all_users com SET search_path
DROP FUNCTION IF EXISTS get_all_users();

CREATE OR REPLACE FUNCTION get_all_users()
RETURNS TABLE (
  user_id UUID,
  owner_email TEXT,
  owner_name TEXT,
  owner_phone TEXT,
  user_created_at TIMESTAMPTZ,
  last_login TIMESTAMPTZ,
  has_active_subscription BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar se o usuário atual é super admin
  IF NOT is_super_admin() THEN
    RAISE EXCEPTION 'Acesso negado. Apenas super admins podem visualizar todos os usuários.';
  END IF;

  RETURN QUERY
  SELECT
    u.id as user_id,
    u.email::TEXT as owner_email,
    COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', 'Nome não informado')::TEXT as owner_name,
    COALESCE(u.raw_user_meta_data->>'phone', '')::TEXT as owner_phone,
    u.created_at as user_created_at,
    u.last_sign_in_at as last_login,
    EXISTS(
      SELECT 1 FROM public.user_subscriptions us
      WHERE us.user_id = u.id AND us.status = 'active'
    ) as has_active_subscription
  FROM auth.users u
  ORDER BY u.created_at DESC;
END;
$$;

-- 4. Conceder permissão
GRANT EXECUTE ON FUNCTION get_all_users() TO authenticated;

-- 5. Testar a função
SELECT * FROM get_all_users() LIMIT 10;

-- 6. Se ainda não funcionar, verificar se o super admin está correto
-- Adicione seu email se necessário:
-- INSERT INTO super_admins (id, email, is_active)
-- SELECT id, email, true
-- FROM auth.users
-- WHERE email = 'SEU_EMAIL_AQUI'
-- ON CONFLICT (id) DO UPDATE SET is_active = true;
