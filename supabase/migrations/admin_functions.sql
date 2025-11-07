-- =====================================================
-- FUNÇÕES ADMINISTRATIVAS COMPLETAS - VERSÃO 3 CORRIGIDA
-- Execute este arquivo no Supabase SQL Editor
-- =====================================================

-- Função para obter todos os planos (para super admin)
CREATE OR REPLACE FUNCTION get_all_plans()
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  price NUMERIC,
  duration_months INTEGER,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se o usuário atual é super admin
  IF NOT is_super_admin() THEN
    RAISE EXCEPTION 'Acesso negado. Apenas super admins podem visualizar todos os planos.';
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.description,
    p.price,
    p.duration_months,
    p.created_at
  FROM subscription_plans p
  ORDER BY p.price ASC;
END;
$$;

-- Função para obter TODOS OS USUÁRIOS (para cortesia) - CORRIGIDA
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
    (u.raw_user_meta_data->>'full_name')::TEXT as owner_name,
    (u.raw_user_meta_data->>'phone')::TEXT as owner_phone,
    u.created_at as user_created_at,
    u.last_sign_in_at as last_login,
    EXISTS(
      SELECT 1 FROM user_subscriptions us
      WHERE us.user_id = u.id AND us.status = 'active'
    ) as has_active_subscription
  FROM auth.users u
  ORDER BY u.created_at DESC;
END;
$$;

-- Função para obter todas as assinaturas com detalhes (para super admin) - CORRIGIDA
CREATE OR REPLACE FUNCTION get_all_subscriptions()
RETURNS TABLE (
  subscription_id UUID,
  user_id UUID,
  plan_id UUID,
  status TEXT,
  trial_end_date TIMESTAMPTZ,
  subscription_created_at TIMESTAMPTZ,
  owner_email TEXT,
  owner_name TEXT,
  owner_phone TEXT,
  user_created_at TIMESTAMPTZ,
  plan_name TEXT,
  plan_price NUMERIC,
  last_login TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se o usuário atual é super admin
  IF NOT is_super_admin() THEN
    RAISE EXCEPTION 'Acesso negado. Apenas super admins podem visualizar todas as assinaturas.';
  END IF;

  RETURN QUERY
  SELECT
    us.id as subscription_id,
    us.user_id,
    NULL::UUID as plan_id,
    us.status::TEXT,
    (u.raw_user_meta_data->>'trial_end_date')::TIMESTAMPTZ as trial_end_date,
    us.created_at as subscription_created_at,
    u.email::TEXT as owner_email,
    (u.raw_user_meta_data->>'full_name')::TEXT as owner_name,
    (u.raw_user_meta_data->>'phone')::TEXT as owner_phone,
    u.created_at as user_created_at,
    'Plano Ativo'::TEXT as plan_name,
    us.plan_amount::NUMERIC as plan_price,
    u.last_sign_in_at as last_login
  FROM user_subscriptions us
  LEFT JOIN auth.users u ON us.user_id = u.id
  ORDER BY us.created_at DESC;
END;
$$;

-- Função para conceder cortesia (apenas super admin)
CREATE OR REPLACE FUNCTION admin_grant_courtesy(
  p_user_id UUID,
  p_plan_id UUID,
  p_plan_amount NUMERIC,
  p_trial_end_date TIMESTAMPTZ
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_existing_sub UUID;
BEGIN
  -- Verificar se o usuário atual é super admin
  IF NOT is_super_admin() THEN
    RETURN json_build_object('error', 'Acesso negado. Apenas super admins podem conceder cortesias.');
  END IF;

  -- Verificar se o usuário já tem uma assinatura ativa
  SELECT id INTO v_existing_sub
  FROM user_subscriptions
  WHERE user_id = p_user_id
    AND status = 'active'
  LIMIT 1;

  IF v_existing_sub IS NOT NULL THEN
    RETURN json_build_object('error', 'Este usuário já possui uma assinatura ativa');
  END IF;

  -- Atualizar o trial_end_date do usuário no metadata
  UPDATE auth.users
  SET raw_user_meta_data =
    COALESCE(raw_user_meta_data, '{}'::jsonb) ||
    jsonb_build_object('trial_end_date', p_trial_end_date::text)
  WHERE id = p_user_id;

  -- Criar a cortesia (assinatura ativa)
  INSERT INTO user_subscriptions (
    user_id,
    status,
    plan_amount,
    discount_percentage,
    created_at,
    updated_at
  ) VALUES (
    p_user_id,
    'active',
    p_plan_amount,
    100, -- 100% de desconto para cortesia
    NOW(),
    NOW()
  );

  RETURN json_build_object('success', true);
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('error', SQLERRM);
END;
$$;

-- Função para revogar cortesia (apenas super admin)
CREATE OR REPLACE FUNCTION admin_revoke_courtesy(
  p_subscription_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se o usuário atual é super admin
  IF NOT is_super_admin() THEN
    RAISE EXCEPTION 'Acesso negado. Apenas super admins podem revogar cortesias.';
  END IF;

  -- Atualizar o status da assinatura
  UPDATE user_subscriptions
  SET
    status = 'cancelled',
    updated_at = NOW()
  WHERE id = p_subscription_id;
END;
$$;

-- Conceder permissões de execução
GRANT EXECUTE ON FUNCTION get_all_plans() TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_users() TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_subscriptions() TO authenticated;
GRANT EXECUTE ON FUNCTION admin_grant_courtesy(UUID, UUID, NUMERIC, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_revoke_courtesy(UUID) TO authenticated;
