-- =====================================================
-- FIX RLS POLICIES - English names (sem caracteres especiais)
-- =====================================================

-- Primeiro, limpar TODAS as políticas existentes
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname, tablename
        FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename IN ('user_monthly_plans', 'patient_subscriptions', 'subscription_payments')
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
    END LOOP;
END $$;

-- Habilitar RLS
ALTER TABLE user_monthly_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_payments ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- user_monthly_plans policies
-- =====================================================

CREATE POLICY "user_monthly_plans_select_policy"
  ON user_monthly_plans FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "user_monthly_plans_insert_policy"
  ON user_monthly_plans FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_monthly_plans_update_policy"
  ON user_monthly_plans FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_monthly_plans_delete_policy"
  ON user_monthly_plans FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- =====================================================
-- patient_subscriptions policies
-- =====================================================

CREATE POLICY "patient_subscriptions_select_policy"
  ON patient_subscriptions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "patient_subscriptions_insert_policy"
  ON patient_subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "patient_subscriptions_update_policy"
  ON patient_subscriptions FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "patient_subscriptions_delete_policy"
  ON patient_subscriptions FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- =====================================================
-- subscription_payments policies
-- =====================================================

CREATE POLICY "subscription_payments_select_policy"
  ON subscription_payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM patient_subscriptions
      WHERE patient_subscriptions.id = subscription_payments.subscription_id
      AND patient_subscriptions.user_id = auth.uid()
    )
  );

CREATE POLICY "subscription_payments_insert_policy"
  ON subscription_payments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM patient_subscriptions
      WHERE patient_subscriptions.id = subscription_payments.subscription_id
      AND patient_subscriptions.user_id = auth.uid()
    )
  );

CREATE POLICY "subscription_payments_update_policy"
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

CREATE POLICY "subscription_payments_delete_policy"
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
-- Verificação final
-- =====================================================

DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename IN ('user_monthly_plans', 'patient_subscriptions', 'subscription_payments');

  IF policy_count = 12 THEN
    RAISE NOTICE '✅ SUCCESS! 12 RLS policies created';
    RAISE NOTICE '  - 4 policies for user_monthly_plans';
    RAISE NOTICE '  - 4 policies for patient_subscriptions';
    RAISE NOTICE '  - 4 policies for subscription_payments';
  ELSE
    RAISE WARNING '⚠️ Expected 12 policies but found %', policy_count;
  END IF;
END $$;
