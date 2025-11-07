-- =====================================================
-- ENSURE MONTHLY SUBSCRIPTION TABLES (SEM APAGAR DADOS)
-- =====================================================

-- CONTEXTO:
-- Este script cria as tabelas SOMENTE se não existirem
-- NÃO apaga dados existentes
-- Seguro para executar a qualquer momento

-- =====================================================
-- TABELA DE PLANOS DE MENSALIDADE DO USUÁRIO
-- =====================================================

CREATE TABLE IF NOT EXISTS user_monthly_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  sessions_per_year INTEGER NOT NULL DEFAULT 12,
  benefits JSONB DEFAULT '[]'::jsonb,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices (IF NOT EXISTS para evitar erro se já existirem)
CREATE INDEX IF NOT EXISTS idx_user_monthly_plans_user_id ON user_monthly_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_user_monthly_plans_active ON user_monthly_plans(active);

-- Comentários
COMMENT ON TABLE user_monthly_plans IS 'Planos de mensalidade criados pelos usuários para seus pacientes';
COMMENT ON COLUMN user_monthly_plans.user_id IS 'ID do usuário (dono da clínica) que criou o plano';
COMMENT ON COLUMN user_monthly_plans.name IS 'Nome do plano (ex: Clube do Botox)';
COMMENT ON COLUMN user_monthly_plans.price IS 'Preço mensal do plano';
COMMENT ON COLUMN user_monthly_plans.sessions_per_year IS 'Número de sessões incluídas por ano';
COMMENT ON COLUMN user_monthly_plans.benefits IS 'Array JSON com benefícios do plano';

-- =====================================================
-- TABELA DE ASSINATURAS DE PACIENTES
-- =====================================================

CREATE TABLE IF NOT EXISTS patient_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL,
  patient_name TEXT NOT NULL,
  plan_id UUID NOT NULL REFERENCES user_monthly_plans(id) ON DELETE CASCADE,
  plan_name TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  start_date DATE NOT NULL,
  next_billing_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'suspended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_patient_subscriptions_user_id ON patient_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_patient_subscriptions_patient_id ON patient_subscriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_subscriptions_plan_id ON patient_subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_patient_subscriptions_status ON patient_subscriptions(status);

-- Comentários
COMMENT ON TABLE patient_subscriptions IS 'Assinaturas de pacientes nos planos de mensalidade';
COMMENT ON COLUMN patient_subscriptions.user_id IS 'ID do usuário (dono da clínica)';
COMMENT ON COLUMN patient_subscriptions.patient_id IS 'ID do paciente assinante';
COMMENT ON COLUMN patient_subscriptions.plan_id IS 'ID do plano de mensalidade';
COMMENT ON COLUMN patient_subscriptions.next_billing_date IS 'Data da próxima cobrança';
COMMENT ON COLUMN patient_subscriptions.status IS 'Status da assinatura (active, cancelled, suspended)';

-- =====================================================
-- TABELA DE PAGAMENTOS DE MENSALIDADE
-- =====================================================

CREATE TABLE IF NOT EXISTS subscription_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES patient_subscriptions(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
  due_date DATE NOT NULL,
  paid_at TIMESTAMPTZ,
  payment_method TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_subscription_payments_subscription_id ON subscription_payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_status ON subscription_payments(status);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_due_date ON subscription_payments(due_date);

-- Comentários
COMMENT ON TABLE subscription_payments IS 'Pagamentos de mensalidades';
COMMENT ON COLUMN subscription_payments.subscription_id IS 'ID da assinatura relacionada';
COMMENT ON COLUMN subscription_payments.due_date IS 'Data de vencimento do pagamento';
COMMENT ON COLUMN subscription_payments.paid_at IS 'Data em que foi pago (null se pendente)';
COMMENT ON COLUMN subscription_payments.status IS 'Status do pagamento (pending, paid, overdue, cancelled)';

-- =====================================================
-- TRIGGERS PARA ATUALIZAR updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_monthly_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop e recriar triggers para garantir que existam
DROP TRIGGER IF EXISTS trigger_update_user_monthly_plans_updated_at ON user_monthly_plans;
CREATE TRIGGER trigger_update_user_monthly_plans_updated_at
  BEFORE UPDATE ON user_monthly_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_monthly_plans_updated_at();

DROP TRIGGER IF EXISTS trigger_update_patient_subscriptions_updated_at ON patient_subscriptions;
CREATE TRIGGER trigger_update_patient_subscriptions_updated_at
  BEFORE UPDATE ON patient_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_monthly_plans_updated_at();

DROP TRIGGER IF EXISTS trigger_update_subscription_payments_updated_at ON subscription_payments;
CREATE TRIGGER trigger_update_subscription_payments_updated_at
  BEFORE UPDATE ON subscription_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_monthly_plans_updated_at();

-- =====================================================
-- RLS POLICIES (usar DO $$ para evitar erro se já existir)
-- =====================================================

DO $$
BEGIN
  -- Habilitar RLS
  ALTER TABLE user_monthly_plans ENABLE ROW LEVEL SECURITY;
  ALTER TABLE patient_subscriptions ENABLE ROW LEVEL SECURITY;
  ALTER TABLE subscription_payments ENABLE ROW LEVEL SECURITY;

  -- user_monthly_plans policies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_monthly_plans'
    AND policyname = 'Usuários podem ver seus próprios planos de mensalidade'
  ) THEN
    CREATE POLICY "Usuários podem ver seus próprios planos de mensalidade"
      ON user_monthly_plans FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_monthly_plans'
    AND policyname = 'Usuários podem criar seus próprios planos de mensalidade'
  ) THEN
    CREATE POLICY "Usuários podem criar seus próprios planos de mensalidade"
      ON user_monthly_plans FOR INSERT
      TO authenticated
      WITH CHECK (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_monthly_plans'
    AND policyname = 'Usuários podem atualizar seus próprios planos de mensalidade'
  ) THEN
    CREATE POLICY "Usuários podem atualizar seus próprios planos de mensalidade"
      ON user_monthly_plans FOR UPDATE
      TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_monthly_plans'
    AND policyname = 'Usuários podem deletar seus próprios planos de mensalidade'
  ) THEN
    CREATE POLICY "Usuários podem deletar seus próprios planos de mensalidade"
      ON user_monthly_plans FOR DELETE
      TO authenticated
      USING (user_id = auth.uid());
  END IF;

  -- patient_subscriptions policies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'patient_subscriptions'
    AND policyname = 'Usuários podem ver suas próprias assinaturas'
  ) THEN
    CREATE POLICY "Usuários podem ver suas próprias assinaturas"
      ON patient_subscriptions FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'patient_subscriptions'
    AND policyname = 'Usuários podem criar suas próprias assinaturas'
  ) THEN
    CREATE POLICY "Usuários podem criar suas próprias assinaturas"
      ON patient_subscriptions FOR INSERT
      TO authenticated
      WITH CHECK (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'patient_subscriptions'
    AND policyname = 'Usuários podem atualizar suas próprias assinaturas'
  ) THEN
    CREATE POLICY "Usuários podem atualizar suas próprias assinaturas"
      ON patient_subscriptions FOR UPDATE
      TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'patient_subscriptions'
    AND policyname = 'Usuários podem deletar suas próprias assinaturas'
  ) THEN
    CREATE POLICY "Usuários podem deletar suas próprias assinaturas"
      ON patient_subscriptions FOR DELETE
      TO authenticated
      USING (user_id = auth.uid());
  END IF;

  -- subscription_payments policies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'subscription_payments'
    AND policyname = 'Usuários podem ver seus próprios pagamentos'
  ) THEN
    CREATE POLICY "Usuários podem ver seus próprios pagamentos"
      ON subscription_payments FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM patient_subscriptions
          WHERE patient_subscriptions.id = subscription_payments.subscription_id
          AND patient_subscriptions.user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'subscription_payments'
    AND policyname = 'Usuários podem criar seus próprios pagamentos'
  ) THEN
    CREATE POLICY "Usuários podem criar seus próprios pagamentos"
      ON subscription_payments FOR INSERT
      TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM patient_subscriptions
          WHERE patient_subscriptions.id = subscription_payments.subscription_id
          AND patient_subscriptions.user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'subscription_payments'
    AND policyname = 'Usuários podem atualizar seus próprios pagamentos'
  ) THEN
    CREATE POLICY "Usuários podem atualizar seus próprios pagamentos"
      ON subscription_payments FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM patient_subscriptions
          WHERE patient_subscriptions.id = subscription_payments.subscription_id
          AND patient_subscriptions.user_id = auth.uid()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM patient_subscriptions
          WHERE patient_subscriptions.id = subscription_payments.subscription_id
          AND patient_subscriptions.user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'subscription_payments'
    AND policyname = 'Usuários podem deletar seus próprios pagamentos'
  ) THEN
    CREATE POLICY "Usuários podem deletar seus próprios pagamentos"
      ON subscription_payments FOR DELETE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM patient_subscriptions
          WHERE patient_subscriptions.id = subscription_payments.subscription_id
          AND patient_subscriptions.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- =====================================================
-- MENSAGEM FINAL
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Tabelas de mensalidade verificadas/criadas com sucesso!';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  IMPORTANTE:';
  RAISE NOTICE '  Este script NÃO apaga dados existentes';
  RAISE NOTICE '  Seguro para executar múltiplas vezes';
  RAISE NOTICE '';
  RAISE NOTICE '📊 TABELAS:';
  RAISE NOTICE '  - user_monthly_plans: Planos criados pelos usuários';
  RAISE NOTICE '  - patient_subscriptions: Assinaturas de pacientes';
  RAISE NOTICE '  - subscription_payments: Pagamentos de mensalidades';
END $$;
