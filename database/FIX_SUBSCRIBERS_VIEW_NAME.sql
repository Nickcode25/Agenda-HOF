-- =====================================================
-- FIX: Corrige o campo full_name na view subscribers_view
-- Execute este SQL no Supabase SQL Editor
-- =====================================================

-- Primeiro, dropar a view existente
DROP VIEW IF EXISTS public.subscribers_view CASCADE;

-- Recriar a view com o campo full_name corretamente
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

  -- Dados do usuário (auth.users) - CORRIGIDO: usar full_name
  u.email,
  COALESCE(
    u.raw_user_meta_data->>'full_name',
    u.raw_user_meta_data->>'name',
    'Nome não disponível'
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

-- Comentário explicativo
COMMENT ON VIEW subscribers_view IS 'View que junta dados de assinaturas com informações completas dos usuários e cupons';

-- Conceder permissão para service_role
GRANT SELECT ON subscribers_view TO service_role;

-- Conceder permissão para usuários autenticados
GRANT SELECT ON subscribers_view TO authenticated;

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ View subscribers_view recriada com full_name corrigido!';
END $$;
