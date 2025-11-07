-- =====================================================
-- FIX RLS FINAL - Resolver conflito de políticas
-- =====================================================
-- Problema: Existem políticas duplicadas (português + inglês)
-- Solução: Remover TODAS e criar apenas as corretas
-- =====================================================

BEGIN;

-- =====================================================
-- PASSO 1: Remover ABSOLUTAMENTE TODAS as políticas
-- =====================================================

-- user_monthly_plans
DROP POLICY IF EXISTS "Usuários podem ver seus próprios planos de mensalidade" ON user_monthly_plans;
DROP POLICY IF EXISTS "Usuários podem criar seus próprios planos de mensalidade" ON user_monthly_plans;
DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios planos de mensalidade" ON user_monthly_plans;
DROP POLICY IF EXISTS "Usuários podem deletar seus próprios planos de mensalidade" ON user_monthly_plans;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON user_monthly_plans;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON user_monthly_plans;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON user_monthly_plans;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON user_monthly_plans;
DROP POLICY IF EXISTS "user_monthly_plans_select_policy" ON user_monthly_plans;
DROP POLICY IF EXISTS "user_monthly_plans_insert_policy" ON user_monthly_plans;
DROP POLICY IF EXISTS "user_monthly_plans_update_policy" ON user_monthly_plans;
DROP POLICY IF EXISTS "user_monthly_plans_delete_policy" ON user_monthly_plans;

-- patient_subscriptions
DROP POLICY IF EXISTS "Usuários podem ver suas próprias assinaturas" ON patient_subscriptions;
DROP POLICY IF EXISTS "Usuários podem criar suas próprias assinaturas" ON patient_subscriptions;
DROP POLICY IF EXISTS "Usuários podem atualizar suas próprias assinaturas" ON patient_subscriptions;
DROP POLICY IF EXISTS "Usuários podem deletar suas próprias assinaturas" ON patient_subscriptions;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON patient_subscriptions;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON patient_subscriptions;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON patient_subscriptions;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON patient_subscriptions;
DROP POLICY IF EXISTS "patient_subscriptions_select_policy" ON patient_subscriptions;
DROP POLICY IF EXISTS "patient_subscriptions_insert_policy" ON patient_subscriptions;
DROP POLICY IF EXISTS "patient_subscriptions_update_policy" ON patient_subscriptions;
DROP POLICY IF EXISTS "patient_subscriptions_delete_policy" ON patient_subscriptions;

-- subscription_payments
DROP POLICY IF EXISTS "Usuários podem ver seus próprios pagamentos" ON subscription_payments;
DROP POLICY IF EXISTS "Usuários podem criar seus próprios pagamentos" ON subscription_payments;
DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios pagamentos" ON subscription_payments;
DROP POLICY IF EXISTS "Usuários podem deletar seus próprios pagamentos" ON subscription_payments;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON subscription_payments;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON subscription_payments;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON subscription_payments;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON subscription_payments;
DROP POLICY IF EXISTS "subscription_payments_select_policy" ON subscription_payments;
DROP POLICY IF EXISTS "subscription_payments_insert_policy" ON subscription_payments;
DROP POLICY IF EXISTS "subscription_payments_update_policy" ON subscription_payments;
DROP POLICY IF EXISTS "subscription_payments_delete_policy" ON subscription_payments;

-- =====================================================
-- PASSO 2: Verificar que não há mais políticas
-- =====================================================

DO $$
DECLARE
  remaining_policies INTEGER;
BEGIN
  SELECT COUNT(*) INTO remaining_policies
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename IN ('user_monthly_plans', 'patient_subscriptions', 'subscription_payments');

  IF remaining_policies > 0 THEN
    RAISE WARNING 'Ainda existem % políticas! Removendo manualmente...', remaining_policies;

    -- Força remoção de qualquer política restante
    EXECUTE (
      SELECT string_agg(format('DROP POLICY IF EXISTS %I ON %I', policyname, tablename), '; ')
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename IN ('user_monthly_plans', 'patient_subscriptions', 'subscription_payments')
    );
  END IF;
END $$;

-- =====================================================
-- PASSO 3: Desabilitar e reabilitar RLS
-- =====================================================

ALTER TABLE user_monthly_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE patient_subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_payments DISABLE ROW LEVEL SECURITY;

ALTER TABLE user_monthly_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_payments ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PASSO 4: Criar políticas CORRETAS (nomes simples)
-- =====================================================

-- user_monthly_plans
CREATE POLICY "monthly_plans_select"
  ON user_monthly_plans FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "monthly_plans_insert"
  ON user_monthly_plans FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "monthly_plans_update"
  ON user_monthly_plans FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "monthly_plans_delete"
  ON user_monthly_plans FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- patient_subscriptions
CREATE POLICY "patient_subs_select"
  ON patient_subscriptions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "patient_subs_insert"
  ON patient_subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "patient_subs_update"
  ON patient_subscriptions FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "patient_subs_delete"
  ON patient_subscriptions FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- subscription_payments
CREATE POLICY "sub_payments_select"
  ON subscription_payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM patient_subscriptions
      WHERE patient_subscriptions.id = subscription_payments.subscription_id
      AND patient_subscriptions.user_id = auth.uid()
    )
  );

CREATE POLICY "sub_payments_insert"
  ON subscription_payments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM patient_subscriptions
      WHERE patient_subscriptions.id = subscription_payments.subscription_id
      AND patient_subscriptions.user_id = auth.uid()
    )
  );

CREATE POLICY "sub_payments_update"
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

CREATE POLICY "sub_payments_delete"
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
-- PASSO 5: Verificar resultado
-- =====================================================

DO $$
DECLARE
  policy_count INTEGER;
  rls_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename IN ('user_monthly_plans', 'patient_subscriptions', 'subscription_payments');

  SELECT COUNT(*) INTO rls_count
  FROM pg_tables
  WHERE schemaname = 'public'
    AND tablename IN ('user_monthly_plans', 'patient_subscriptions', 'subscription_payments')
    AND rowsecurity = true;

  RAISE NOTICE '';
  RAISE NOTICE '==========================================';
  RAISE NOTICE '✅ RLS CONFIGURADO COM SUCESSO!';
  RAISE NOTICE '==========================================';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Status:';
  RAISE NOTICE '  - Políticas criadas: %/12', policy_count;
  RAISE NOTICE '  - Tabelas com RLS: %/3', rls_count;
  RAISE NOTICE '';

  IF policy_count = 12 AND rls_count = 3 THEN
    RAISE NOTICE '✅ PERFEITO! Tudo funcionando.';
    RAISE NOTICE '';
    RAISE NOTICE '🔄 PRÓXIMOS PASSOS:';
    RAISE NOTICE '  1. Limpe o cache do navegador (Ctrl+Shift+Del)';
    RAISE NOTICE '  2. OU use uma aba anônima';
    RAISE NOTICE '  3. Faça login novamente';
    RAISE NOTICE '  4. Tente criar o plano';
    RAISE NOTICE '';
    RAISE NOTICE '💡 Se ainda não funcionar, o problema pode ser:';
    RAISE NOTICE '  - Cache do navegador';
    RAISE NOTICE '  - Token JWT antigo no localStorage';
    RAISE NOTICE '  - Problema com auth.uid() no Supabase';
  ELSE
    RAISE WARNING '⚠️ ERRO: Contagem incorreta!';
    RAISE WARNING '  Esperado: 12 policies e 3 tabelas com RLS';
    RAISE WARNING '  Encontrado: % policies e % tabelas', policy_count, rls_count;
  END IF;
END $$;

COMMIT;
