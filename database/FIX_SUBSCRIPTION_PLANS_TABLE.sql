-- =====================================================
-- FIX SUBSCRIPTION PLANS TABLE
-- =====================================================

-- CONTEXTO:
-- A tabela subscription_plans já existe mas precisa ser atualizada
-- para incluir a coluna features e outras melhorias

-- =====================================================
-- VERIFICAR ESTRUTURA ATUAL
-- =====================================================

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'subscription_plans'
ORDER BY ordinal_position;

-- =====================================================
-- ADICIONAR COLUNAS FALTANTES (SE NÃO EXISTIREM)
-- =====================================================

-- Adicionar coluna features se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscription_plans'
    AND column_name = 'features'
  ) THEN
    ALTER TABLE subscription_plans
    ADD COLUMN features JSONB NOT NULL DEFAULT '[]'::jsonb;

    RAISE NOTICE '✅ Coluna features adicionada';
  ELSE
    RAISE NOTICE '⚠️ Coluna features já existe';
  END IF;
END $$;

-- Adicionar coluna duration_months se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscription_plans'
    AND column_name = 'duration_months'
  ) THEN
    ALTER TABLE subscription_plans
    ADD COLUMN duration_months INTEGER NOT NULL DEFAULT 1 CHECK (duration_months > 0);

    RAISE NOTICE '✅ Coluna duration_months adicionada';
  ELSE
    RAISE NOTICE '⚠️ Coluna duration_months já existe';
  END IF;
END $$;

-- Adicionar coluna is_active se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscription_plans'
    AND column_name = 'is_active'
  ) THEN
    ALTER TABLE subscription_plans
    ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;

    RAISE NOTICE '✅ Coluna is_active adicionada';
  ELSE
    RAISE NOTICE '⚠️ Coluna is_active já existe';
  END IF;
END $$;

-- Adicionar coluna updated_at se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscription_plans'
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE subscription_plans
    ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

    RAISE NOTICE '✅ Coluna updated_at adicionada';
  ELSE
    RAISE NOTICE '⚠️ Coluna updated_at já existe';
  END IF;
END $$;

-- Adicionar coluna sessions_per_year se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscription_plans'
    AND column_name = 'sessions_per_year'
  ) THEN
    ALTER TABLE subscription_plans
    ADD COLUMN sessions_per_year INTEGER NOT NULL DEFAULT 999999;

    RAISE NOTICE '✅ Coluna sessions_per_year adicionada';
  ELSE
    RAISE NOTICE '⚠️ Coluna sessions_per_year já existe';
  END IF;
END $$;

-- Adicionar coluna max_patients se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscription_plans'
    AND column_name = 'max_patients'
  ) THEN
    ALTER TABLE subscription_plans
    ADD COLUMN max_patients INTEGER NOT NULL DEFAULT 999999;

    RAISE NOTICE '✅ Coluna max_patients adicionada';
  ELSE
    RAISE NOTICE '⚠️ Coluna max_patients já existe';
  END IF;
END $$;

-- =====================================================
-- CRIAR/RECRIAR TRIGGER PARA updated_at
-- =====================================================

-- Remover trigger antigo se existir
DROP TRIGGER IF EXISTS trigger_update_subscription_plans_updated_at ON subscription_plans;

-- Criar função se não existir
CREATE OR REPLACE FUNCTION update_subscription_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger
CREATE TRIGGER trigger_update_subscription_plans_updated_at
  BEFORE UPDATE ON subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_plans_updated_at();

-- =====================================================
-- REMOVER POLICIES ANTIGAS E CRIAR NOVAS
-- =====================================================

-- Remover policies antigas
DROP POLICY IF EXISTS "Super admin pode visualizar todos os planos" ON subscription_plans;
DROP POLICY IF EXISTS "Super admin pode inserir planos" ON subscription_plans;
DROP POLICY IF EXISTS "Super admin pode atualizar planos" ON subscription_plans;
DROP POLICY IF EXISTS "Super admin pode deletar planos" ON subscription_plans;
DROP POLICY IF EXISTS "Usuários podem visualizar planos ativos" ON subscription_plans;

-- Habilitar RLS
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- Super admin pode visualizar todos os planos
CREATE POLICY "Super admin pode visualizar todos os planos"
  ON subscription_plans
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM super_admins
      WHERE super_admins.id = auth.uid()
      AND super_admins.is_active = true
    )
  );

-- Super admin pode inserir planos
CREATE POLICY "Super admin pode inserir planos"
  ON subscription_plans
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM super_admins
      WHERE super_admins.id = auth.uid()
      AND super_admins.is_active = true
    )
  );

-- Super admin pode atualizar planos
CREATE POLICY "Super admin pode atualizar planos"
  ON subscription_plans
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM super_admins
      WHERE super_admins.id = auth.uid()
      AND super_admins.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM super_admins
      WHERE super_admins.id = auth.uid()
      AND super_admins.is_active = true
    )
  );

-- Super admin pode deletar planos
CREATE POLICY "Super admin pode deletar planos"
  ON subscription_plans
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM super_admins
      WHERE super_admins.id = auth.uid()
      AND super_admins.is_active = true
    )
  );

-- Usuários autenticados podem visualizar planos ativos
CREATE POLICY "Usuários podem visualizar planos ativos"
  ON subscription_plans
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- =====================================================
-- ATUALIZAR PLANO EXISTENTE COM FEATURES
-- =====================================================

-- Verificar se existe coluna sessions_per_year e outras colunas específicas
DO $$
DECLARE
  has_sessions_per_year boolean;
  has_max_patients boolean;
BEGIN
  -- Verificar se existe sessions_per_year
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscription_plans'
    AND column_name = 'sessions_per_year'
  ) INTO has_sessions_per_year;

  -- Verificar se existe max_patients
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscription_plans'
    AND column_name = 'max_patients'
  ) INTO has_max_patients;

  IF has_sessions_per_year THEN
    RAISE NOTICE 'ℹ️ Tabela tem coluna sessions_per_year - será incluída no INSERT/UPDATE';
  END IF;

  IF has_max_patients THEN
    RAISE NOTICE 'ℹ️ Tabela tem coluna max_patients - será incluída no INSERT/UPDATE';
  END IF;
END $$;

-- Atualizar plano existente se já tiver um
UPDATE subscription_plans
SET
  features = '["Agendamentos ilimitados", "Gestão de pacientes", "Prontuários digitais", "Relatórios financeiros", "Gestão de vendas", "Controle de estoque", "Lembretes automáticos", "Suporte prioritário"]'::jsonb,
  is_active = true,
  duration_months = 1,
  sessions_per_year = 999999,  -- Ilimitado
  max_patients = 999999  -- Ilimitado
WHERE name = 'Premium'
AND (features IS NULL OR features = '[]'::jsonb);

-- Se não existir nenhum plano, criar o Premium
INSERT INTO subscription_plans (name, description, price, features, duration_months, is_active, sessions_per_year, max_patients)
SELECT
  'Premium',
  'Plano completo com todas as funcionalidades para profissionais de harmonização orofacial',
  99.90,
  '["Agendamentos ilimitados", "Gestão de pacientes", "Prontuários digitais", "Relatórios financeiros", "Gestão de vendas", "Controle de estoque", "Lembretes automáticos", "Suporte prioritário"]'::jsonb,
  1,
  true,
  999999,  -- Sessões ilimitadas por ano
  999999   -- Pacientes ilimitados
WHERE NOT EXISTS (
  SELECT 1 FROM subscription_plans WHERE name = 'Premium'
);

-- =====================================================
-- VERIFICAR RESULTADO
-- =====================================================

SELECT
  'PLANOS ATUALIZADOS' as info,
  id,
  name,
  price,
  duration_months,
  is_active,
  CASE
    WHEN features IS NOT NULL THEN jsonb_array_length(features)
    ELSE 0
  END as total_features
FROM subscription_plans;

-- Mensagem final
DO $$
DECLARE
  plans_count integer;
  columns_count integer;
BEGIN
  SELECT COUNT(*) INTO plans_count FROM subscription_plans;

  SELECT COUNT(*) INTO columns_count
  FROM information_schema.columns
  WHERE table_name = 'subscription_plans'
  AND column_name IN ('features', 'duration_months', 'is_active', 'updated_at');

  RAISE NOTICE '✅ Tabela subscription_plans atualizada com sucesso!';
  RAISE NOTICE '';
  RAISE NOTICE '📊 RESULTADO:';
  RAISE NOTICE '  - Total de planos: %', plans_count;
  RAISE NOTICE '  - Colunas adicionadas/verificadas: %/4', columns_count;
  RAISE NOTICE '  - RLS habilitado: Sim';
  RAISE NOTICE '  - Policies criadas: 5 (super admin + usuários)';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 PRÓXIMO PASSO:';
  RAISE NOTICE '  - Acesse o Admin Panel > Planos';
  RAISE NOTICE '  - Crie novos planos ou edite o plano Premium';
  RAISE NOTICE '  - Sistema pronto para gerenciar planos!';
END $$;
