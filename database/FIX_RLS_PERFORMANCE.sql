-- =====================================================
-- FIX RLS PERFORMANCE - Otimização de Políticas RLS
-- =====================================================
-- Este script corrige o problema de performance onde auth.uid()
-- é re-avaliado para cada linha. A solução é usar (select auth.uid())
-- para que seja avaliado apenas uma vez por query.
--
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- =====================================================
-- PARTE 1: Tabelas com coluna user_id direta
-- =====================================================

-- notification_preferences
DROP POLICY IF EXISTS "Users can delete their own notification_preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Users can insert their own notification_preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Users can update their own notification_preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Users can view their own notification_preferences" ON public.notification_preferences;

CREATE POLICY "notification_preferences_delete" ON public.notification_preferences
  FOR DELETE TO authenticated USING (user_id = (select auth.uid()));

CREATE POLICY "notification_preferences_insert" ON public.notification_preferences
  FOR INSERT TO authenticated WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "notification_preferences_update" ON public.notification_preferences
  FOR UPDATE TO authenticated USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "notification_preferences_select" ON public.notification_preferences
  FOR SELECT TO authenticated USING (user_id = (select auth.uid()));

-- notification_settings
DROP POLICY IF EXISTS "Users can delete their own notification_settings" ON public.notification_settings;
DROP POLICY IF EXISTS "Users can insert their own notification_settings" ON public.notification_settings;
DROP POLICY IF EXISTS "Users can update their own notification_settings" ON public.notification_settings;
DROP POLICY IF EXISTS "Users can view their own notification_settings" ON public.notification_settings;

CREATE POLICY "notification_settings_delete" ON public.notification_settings
  FOR DELETE TO authenticated USING (user_id = (select auth.uid()));

CREATE POLICY "notification_settings_insert" ON public.notification_settings
  FOR INSERT TO authenticated WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "notification_settings_update" ON public.notification_settings
  FOR UPDATE TO authenticated USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "notification_settings_select" ON public.notification_settings
  FOR SELECT TO authenticated USING (user_id = (select auth.uid()));

-- categories
DROP POLICY IF EXISTS "Users can delete their own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can insert their own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can update their own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can view their own categories" ON public.categories;

CREATE POLICY "Users can delete their own categories" ON public.categories
  FOR DELETE TO authenticated USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert their own categories" ON public.categories
  FOR INSERT TO authenticated WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update their own categories" ON public.categories
  FOR UPDATE TO authenticated USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can view their own categories" ON public.categories
  FOR SELECT TO authenticated USING (user_id = (select auth.uid()));

-- students
DROP POLICY IF EXISTS "Users can delete their own students" ON public.students;
DROP POLICY IF EXISTS "Users can insert their own students" ON public.students;
DROP POLICY IF EXISTS "Users can update their own students" ON public.students;
DROP POLICY IF EXISTS "Users can view their own students" ON public.students;

CREATE POLICY "Users can delete their own students" ON public.students
  FOR DELETE TO authenticated USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert their own students" ON public.students
  FOR INSERT TO authenticated WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update their own students" ON public.students
  FOR UPDATE TO authenticated USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can view their own students" ON public.students
  FOR SELECT TO authenticated USING (user_id = (select auth.uid()));

-- patient_subscriptions
DROP POLICY IF EXISTS "Users can delete their own patient_subscriptions" ON public.patient_subscriptions;
DROP POLICY IF EXISTS "Users can insert their own patient_subscriptions" ON public.patient_subscriptions;
DROP POLICY IF EXISTS "Users can update their own patient_subscriptions" ON public.patient_subscriptions;
DROP POLICY IF EXISTS "Users can view their own patient_subscriptions" ON public.patient_subscriptions;
DROP POLICY IF EXISTS "Usuários podem ver suas próprias assinaturas" ON public.patient_subscriptions;
DROP POLICY IF EXISTS "Usuários podem criar suas próprias assinaturas" ON public.patient_subscriptions;
DROP POLICY IF EXISTS "Usuários podem atualizar suas próprias assinaturas" ON public.patient_subscriptions;
DROP POLICY IF EXISTS "Usuários podem deletar suas próprias assinaturas" ON public.patient_subscriptions;

CREATE POLICY "patient_subscriptions_select" ON public.patient_subscriptions
  FOR SELECT TO authenticated USING (user_id = (select auth.uid()));

CREATE POLICY "patient_subscriptions_insert" ON public.patient_subscriptions
  FOR INSERT TO authenticated WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "patient_subscriptions_update" ON public.patient_subscriptions
  FOR UPDATE TO authenticated USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "patient_subscriptions_delete" ON public.patient_subscriptions
  FOR DELETE TO authenticated USING (user_id = (select auth.uid()));

-- courses
DROP POLICY IF EXISTS "Users can delete their own courses" ON public.courses;
DROP POLICY IF EXISTS "Users can insert their own courses" ON public.courses;
DROP POLICY IF EXISTS "Users can update their own courses" ON public.courses;
DROP POLICY IF EXISTS "Users can view their own courses" ON public.courses;

CREATE POLICY "Users can delete their own courses" ON public.courses
  FOR DELETE TO authenticated USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert their own courses" ON public.courses
  FOR INSERT TO authenticated WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update their own courses" ON public.courses
  FOR UPDATE TO authenticated USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can view their own courses" ON public.courses
  FOR SELECT TO authenticated USING (user_id = (select auth.uid()));

-- enrollments
DROP POLICY IF EXISTS "Users can delete their own enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Users can insert their own enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Users can update their own enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Users can view their own enrollments" ON public.enrollments;

CREATE POLICY "Users can delete their own enrollments" ON public.enrollments
  FOR DELETE TO authenticated USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert their own enrollments" ON public.enrollments
  FOR INSERT TO authenticated WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update their own enrollments" ON public.enrollments
  FOR UPDATE TO authenticated USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can view their own enrollments" ON public.enrollments
  FOR SELECT TO authenticated USING (user_id = (select auth.uid()));

-- =====================================================
-- PARTE 2: Tabela subscription_payments (usa subquery)
-- =====================================================
-- Esta tabela não tem user_id direto, usa JOIN com patient_subscriptions

DROP POLICY IF EXISTS "Users can delete their own subscription_payments" ON public.subscription_payments;
DROP POLICY IF EXISTS "Users can insert their own subscription_payments" ON public.subscription_payments;
DROP POLICY IF EXISTS "Users can update their own subscription_payments" ON public.subscription_payments;
DROP POLICY IF EXISTS "Users can view their own subscription_payments" ON public.subscription_payments;
DROP POLICY IF EXISTS "Usuários podem ver seus próprios pagamentos" ON public.subscription_payments;
DROP POLICY IF EXISTS "Usuários podem criar seus próprios pagamentos" ON public.subscription_payments;
DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios pagamentos" ON public.subscription_payments;
DROP POLICY IF EXISTS "Usuários podem deletar seus próprios pagamentos" ON public.subscription_payments;

CREATE POLICY "subscription_payments_select" ON public.subscription_payments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM patient_subscriptions ps
      WHERE ps.id = subscription_payments.subscription_id
      AND ps.user_id = (select auth.uid())
    )
  );

CREATE POLICY "subscription_payments_insert" ON public.subscription_payments
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM patient_subscriptions ps
      WHERE ps.id = subscription_payments.subscription_id
      AND ps.user_id = (select auth.uid())
    )
  );

CREATE POLICY "subscription_payments_update" ON public.subscription_payments
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM patient_subscriptions ps
      WHERE ps.id = subscription_payments.subscription_id
      AND ps.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM patient_subscriptions ps
      WHERE ps.id = subscription_payments.subscription_id
      AND ps.user_id = (select auth.uid())
    )
  );

CREATE POLICY "subscription_payments_delete" ON public.subscription_payments
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM patient_subscriptions ps
      WHERE ps.id = subscription_payments.subscription_id
      AND ps.user_id = (select auth.uid())
    )
  );

-- =====================================================
-- PARTE 3: Remover políticas duplicadas em user_monthly_plans
-- =====================================================
-- A tabela user_monthly_plans tem políticas duplicadas (monthly_plans_* e Users can *)
-- Vamos manter apenas uma versão otimizada

DROP POLICY IF EXISTS "Users can delete their own user_monthly_plans" ON public.user_monthly_plans;
DROP POLICY IF EXISTS "Users can insert their own user_monthly_plans" ON public.user_monthly_plans;
DROP POLICY IF EXISTS "Users can update their own user_monthly_plans" ON public.user_monthly_plans;
DROP POLICY IF EXISTS "Users can view their own user_monthly_plans" ON public.user_monthly_plans;
DROP POLICY IF EXISTS "monthly_plans_delete" ON public.user_monthly_plans;
DROP POLICY IF EXISTS "monthly_plans_insert" ON public.user_monthly_plans;
DROP POLICY IF EXISTS "monthly_plans_update" ON public.user_monthly_plans;
DROP POLICY IF EXISTS "monthly_plans_select" ON public.user_monthly_plans;
DROP POLICY IF EXISTS "Usuários podem ver seus próprios planos de mensalidade" ON public.user_monthly_plans;
DROP POLICY IF EXISTS "Usuários podem criar seus próprios planos de mensalidade" ON public.user_monthly_plans;
DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios planos de mensalidade" ON public.user_monthly_plans;
DROP POLICY IF EXISTS "Usuários podem deletar seus próprios planos de mensalidade" ON public.user_monthly_plans;

-- Criar apenas uma política otimizada para cada ação
CREATE POLICY "monthly_plans_select" ON public.user_monthly_plans
  FOR SELECT TO authenticated USING (user_id = (select auth.uid()));

CREATE POLICY "monthly_plans_insert" ON public.user_monthly_plans
  FOR INSERT TO authenticated WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "monthly_plans_update" ON public.user_monthly_plans
  FOR UPDATE TO authenticated USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "monthly_plans_delete" ON public.user_monthly_plans
  FOR DELETE TO authenticated USING (user_id = (select auth.uid()));

-- =====================================================
-- PARTE 4: Remover políticas duplicadas em mentorships
-- =====================================================

DROP POLICY IF EXISTS "Users can delete their own mentorships" ON public.mentorships;
DROP POLICY IF EXISTS "Users can insert their own mentorships" ON public.mentorships;
DROP POLICY IF EXISTS "Users can update their own mentorships" ON public.mentorships;
DROP POLICY IF EXISTS "Users can view their own mentorships" ON public.mentorships;
DROP POLICY IF EXISTS "mentorships_delete" ON public.mentorships;
DROP POLICY IF EXISTS "mentorships_insert" ON public.mentorships;
DROP POLICY IF EXISTS "mentorships_update" ON public.mentorships;
DROP POLICY IF EXISTS "mentorships_select" ON public.mentorships;

-- Criar apenas uma política otimizada para cada ação
CREATE POLICY "mentorships_select" ON public.mentorships
  FOR SELECT TO authenticated USING (user_id = (select auth.uid()));

CREATE POLICY "mentorships_insert" ON public.mentorships
  FOR INSERT TO authenticated WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "mentorships_update" ON public.mentorships
  FOR UPDATE TO authenticated USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "mentorships_delete" ON public.mentorships
  FOR DELETE TO authenticated USING (user_id = (select auth.uid()));

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================
-- Execute esta query para verificar as políticas criadas:
--
-- SELECT schemaname, tablename, policyname, cmd, qual
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, cmd;
