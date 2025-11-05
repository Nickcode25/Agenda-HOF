-- =====================================================
-- ADICIONAR CAMPOS DE TRIAL E COBRANÇA AOS PLANOS
-- =====================================================

-- CONTEXTO:
-- Adicionar campos para gerenciar período de trial e configuração de cobrança

-- =====================================================
-- ADICIONAR COLUNAS PARA TRIAL E BILLING
-- =====================================================

-- Adicionar coluna has_trial (se o plano tem período de trial)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscription_plans'
    AND column_name = 'has_trial'
  ) THEN
    ALTER TABLE subscription_plans
    ADD COLUMN has_trial BOOLEAN NOT NULL DEFAULT false;

    RAISE NOTICE '✅ Coluna has_trial adicionada';
  ELSE
    RAISE NOTICE '⚠️ Coluna has_trial já existe';
  END IF;
END $$;

-- Adicionar coluna trial_days (quantidade de dias de trial)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscription_plans'
    AND column_name = 'trial_days'
  ) THEN
    ALTER TABLE subscription_plans
    ADD COLUMN trial_days INTEGER DEFAULT 0 CHECK (trial_days >= 0);

    RAISE NOTICE '✅ Coluna trial_days adicionada';
  ELSE
    RAISE NOTICE '⚠️ Coluna trial_days já existe';
  END IF;
END $$;

-- Adicionar coluna billing_day (dia do mês para cobrança: 1-28, ou null para data de assinatura)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscription_plans'
    AND column_name = 'billing_day'
  ) THEN
    ALTER TABLE subscription_plans
    ADD COLUMN billing_day INTEGER DEFAULT NULL CHECK (billing_day IS NULL OR (billing_day >= 1 AND billing_day <= 28));

    RAISE NOTICE '✅ Coluna billing_day adicionada';
  ELSE
    RAISE NOTICE '⚠️ Coluna billing_day já existe';
  END IF;
END $$;

-- Adicionar coluna retry_failed_payments (tentar reprocessar pagamentos falhados)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscription_plans'
    AND column_name = 'retry_failed_payments'
  ) THEN
    ALTER TABLE subscription_plans
    ADD COLUMN retry_failed_payments BOOLEAN NOT NULL DEFAULT true;

    RAISE NOTICE '✅ Coluna retry_failed_payments adicionada';
  ELSE
    RAISE NOTICE '⚠️ Coluna retry_failed_payments já existe';
  END IF;
END $$;

-- Adicionar coluna max_retry_attempts (máximo de tentativas de reprocessamento)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscription_plans'
    AND column_name = 'max_retry_attempts'
  ) THEN
    ALTER TABLE subscription_plans
    ADD COLUMN max_retry_attempts INTEGER NOT NULL DEFAULT 3 CHECK (max_retry_attempts >= 0 AND max_retry_attempts <= 10);

    RAISE NOTICE '✅ Coluna max_retry_attempts adicionada';
  ELSE
    RAISE NOTICE '⚠️ Coluna max_retry_attempts já existe';
  END IF;
END $$;

-- Adicionar coluna retry_interval_days (intervalo entre tentativas em dias)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscription_plans'
    AND column_name = 'retry_interval_days'
  ) THEN
    ALTER TABLE subscription_plans
    ADD COLUMN retry_interval_days INTEGER NOT NULL DEFAULT 3 CHECK (retry_interval_days >= 1 AND retry_interval_days <= 30);

    RAISE NOTICE '✅ Coluna retry_interval_days adicionada';
  ELSE
    RAISE NOTICE '⚠️ Coluna retry_interval_days já existe';
  END IF;
END $$;

-- =====================================================
-- ADICIONAR COMENTÁRIOS NAS COLUNAS
-- =====================================================

COMMENT ON COLUMN subscription_plans.has_trial IS 'Se o plano tem período de trial gratuito';
COMMENT ON COLUMN subscription_plans.trial_days IS 'Quantidade de dias de trial (0 = sem trial)';
COMMENT ON COLUMN subscription_plans.billing_day IS 'Dia fixo do mês para cobrança (1-28, NULL = data de assinatura)';
COMMENT ON COLUMN subscription_plans.retry_failed_payments IS 'Se deve tentar reprocessar pagamentos falhados';
COMMENT ON COLUMN subscription_plans.max_retry_attempts IS 'Máximo de tentativas de reprocessamento (padrão: 3)';
COMMENT ON COLUMN subscription_plans.retry_interval_days IS 'Intervalo entre tentativas em dias (padrão: 3)';

-- =====================================================
-- ATUALIZAR PLANO PREMIUM COM TRIAL
-- =====================================================

UPDATE subscription_plans
SET
  has_trial = true,
  trial_days = 7,
  billing_day = NULL,  -- Cobra 30 dias após a data de assinatura
  retry_failed_payments = true,
  max_retry_attempts = 3,
  retry_interval_days = 3
WHERE name = 'Premium';

-- =====================================================
-- VERIFICAR RESULTADO
-- =====================================================

SELECT
  'PLANOS COM TRIAL CONFIGURADO' as info,
  id,
  name,
  price,
  has_trial,
  trial_days,
  billing_day,
  max_retry_attempts,
  retry_interval_days
FROM subscription_plans;

-- Mensagem final
DO $$
DECLARE
  plans_count integer;
  trial_plans_count integer;
BEGIN
  SELECT COUNT(*) INTO plans_count FROM subscription_plans;
  SELECT COUNT(*) INTO trial_plans_count FROM subscription_plans WHERE has_trial = true;

  RAISE NOTICE '✅ Configuração de trial e billing adicionada!';
  RAISE NOTICE '';
  RAISE NOTICE '📊 RESULTADO:';
  RAISE NOTICE '  - Total de planos: %', plans_count;
  RAISE NOTICE '  - Planos com trial: %', trial_plans_count;
  RAISE NOTICE '';
  RAISE NOTICE '🎯 CONFIGURAÇÃO DE COBRANÇA:';
  RAISE NOTICE '  - Trial days: Define quantos dias de trial gratuito';
  RAISE NOTICE '  - Billing day: NULL = cobra 30 dias após assinatura';
  RAISE NOTICE '  - Billing day: 1-28 = cobra no dia fixo do mês';
  RAISE NOTICE '  - Max retry: 3 tentativas';
  RAISE NOTICE '  - Retry interval: A cada 3 dias';
  RAISE NOTICE '';
  RAISE NOTICE '💡 COMO FUNCIONA:';
  RAISE NOTICE '  1. Cliente assina → inicia trial (se has_trial = true)';
  RAISE NOTICE '  2. Após trial_days → primeira cobrança';
  RAISE NOTICE '  3. Se falhar → tenta max_retry_attempts vezes';
  RAISE NOTICE '  4. Se falhar tudo → cancela assinatura';
END $$;
