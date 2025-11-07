-- =====================================================
-- EXECUTE ESTE SQL NO SUPABASE PARA CORRIGIR PERMISSÕES
-- =====================================================
--
-- PROBLEMA: Erro 403 "permission denied for table user_monthly_plans"
-- SOLUÇÃO: Recriar todas as políticas RLS (Row Level Security)
--
-- =====================================================

-- Primeiro, verificar se as tabelas existem
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_monthly_plans') THEN
    RAISE EXCEPTION 'Tabela user_monthly_plans não existe! Execute create_monthly_subscription_tables_safe.sql primeiro';
  END IF;
END $$;

-- Habilitar RLS nas tabelas
ALTER TABLE user_monthly_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_payments ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- REMOVER TODAS AS POLÍTICAS ANTIGAS
-- =====================================================

DROP POLICY IF EXISTS "Usuários podem ver seus próprios planos de mensalidade" ON user_monthly_plans;
DROP POLICY IF EXISTS "Usuários podem criar seus próprios planos de mensalidade" ON user_monthly_plans;
DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios planos de mensalidade" ON user_monthly_plans;
DROP POLICY IF EXISTS "Usuários podem deletar seus próprios planos de mensalidade" ON user_monthly_plans;

DROP POLICY IF EXISTS "Usuários podem ver suas próprias assinaturas" ON patient_subscriptions;
DROP POLICY IF EXISTS "Usuários podem criar suas próprias assinaturas" ON patient_subscriptions;
DROP POLICY IF EXISTS "Usuários podem atualizar suas próprias assinaturas" ON patient_subscriptions;
DROP POLICY IF EXISTS "Usuários podem deletar suas próprias assinaturas" ON patient_subscriptions;

DROP POLICY IF EXISTS "Usuários podem ver seus próprios pagamentos" ON subscription_payments;
DROP POLICY IF EXISTS "Usuários podem criar seus próprios pagamentos" ON subscription_payments;
DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios pagamentos" ON subscription_payments;
DROP POLICY IF EXISTS "Usuários podem deletar seus próprios pagamentos" ON subscription_payments;

-- =====================================================
-- CRIAR POLÍTICAS PARA user_monthly_plans
-- =====================================================

CREATE POLICY "Usuários podem ver seus próprios planos de mensalidade"
  ON user_monthly_plans FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Usuários podem criar seus próprios planos de mensalidade"
  ON user_monthly_plans FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Usuários podem atualizar seus próprios planos de mensalidade"
  ON user_monthly_plans FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Usuários podem deletar seus próprios planos de mensalidade"
  ON user_monthly_plans FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- =====================================================
-- CRIAR POLÍTICAS PARA patient_subscriptions
-- =====================================================

CREATE POLICY "Usuários podem ver suas próprias assinaturas"
  ON patient_subscriptions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Usuários podem criar suas próprias assinaturas"
  ON patient_subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Usuários podem atualizar suas próprias assinaturas"
  ON patient_subscriptions FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Usuários podem deletar suas próprias assinaturas"
  ON patient_subscriptions FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- =====================================================
-- CRIAR POLÍTICAS PARA subscription_payments
-- =====================================================

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

-- =====================================================
-- MENSAGEM DE SUCESSO
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ POLÍTICAS RLS RECRIADAS COM SUCESSO!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 12 políticas foram criadas:';
  RAISE NOTICE '  - 4 policies para user_monthly_plans';
  RAISE NOTICE '  - 4 policies para patient_subscriptions';
  RAISE NOTICE '  - 4 policies para subscription_payments';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 Segurança restaurada!';
  RAISE NOTICE '  - Cada usuário só pode ver seus próprios dados';
  RAISE NOTICE '  - RLS habilitado em todas as tabelas';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 PRÓXIMO PASSO:';
  RAISE NOTICE '  - Recarregue a página do site';
  RAISE NOTICE '  - Tente criar o plano novamente';
  RAISE NOTICE '  - Deve funcionar sem erro 403!';
END $$;
