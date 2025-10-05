-- ========================================
-- FUNÇÃO SQL: Criar Usuário Cortesia
-- ========================================

-- Esta função apenas registra o usuário cortesia na tabela
-- A criação do auth user será feita pelo código TypeScript

CREATE OR REPLACE FUNCTION create_courtesy_user(
  p_name TEXT,
  p_email TEXT,
  p_password TEXT,
  p_phone TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER -- Executa com privilégios do owner
SET search_path = public
AS $$
DECLARE
  v_courtesy_id UUID;
BEGIN
  -- Criar registro em courtesy_users (sem auth_user_id inicialmente)
  INSERT INTO courtesy_users (
    auth_user_id,
    name,
    email,
    phone,
    notes,
    created_by,
    expires_at,
    is_active
  ) VALUES (
    NULL, -- Será preenchido depois
    p_name,
    p_email,
    p_phone,
    p_notes,
    auth.uid(), -- ID do admin logado
    p_expires_at,
    true
  )
  RETURNING id INTO v_courtesy_id;

  -- Retornar sucesso com a senha para criar usuário no frontend
  RETURN json_build_object(
    'success', true,
    'courtesy_id', v_courtesy_id,
    'email', p_email,
    'password', p_password
  );

EXCEPTION
  WHEN OTHERS THEN
    -- Em caso de erro, retornar detalhes
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Dar permissão para usuários autenticados executarem a função
GRANT EXECUTE ON FUNCTION create_courtesy_user TO authenticated;

-- ========================================
-- FUNÇÃO: Deletar Usuário Cortesia
-- ========================================

CREATE OR REPLACE FUNCTION delete_courtesy_user(p_courtesy_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_auth_user_id UUID;
BEGIN
  -- 1. Buscar o auth_user_id
  SELECT auth_user_id INTO v_auth_user_id
  FROM courtesy_users
  WHERE id = p_courtesy_id;

  -- 2. Deletar da tabela courtesy_users
  DELETE FROM courtesy_users WHERE id = p_courtesy_id;

  -- 3. Deletar do auth.users (se existir)
  IF v_auth_user_id IS NOT NULL THEN
    DELETE FROM auth.users WHERE id = v_auth_user_id;
  END IF;

  RETURN json_build_object('success', true);

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

GRANT EXECUTE ON FUNCTION delete_courtesy_user TO authenticated;

-- ========================================
-- TESTE
-- ========================================

-- Teste a função de criação (substitua os valores):
-- SELECT create_courtesy_user(
--   'João Teste',
--   'joao.teste@exemplo.com',
--   'senha123',
--   '(11) 98888-8888',
--   'Usuário de teste',
--   NULL
-- );

-- Teste a função de deleção:
-- SELECT delete_courtesy_user('uuid-do-courtesy-user');
