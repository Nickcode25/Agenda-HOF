-- =====================================================
-- FIX: Corrige todas as views do admin para funcionarem em conjunto
-- Execute este SQL no Supabase SQL Editor
-- Data: 2025-12-11
-- =====================================================

-- =====================================================
-- 1. RECRIAR subscribers_view COM full_name CORRETO
-- =====================================================

DROP VIEW IF EXISTS public.subscribers_view CASCADE;

CREATE OR REPLACE VIEW subscribers_view AS
SELECT
  -- Dados da assinatura
  us.id as subscription_id,
  us.user_id,
  us.mercadopago_subscription_id,
  us.stripe_subscription_id,
  us.status as subscription_status,
  us.plan_amount,
  us.billing_cycle,
  us.next_billing_date,
  us.last_payment_date,
  us.payment_method,
  us.card_last_digits,
  us.card_brand,
  us.discount_percentage,
  us.coupon_id,
  us.started_at,
  us.suspended_at,
  us.cancelled_at,
  us.created_at as subscription_created_at,

  -- Dados do usuário (auth.users) - CORRIGIDO: usar COALESCE para full_name
  u.email,
  COALESCE(
    u.raw_user_meta_data->>'full_name',
    u.raw_user_meta_data->>'name',
    u.email
  ) as full_name,
  u.raw_user_meta_data->>'cpf' as cpf,
  u.raw_user_meta_data->>'phone' as phone,
  u.created_at as user_created_at,
  u.last_sign_in_at,

  -- Dados do cupom (se houver)
  dc.code as coupon_code,
  dc.discount_percentage as coupon_discount_percentage

FROM user_subscriptions us
LEFT JOIN auth.users u ON us.user_id = u.id
LEFT JOIN discount_coupons dc ON us.coupon_id = dc.id
ORDER BY us.created_at DESC;

-- Permissões
GRANT SELECT ON subscribers_view TO service_role;
GRANT SELECT ON subscribers_view TO authenticated;

COMMENT ON VIEW subscribers_view IS 'View para admin: assinaturas com dados de usuários';

-- =====================================================
-- 2. VERIFICAR/ATUALIZAR get_all_users FUNCTION
-- =====================================================

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
    u.email::TEXT as owner_email,
    COALESCE(
      u.raw_user_meta_data->>'full_name',
      u.raw_user_meta_data->>'name',
      u.email
    )::TEXT as owner_name,
    (u.raw_user_meta_data->>'phone')::TEXT as owner_phone,
    u.created_at as user_created_at,
    u.last_sign_in_at as last_login
  FROM auth.users u
  ORDER BY u.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_all_users() TO authenticated;

-- =====================================================
-- 3. VERIFICAR/ATUALIZAR get_all_subscriptions FUNCTION
-- =====================================================

DROP FUNCTION IF EXISTS get_all_subscriptions();

CREATE OR REPLACE FUNCTION get_all_subscriptions()
RETURNS TABLE (
  subscription_id UUID,
  user_id UUID,
  user_email TEXT,
  user_name TEXT,
  status TEXT,
  plan_amount NUMERIC,
  discount_percentage INTEGER,
  next_billing_date TIMESTAMPTZ,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ,
  trial_end_date TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Apenas super admins podem executar esta função
  IF NOT is_super_admin() THEN
    RAISE EXCEPTION 'Acesso negado: apenas super admins podem listar assinaturas';
  END IF;

  RETURN QUERY
  SELECT
    us.id as subscription_id,
    us.user_id,
    u.email::TEXT as user_email,
    COALESCE(
      u.raw_user_meta_data->>'full_name',
      u.raw_user_meta_data->>'name',
      u.email
    )::TEXT as user_name,
    us.status::TEXT,
    us.plan_amount,
    COALESCE(us.discount_percentage, 0)::INTEGER as discount_percentage,
    us.next_billing_date,
    us.stripe_subscription_id::TEXT,
    us.created_at,
    (u.raw_user_meta_data->>'trial_end_date')::TIMESTAMPTZ as trial_end_date
  FROM user_subscriptions us
  LEFT JOIN auth.users u ON us.user_id = u.id
  ORDER BY us.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_all_subscriptions() TO authenticated;

-- =====================================================
-- MENSAGEM DE SUCESSO
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Todas as views e funções do admin foram atualizadas!';
  RAISE NOTICE '📊 subscribers_view: corrigido campo full_name';
  RAISE NOTICE '👤 get_all_users(): atualizado com full_name e phone';
  RAISE NOTICE '💳 get_all_subscriptions(): atualizado com user_name';
END $$;
