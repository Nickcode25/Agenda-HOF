-- Atualiza a função get_all_users para incluir o telefone do user_metadata
-- Execute este SQL no Supabase SQL Editor

-- Primeiro, dropar a função existente (necessário porque mudou os parâmetros de retorno)
DROP FUNCTION IF EXISTS get_all_users();

CREATE OR REPLACE FUNCTION get_all_users()
RETURNS TABLE (
  user_id UUID,
  owner_email TEXT,
  owner_name TEXT,
  owner_phone TEXT,
  user_created_at TIMESTAMPTZ,
  last_login TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Apenas super admins podem executar esta função
  IF NOT is_super_admin() THEN
    RAISE EXCEPTION 'Acesso negado: apenas super admins podem listar usuários';
  END IF;

  RETURN QUERY
  SELECT
    u.id as user_id,
    u.email as owner_email,
    COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', 'Nome não disponível') as owner_name,
    COALESCE(u.raw_user_meta_data->>'phone', NULL) as owner_phone,
    u.created_at as user_created_at,
    u.last_sign_in_at as last_login
  FROM auth.users u
  ORDER BY u.created_at DESC;
END;
$$;

-- Garantir permissões
GRANT EXECUTE ON FUNCTION get_all_users() TO authenticated;
