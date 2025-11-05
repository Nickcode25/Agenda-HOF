-- =====================================================
-- CREATE SUBSCRIPTION PLANS TABLE
-- =====================================================

-- CONTEXTO:
-- Criação da tabela subscription_plans para gerenciar planos de assinatura
-- que podem ser criados, editados e gerenciados através do Admin Panel

-- =====================================================
-- CRIAR TABELA subscription_plans
-- =====================================================

CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  duration_months INTEGER NOT NULL DEFAULT 1 CHECK (duration_months > 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Comentários nas colunas
COMMENT ON TABLE subscription_plans IS 'Planos de assinatura disponíveis na plataforma';
COMMENT ON COLUMN subscription_plans.id IS 'Identificador único do plano';
COMMENT ON COLUMN subscription_plans.name IS 'Nome do plano (ex: Premium, Básico)';
COMMENT ON COLUMN subscription_plans.description IS 'Descrição detalhada do plano';
COMMENT ON COLUMN subscription_plans.price IS 'Preço mensal do plano em reais';
COMMENT ON COLUMN subscription_plans.features IS 'Array JSON com lista de features/benefícios do plano';
COMMENT ON COLUMN subscription_plans.duration_months IS 'Duração do plano em meses';
COMMENT ON COLUMN subscription_plans.is_active IS 'Se o plano está ativo e disponível para contratação';
COMMENT ON COLUMN subscription_plans.created_at IS 'Data de criação do plano';
COMMENT ON COLUMN subscription_plans.updated_at IS 'Data da última atualização do plano';

-- =====================================================
-- TRIGGER PARA ATUALIZAR updated_at AUTOMATICAMENTE
-- =====================================================

CREATE OR REPLACE FUNCTION update_subscription_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_subscription_plans_updated_at
  BEFORE UPDATE ON subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_plans_updated_at();

-- =====================================================
-- RLS POLICIES - ACESSO RESTRITO A SUPER ADMIN
-- =====================================================

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
      WHERE super_admins.user_id = auth.uid()
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
      WHERE super_admins.user_id = auth.uid()
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
      WHERE super_admins.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM super_admins
      WHERE super_admins.user_id = auth.uid()
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
      WHERE super_admins.user_id = auth.uid()
    )
  );

-- =====================================================
-- POLICY PARA USUÁRIOS VISUALIZAREM PLANOS ATIVOS
-- =====================================================

-- Usuários autenticados podem visualizar planos ativos
CREATE POLICY "Usuários podem visualizar planos ativos"
  ON subscription_plans
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- =====================================================
-- INSERIR PLANO PADRÃO (PREMIUM)
-- =====================================================

INSERT INTO subscription_plans (name, description, price, features, duration_months, is_active)
VALUES (
  'Premium',
  'Plano completo com todas as funcionalidades para profissionais de harmonização orofacial',
  99.90,
  '["Agendamentos ilimitados", "Gestão de pacientes", "Prontuários digitais", "Relatórios financeiros", "Gestão de vendas", "Controle de estoque", "Lembretes automáticos", "Suporte prioritário"]'::jsonb,
  1,
  true
);

-- =====================================================
-- VERIFICAR RESULTADO
-- =====================================================

SELECT
  'PLANOS CRIADOS' as info,
  id,
  name,
  price,
  duration_months,
  is_active,
  jsonb_array_length(features) as total_features
FROM subscription_plans;

-- Mensagem final
DO $$
DECLARE
  plans_count integer;
BEGIN
  SELECT COUNT(*) INTO plans_count
  FROM subscription_plans;

  RAISE NOTICE '✅ Tabela subscription_plans criada com sucesso!';
  RAISE NOTICE '';
  RAISE NOTICE '📊 RESULTADO:';
  RAISE NOTICE '  - Total de planos: %', plans_count;
  RAISE NOTICE '  - RLS habilitado: Sim';
  RAISE NOTICE '  - Policies criadas: 5 (super admin + usuários)';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 PRÓXIMO PASSO:';
  RAISE NOTICE '  - Acesse o Admin Panel > Planos';
  RAISE NOTICE '  - Crie novos planos ou edite o plano Premium';
  RAISE NOTICE '  - Usuários podem visualizar planos ativos no checkout';
END $$;
