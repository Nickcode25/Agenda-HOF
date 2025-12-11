-- =====================================================
-- FIX: Corrige assinaturas duplicadas na página de admin
-- Retorna apenas a assinatura mais recente de cada usuário
-- Execute este SQL no Supabase SQL Editor
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

  -- Retorna apenas a assinatura mais recente de cada usuário
  -- Prioriza assinaturas ativas sobre outras
  RETURN QUERY
  WITH ranked_subscriptions AS (
    SELECT
      us.id,
      us.user_id,
      us.status,
      us.plan_amount,
      us.discount_percentage,
      us.next_billing_date,
      us.stripe_subscription_id,
      us.created_at,
      ROW_NUMBER() OVER (
        PARTITION BY us.user_id
        ORDER BY
          CASE WHEN us.status = 'active' THEN 0 ELSE 1 END,
          us.created_at DESC
      ) as rn
    FROM user_subscriptions us
  )
  SELECT
    rs.id as subscription_id,
    rs.user_id,
    u.email::TEXT as user_email,
    COALESCE(
      u.raw_user_meta_data->>'full_name',
      u.raw_user_meta_data->>'name',
      u.email
    )::TEXT as user_name,
    rs.status::TEXT,
    rs.plan_amount,
    COALESCE(rs.discount_percentage, 0)::INTEGER as discount_percentage,
    rs.next_billing_date,
    rs.stripe_subscription_id::TEXT,
    rs.created_at,
    (u.raw_user_meta_data->>'trial_end_date')::TIMESTAMPTZ as trial_end_date
  FROM ranked_subscriptions rs
  LEFT JOIN auth.users u ON rs.user_id = u.id
  WHERE rs.rn = 1
  ORDER BY rs.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_all_subscriptions() TO authenticated;

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Função get_all_subscriptions atualizada!';
  RAISE NOTICE '📊 Agora retorna apenas a assinatura mais recente de cada usuário';
  RAISE NOTICE '🔄 Prioriza assinaturas ativas sobre outras';
END $$;
