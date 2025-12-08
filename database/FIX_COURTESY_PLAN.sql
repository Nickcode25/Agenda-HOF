-- =====================================================
-- FIX: Vincular plano às cortesias corretamente
-- Execute este SQL no Supabase SQL Editor
-- =====================================================

-- 1. Adicionar coluna plan_id na tabela user_subscriptions (se não existir)
ALTER TABLE user_subscriptions
ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES subscription_plans(id);

-- 2. Recriar função admin_grant_courtesy para salvar o plan_id
DROP FUNCTION IF EXISTS admin_grant_courtesy(UUID, UUID, NUMERIC, TIMESTAMPTZ);

CREATE OR REPLACE FUNCTION admin_grant_courtesy(
  p_user_id UUID,
  p_plan_id UUID,
  p_plan_amount NUMERIC,
  p_trial_end_date TIMESTAMPTZ
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

  -- Criar a cortesia (assinatura ativa) COM O PLAN_ID
  INSERT INTO user_subscriptions (
    user_id,
    plan_id,
    status,
    plan_amount,
    discount_percentage,
    created_at,
    updated_at
  ) VALUES (
    p_user_id,
    p_plan_id,
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

GRANT EXECUTE ON FUNCTION admin_grant_courtesy(UUID, UUID, NUMERIC, TIMESTAMPTZ) TO authenticated;

-- 3. Atualizar get_all_subscriptions para retornar plan_id e discount_percentage
DROP FUNCTION IF EXISTS get_all_subscriptions();

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
  plan_amount NUMERIC,
  discount_percentage INTEGER,
  last_login TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
    us.plan_id,
    us.status::TEXT,
    us.started_at as trial_end_date,
    us.created_at as subscription_created_at,
    u.email::TEXT as owner_email,
    COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', 'Nome não informado')::TEXT as owner_name,
    COALESCE(u.raw_user_meta_data->>'phone', '')::TEXT as owner_phone,
    u.created_at as user_created_at,
    COALESCE(sp.name, 'Plano Ativo')::TEXT as plan_name,
    COALESCE(sp.price, us.plan_amount)::NUMERIC as plan_price,
    us.plan_amount::NUMERIC as plan_amount,
    COALESCE(us.discount_percentage, 0) as discount_percentage,
    u.last_sign_in_at as last_login
  FROM user_subscriptions us
  LEFT JOIN auth.users u ON us.user_id = u.id
  LEFT JOIN subscription_plans sp ON us.plan_id = sp.id
  ORDER BY us.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_all_subscriptions() TO authenticated;

-- 4. Verificar os planos existentes
SELECT id, name, price FROM subscription_plans ORDER BY price;

-- 5. Atualizar cortesias existentes que não tem plan_id
-- (você pode ajustar conforme necessário)
-- UPDATE user_subscriptions
-- SET plan_id = 'ID_DO_PLANO_PREMIUM'
-- WHERE discount_percentage = 100 AND plan_id IS NULL;
