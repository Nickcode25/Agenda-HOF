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

-- Conceder permissão de execução para usuários autenticados
GRANT EXECUTE ON FUNCTION admin_grant_courtesy(UUID, UUID, NUMERIC, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_revoke_courtesy(UUID) TO authenticated;
