-- =====================================================
-- FIX RLS POLICIES - Recriar policies que faltam
-- =====================================================

-- Habilitar RLS nas tabelas
ALTER TABLE user_monthly_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_payments ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- user_monthly_plans policies
-- =====================================================

DROP POLICY IF EXISTS "Usuários podem ver seus próprios planos de mensalidade" ON user_monthly_plans;
CREATE POLICY "Usuários podem ver seus próprios planos de mensalidade"
  ON user_monthly_plans FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Usuários podem criar seus próprios planos de mensalidade" ON user_monthly_plans;
CREATE POLICY "Usuários podem criar seus próprios planos de mensalidade"
  ON user_monthly_plans FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios planos de mensalidade" ON user_monthly_plans;
CREATE POLICY "Usuários podem atualizar seus próprios planos de mensalidade"
  ON user_monthly_plans FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Usuários podem deletar seus próprios planos de mensalidade" ON user_monthly_plans;
CREATE POLICY "Usuários podem deletar seus próprios planos de mensalidade"
  ON user_monthly_plans FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- =====================================================
-- patient_subscriptions policies
-- =====================================================

DROP POLICY IF EXISTS "Usuários podem ver suas próprias assinaturas" ON patient_subscriptions;
CREATE POLICY "Usuários podem ver suas próprias assinaturas"
  ON patient_subscriptions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Usuários podem criar suas próprias assinaturas" ON patient_subscriptions;
CREATE POLICY "Usuários podem criar suas próprias assinaturas"
  ON patient_subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Usuários podem atualizar suas próprias assinaturas" ON patient_subscriptions;
CREATE POLICY "Usuários podem atualizar suas próprias assinaturas"
  ON patient_subscriptions FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Usuários podem deletar suas próprias assinaturas" ON patient_subscriptions;
CREATE POLICY "Usuários podem deletar suas próprias assinaturas"
  ON patient_subscriptions FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- =====================================================
-- subscription_payments policies
-- =====================================================

DROP POLICY IF EXISTS "Usuários podem ver seus próprios pagamentos" ON subscription_payments;
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

DROP POLICY IF EXISTS "Usuários podem criar seus próprios pagamentos" ON subscription_payments;
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

DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios pagamentos" ON subscription_payments;
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

DROP POLICY IF EXISTS "Usuários podem deletar seus próprios pagamentos" ON subscription_payments;
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
