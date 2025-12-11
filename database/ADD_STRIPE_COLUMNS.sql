-- ==============================================
-- Adicionar colunas do Stripe na tabela user_subscriptions
-- Execute este SQL no Supabase SQL Editor
-- ==============================================

-- 1. Adicionar colunas do Stripe (ignorar se já existir)
ALTER TABLE user_subscriptions
ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255) UNIQUE;

ALTER TABLE user_subscriptions
ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255);

ALTER TABLE user_subscriptions
ADD COLUMN IF NOT EXISTS plan_name VARCHAR(255);

-- 2. Adicionar coluna plan_type se não existir
ALTER TABLE user_subscriptions
ADD COLUMN IF NOT EXISTS plan_type VARCHAR(50) DEFAULT 'basic';

-- 3. Criar índice para stripe_subscription_id
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_id
ON user_subscriptions(stripe_subscription_id);

-- 4. Criar índice para stripe_customer_id
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_customer_id
ON user_subscriptions(stripe_customer_id);

-- 5. Verificar estrutura da tabela
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'user_subscriptions'
ORDER BY ordinal_position;

-- 6. Verificar se a política de UPDATE existe, se não criar
DO $$
BEGIN
    -- Tentar criar a política de UPDATE
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'user_subscriptions'
        AND policyname = 'Users can update own subscriptions'
    ) THEN
        EXECUTE 'CREATE POLICY "Users can update own subscriptions" ON user_subscriptions
            FOR UPDATE
            TO authenticated
            USING (auth.uid() = user_id)
            WITH CHECK (auth.uid() = user_id)';
        RAISE NOTICE 'Política de UPDATE criada com sucesso';
    ELSE
        RAISE NOTICE 'Política de UPDATE já existe';
    END IF;
END $$;

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Colunas do Stripe adicionadas com sucesso!';
END $$;
