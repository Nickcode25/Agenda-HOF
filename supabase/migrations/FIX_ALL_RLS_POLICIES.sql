-- =====================================================
-- SCRIPT PARA CORRIGIR RLS DE TODAS AS TABELAS
-- Executar no SQL Editor do Supabase
-- Data: 2025-12-03
-- =====================================================
-- Este script corrige as políticas RLS para:
-- - students (alunos)
-- - courses (cursos)
-- - user_monthly_plans (planos de mensalidade)
-- - patient_subscriptions (assinaturas)
-- - subscription_payments (pagamentos)
-- - notification_preferences
-- - notification_settings
-- =====================================================

-- =====================================================
-- STUDENTS (ALUNOS)
-- =====================================================

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own students" ON public.students;
DROP POLICY IF EXISTS "Users can insert their own students" ON public.students;
DROP POLICY IF EXISTS "Users can update their own students" ON public.students;
DROP POLICY IF EXISTS "Users can delete their own students" ON public.students;
DROP POLICY IF EXISTS "Users can view students from their clinic" ON public.students;

CREATE POLICY "Users can view their own students"
ON public.students
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own students"
ON public.students
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own students"
ON public.students
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own students"
ON public.students
FOR DELETE
USING (user_id = auth.uid());

-- =====================================================
-- COURSES (CURSOS)
-- =====================================================

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own courses" ON public.courses;
DROP POLICY IF EXISTS "Users can insert their own courses" ON public.courses;
DROP POLICY IF EXISTS "Users can update their own courses" ON public.courses;
DROP POLICY IF EXISTS "Users can delete their own courses" ON public.courses;
DROP POLICY IF EXISTS "Users can view courses from their clinic" ON public.courses;

CREATE POLICY "Users can view their own courses"
ON public.courses
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own courses"
ON public.courses
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own courses"
ON public.courses
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own courses"
ON public.courses
FOR DELETE
USING (user_id = auth.uid());

-- =====================================================
-- USER_MONTHLY_PLANS (PLANOS DE MENSALIDADE)
-- =====================================================

ALTER TABLE public.user_monthly_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own user_monthly_plans" ON public.user_monthly_plans;
DROP POLICY IF EXISTS "Users can insert their own user_monthly_plans" ON public.user_monthly_plans;
DROP POLICY IF EXISTS "Users can update their own user_monthly_plans" ON public.user_monthly_plans;
DROP POLICY IF EXISTS "Users can delete their own user_monthly_plans" ON public.user_monthly_plans;
DROP POLICY IF EXISTS "Users can view user_monthly_plans from their clinic" ON public.user_monthly_plans;

CREATE POLICY "Users can view their own user_monthly_plans"
ON public.user_monthly_plans
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own user_monthly_plans"
ON public.user_monthly_plans
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own user_monthly_plans"
ON public.user_monthly_plans
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own user_monthly_plans"
ON public.user_monthly_plans
FOR DELETE
USING (user_id = auth.uid());

-- =====================================================
-- PATIENT_SUBSCRIPTIONS (ASSINATURAS)
-- =====================================================

ALTER TABLE public.patient_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own patient_subscriptions" ON public.patient_subscriptions;
DROP POLICY IF EXISTS "Users can insert their own patient_subscriptions" ON public.patient_subscriptions;
DROP POLICY IF EXISTS "Users can update their own patient_subscriptions" ON public.patient_subscriptions;
DROP POLICY IF EXISTS "Users can delete their own patient_subscriptions" ON public.patient_subscriptions;
DROP POLICY IF EXISTS "Users can view patient_subscriptions from their clinic" ON public.patient_subscriptions;

CREATE POLICY "Users can view their own patient_subscriptions"
ON public.patient_subscriptions
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own patient_subscriptions"
ON public.patient_subscriptions
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own patient_subscriptions"
ON public.patient_subscriptions
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own patient_subscriptions"
ON public.patient_subscriptions
FOR DELETE
USING (user_id = auth.uid());

-- =====================================================
-- SUBSCRIPTION_PAYMENTS (PAGAMENTOS DE ASSINATURA)
-- =====================================================

ALTER TABLE public.subscription_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own subscription_payments" ON public.subscription_payments;
DROP POLICY IF EXISTS "Users can insert their own subscription_payments" ON public.subscription_payments;
DROP POLICY IF EXISTS "Users can update their own subscription_payments" ON public.subscription_payments;
DROP POLICY IF EXISTS "Users can delete their own subscription_payments" ON public.subscription_payments;
DROP POLICY IF EXISTS "Users can view subscription_payments from their clinic" ON public.subscription_payments;

-- Para subscription_payments, precisamos verificar através da assinatura
CREATE POLICY "Users can view their own subscription_payments"
ON public.subscription_payments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.patient_subscriptions ps
    WHERE ps.id = subscription_payments.subscription_id
    AND ps.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their own subscription_payments"
ON public.subscription_payments
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.patient_subscriptions ps
    WHERE ps.id = subscription_payments.subscription_id
    AND ps.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own subscription_payments"
ON public.subscription_payments
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.patient_subscriptions ps
    WHERE ps.id = subscription_payments.subscription_id
    AND ps.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own subscription_payments"
ON public.subscription_payments
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.patient_subscriptions ps
    WHERE ps.id = subscription_payments.subscription_id
    AND ps.user_id = auth.uid()
  )
);

-- =====================================================
-- NOTIFICATION_PREFERENCES
-- =====================================================

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own notification_preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Users can insert their own notification_preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Users can update their own notification_preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Users can delete their own notification_preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Users can view notification_preferences from their clinic" ON public.notification_preferences;

CREATE POLICY "Users can view their own notification_preferences"
ON public.notification_preferences
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own notification_preferences"
ON public.notification_preferences
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own notification_preferences"
ON public.notification_preferences
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own notification_preferences"
ON public.notification_preferences
FOR DELETE
USING (user_id = auth.uid());

-- =====================================================
-- NOTIFICATION_SETTINGS
-- =====================================================

ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own notification_settings" ON public.notification_settings;
DROP POLICY IF EXISTS "Users can insert their own notification_settings" ON public.notification_settings;
DROP POLICY IF EXISTS "Users can update their own notification_settings" ON public.notification_settings;
DROP POLICY IF EXISTS "Users can delete their own notification_settings" ON public.notification_settings;
DROP POLICY IF EXISTS "Users can view notification_settings from their clinic" ON public.notification_settings;

CREATE POLICY "Users can view their own notification_settings"
ON public.notification_settings
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own notification_settings"
ON public.notification_settings
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own notification_settings"
ON public.notification_settings
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own notification_settings"
ON public.notification_settings
FOR DELETE
USING (user_id = auth.uid());

-- =====================================================
-- ENROLLMENTS (MATRÍCULAS)
-- =====================================================

ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Users can insert their own enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Users can update their own enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Users can delete their own enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Users can view enrollments from their clinic" ON public.enrollments;

CREATE POLICY "Users can view their own enrollments"
ON public.enrollments
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own enrollments"
ON public.enrollments
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own enrollments"
ON public.enrollments
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own enrollments"
ON public.enrollments
FOR DELETE
USING (user_id = auth.uid());

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

SELECT
    tablename,
    COUNT(*) as total_policies
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN (
    'students',
    'courses',
    'user_monthly_plans',
    'patient_subscriptions',
    'subscription_payments',
    'notification_preferences',
    'notification_settings',
    'enrollments'
)
GROUP BY tablename
ORDER BY tablename;
