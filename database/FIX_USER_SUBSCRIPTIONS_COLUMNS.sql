-- =====================================================
-- ADICIONAR COLUNAS FALTANTES NA TABELA user_subscriptions
-- =====================================================
-- Execute este SQL no Supabase SQL Editor
-- =====================================================

-- 1. Adicionar colunas do Mercado Pago (se não existirem)
ALTER TABLE user_subscriptions
ADD COLUMN IF NOT EXISTS subscription_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS amount NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS next_billing_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE;

-- 2. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_subscription_id
ON user_subscriptions(subscription_id);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_status
ON user_subscriptions(user_id, status);

-- 3. Atualizar assinaturas ativas com valor padrão R$ 99,90
UPDATE user_subscriptions
SET amount = 99.90
WHERE status = 'active'
  AND amount IS NULL;

-- 4. Verificar resultado
SELECT
  id,
  user_id,
  subscription_id,
  status,
  plan_type,
  amount,
  next_billing_date,
  last_payment_date,
  created_at
FROM user_subscriptions
WHERE status = 'active'
ORDER BY created_at DESC;

-- 5. Ver todas as colunas da tabela
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'user_subscriptions'
ORDER BY ordinal_position;
