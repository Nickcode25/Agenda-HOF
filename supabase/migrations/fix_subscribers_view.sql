-- =====================================================
-- Corrigir a view subscribers_view para mostrar nomes e telefones
-- =====================================================

-- Deletar a view antiga
DROP VIEW IF EXISTS subscribers_view;

-- Recriar a view subscribers_view com os campos corretos
CREATE VIEW subscribers_view AS
SELECT
  us.id as subscription_id,
  us.user_id,
  us.status as subscription_status,
  us.plan_amount,
  us.discount_percentage,
  us.mercadopago_subscription_id,
  us.created_at as subscription_created_at,
  us.updated_at as subscription_updated_at,
  u.email,
  (u.raw_user_meta_data->>'full_name')::TEXT as full_name,
  (u.raw_user_meta_data->>'phone')::TEXT as phone,
  (u.raw_user_meta_data->>'trial_end_date')::TIMESTAMPTZ as trial_end_date,
  u.created_at as user_created_at,
  u.last_sign_in_at as last_login
FROM user_subscriptions us
LEFT JOIN auth.users u ON us.user_id = u.id
ORDER BY us.created_at DESC;

-- Conceder permissão de leitura para usuários autenticados
GRANT SELECT ON subscribers_view TO authenticated;
