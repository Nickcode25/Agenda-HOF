-- =====================================================
-- RECRIAR POLÍTICAS RLS - Versão Corrigida
-- =====================================================
-- Este SQL vai REMOVER as políticas antigas e criar novas
-- usando a sintaxe correta do Supabase

BEGIN;

-- =====================================================
-- PASSO 1: Remover TODAS as políticas antigas
-- =====================================================

DO $$
DECLARE
    r RECORD;
BEGIN
    -- Loop através de todas as políticas existentes
    FOR r IN (
        SELECT policyname, tablename
        FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename IN ('user_monthly_plans', 'patient_subscriptions', 'subscription_payments')
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
        RAISE NOTICE 'Removida policy: % da tabela %', r.policyname, r.tablename;
    END LOOP;
END $$;

-- =====================================================
-- PASSO 2: Desabilitar e reabilitar RLS
-- =====================================================

ALTER TABLE user_monthly_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE patient_subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_payments DISABLE ROW LEVEL SECURITY;

ALTER TABLE user_monthly_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_payments ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PASSO 3: user_monthly_plans - Políticas Corretas
-- =====================================================

CREATE POLICY "Enable read access for authenticated users"
  ON user_monthly_plans
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Enable insert for authenticated users"
  ON user_monthly_plans
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Enable update for authenticated users"
  ON user_monthly_plans
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Enable delete for authenticated users"
  ON user_monthly_plans
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- =====================================================
-- PASSO 4: patient_subscriptions - Políticas Corretas
-- =====================================================

CREATE POLICY "Enable read access for authenticated users"
  ON patient_subscriptions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Enable insert for authenticated users"
  ON patient_subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Enable update for authenticated users"
  ON patient_subscriptions
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Enable delete for authenticated users"
  ON patient_subscriptions
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- =====================================================
-- PASSO 5: subscription_payments - Políticas Corretas
-- =====================================================

CREATE POLICY "Enable read access for authenticated users"
  ON subscription_payments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM patient_subscriptions
      WHERE patient_subscriptions.id = subscription_payments.subscription_id
      AND patient_subscriptions.user_id = auth.uid()
    )
  );

CREATE POLICY "Enable insert for authenticated users"
  ON subscription_payments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM patient_subscriptions
      WHERE patient_subscriptions.id = subscription_payments.subscription_id
      AND patient_subscriptions.user_id = auth.uid()
    )
  );

CREATE POLICY "Enable update for authenticated users"
  ON subscription_payments
  FOR UPDATE
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

CREATE POLICY "Enable delete for authenticated users"
  ON subscription_payments
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM patient_subscriptions
      WHERE patient_subscriptions.id = subscription_payments.subscription_id
      AND patient_subscriptions.user_id = auth.uid()
    )
  );

-- =====================================================
-- PASSO 6: Verificar resultado
-- =====================================================

DO $$
DECLARE
  policy_count INTEGER;
  rls_enabled_count INTEGER;
BEGIN
  -- Contar políticas
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename IN ('user_monthly_plans', 'patient_subscriptions', 'subscription_payments');

  -- Contar tabelas com RLS habilitado
  SELECT COUNT(*) INTO rls_enabled_count
  FROM pg_tables
  WHERE schemaname = 'public'
    AND tablename IN ('user_monthly_plans', 'patient_subscriptions', 'subscription_payments')
    AND rowsecurity = true;

  RAISE NOTICE '';
  RAISE NOTICE '==========================================';
  RAISE NOTICE '✅ POLÍTICAS RLS RECRIADAS COM SUCESSO!';
  RAISE NOTICE '==========================================';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Estatísticas:';
  RAISE NOTICE '  - Políticas criadas: %/12', policy_count;
  RAISE NOTICE '  - Tabelas com RLS: %/3', rls_enabled_count;
  RAISE NOTICE '';

  IF policy_count = 12 AND rls_enabled_count = 3 THEN
    RAISE NOTICE '✅ Tudo correto! As políticas devem funcionar agora.';
  ELSE
    RAISE WARNING '⚠️ Algo está errado. Verifique os logs acima.';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '🔄 PRÓXIMO PASSO:';
  RAISE NOTICE '  1. Faça logout do site';
  RAISE NOTICE '  2. Faça login novamente';
  RAISE NOTICE '  3. Tente criar o plano';
  RAISE NOTICE '';
END $$;

COMMIT;
