-- =====================================================
-- CORRIGIR VIEW subscribers_view PARA MOSTRAR TODOS USUÁRIOS
-- Executar no SQL Editor do Supabase
-- Data: 2025-12-03
-- =====================================================
-- PROBLEMA: A view atual parte de user_subscriptions,
-- então usuários sem assinatura (apenas em trial) não aparecem
-- SOLUÇÃO: Partir de auth.users e fazer LEFT JOIN com user_subscriptions
-- =====================================================

-- Deletar a view antiga
DROP VIEW IF EXISTS subscribers_view;

-- Recriar a view partindo de auth.users (todos os usuários)
CREATE VIEW subscribers_view AS
SELECT
  us.id as subscription_id,
  u.id as user_id,
  COALESCE(us.status, 'trial') as subscription_status,
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
FROM auth.users u
LEFT JOIN user_subscriptions us ON u.id = us.user_id
ORDER BY u.created_at DESC;

-- Conceder permissão de leitura para usuários autenticados
GRANT SELECT ON subscribers_view TO authenticated;

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================

SELECT 'View subscribers_view atualizada com sucesso!' as resultado;

-- Ver quantos usuários existem agora
SELECT COUNT(*) as total_usuarios FROM subscribers_view;
