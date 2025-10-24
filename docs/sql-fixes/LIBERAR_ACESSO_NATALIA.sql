-- ================================================
-- LIBERAR ACESSO PARA nataliagsgoncalves21@gmail.com
-- ================================================

-- 1. Primeiro, encontrar o user_id da Natália
SELECT
    id as user_id,
    email,
    created_at
FROM auth.users
WHERE email = 'nataliagsgoncalves21@gmail.com';

-- 2. Copie o user_id acima e substitua no comando abaixo
-- Exemplo: se o ID for 'b1a9efa0-e92a-459c-a668-e95efa628f3f'

-- 3. Criar subscription ativa para a Natália
INSERT INTO user_subscriptions (
    user_id,
    plan_name,
    plan_price,
    status,
    start_date,
    next_billing_date,
    pagbank_subscription_id
)
VALUES (
    'COLE_O_USER_ID_AQUI', -- Substituir pelo ID obtido acima
    'Plano Profissional - Acesso Admin',
    0.00, -- Preço zero para admin
    'active',
    NOW(),
    NOW() + INTERVAL '1 year', -- Válido por 1 ano
    'ADMIN_ACCESS'
)
ON CONFLICT (user_id)
DO UPDATE SET
    status = 'active',
    plan_name = 'Plano Profissional - Acesso Admin',
    start_date = NOW(),
    next_billing_date = NOW() + INTERVAL '1 year';

-- 4. Verificar se foi criado
SELECT
    us.id,
    us.user_id,
    u.email,
    us.plan_name,
    us.status,
    us.start_date,
    us.next_billing_date
FROM user_subscriptions us
JOIN auth.users u ON u.id = us.user_id
WHERE u.email = 'nataliagsgoncalves21@gmail.com';
