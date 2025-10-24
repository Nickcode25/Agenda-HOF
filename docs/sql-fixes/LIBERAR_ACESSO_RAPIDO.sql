-- ================================================
-- LIBERAR ACESSO RÁPIDO - nataliagsgoncalves21@gmail.com
-- ================================================
-- Execute este SQL no Supabase SQL Editor

-- Criar ou atualizar subscription ativa
INSERT INTO user_subscriptions (
    user_id,
    plan_name,
    plan_price,
    status,
    start_date,
    next_billing_date,
    pagbank_subscription_id
)
SELECT
    id,
    'Plano Profissional - Acesso Liberado',
    0.00,
    'active',
    NOW(),
    NOW() + INTERVAL '1 year',
    'ADMIN_ACCESS_LIBERADO'
FROM auth.users
WHERE email = 'nataliagsgoncalves21@gmail.com'
ON CONFLICT (user_id)
DO UPDATE SET
    status = 'active',
    plan_name = 'Plano Profissional - Acesso Liberado',
    plan_price = 0.00,
    start_date = NOW(),
    next_billing_date = NOW() + INTERVAL '1 year',
    updated_at = NOW();

-- Verificar se funcionou
SELECT
    u.email,
    us.plan_name,
    us.status,
    us.start_date,
    us.next_billing_date
FROM user_subscriptions us
JOIN auth.users u ON u.id = us.user_id
WHERE u.email = 'nataliagsgoncalves21@gmail.com';
