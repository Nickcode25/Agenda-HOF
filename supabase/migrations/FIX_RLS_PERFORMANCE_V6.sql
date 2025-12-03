-- =====================================================
-- SCRIPT V6 - APENAS DROP de políticas problemáticas
-- Executar no SQL Editor do Supabase
-- Data: 2025-12-03
-- =====================================================

-- =====================================================
-- PARTE 1: DROP POLÍTICAS ANTIGAS (auth_rls_initplan)
-- =====================================================

-- PATIENT_SUBSCRIPTIONS
DROP POLICY IF EXISTS "patient_subs_delete" ON public.patient_subscriptions;
DROP POLICY IF EXISTS "patient_subs_insert" ON public.patient_subscriptions;
DROP POLICY IF EXISTS "patient_subs_select" ON public.patient_subscriptions;
DROP POLICY IF EXISTS "patient_subs_update" ON public.patient_subscriptions;

-- SUBSCRIPTION_PAYMENTS
DROP POLICY IF EXISTS "sub_payments_delete" ON public.subscription_payments;
DROP POLICY IF EXISTS "sub_payments_insert" ON public.subscription_payments;
DROP POLICY IF EXISTS "sub_payments_select" ON public.subscription_payments;
DROP POLICY IF EXISTS "sub_payments_update" ON public.subscription_payments;

-- COURSES
DROP POLICY IF EXISTS "Users can view own courses" ON public.courses;
DROP POLICY IF EXISTS "Users can insert own courses" ON public.courses;
DROP POLICY IF EXISTS "Users can update own courses" ON public.courses;
DROP POLICY IF EXISTS "Users can delete own courses" ON public.courses;

-- ENROLLMENTS
DROP POLICY IF EXISTS "Users can view own enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Users can insert own enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Users can update own enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Users can delete own enrollments" ON public.enrollments;

-- =====================================================
-- PARTE 2: DROP POLÍTICAS DUPLICADAS - DISCOUNT_COUPONS
-- =====================================================

DROP POLICY IF EXISTS "Super admin can delete coupons" ON public.discount_coupons;
DROP POLICY IF EXISTS "Super admin can create coupons" ON public.discount_coupons;
DROP POLICY IF EXISTS "Super admin can view all coupons" ON public.discount_coupons;
DROP POLICY IF EXISTS "Super admin can update coupons" ON public.discount_coupons;
DROP POLICY IF EXISTS "Authenticated users can view active coupons" ON public.discount_coupons;
DROP POLICY IF EXISTS "allow_anon_read_active_coupons" ON public.discount_coupons;
DROP POLICY IF EXISTS "authenticated_read_active_coupons" ON public.discount_coupons;

-- =====================================================
-- PARTE 3: DROP POLÍTICAS DUPLICADAS - USER_PROFILES
-- =====================================================

DROP POLICY IF EXISTS "authenticated_insert" ON public.user_profiles;
DROP POLICY IF EXISTS "authenticated_update" ON public.user_profiles;

-- =====================================================
-- PARTE 4: DROP POLÍTICAS DUPLICADAS - USER_SUBSCRIPTIONS
-- =====================================================

DROP POLICY IF EXISTS "Super admin can delete all subscriptions" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Super admin can view all subscriptions" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Super admin can update all subscriptions" ON public.user_subscriptions;
DROP POLICY IF EXISTS "users_insert_own" ON public.user_subscriptions;
DROP POLICY IF EXISTS "users_select_own" ON public.user_subscriptions;
DROP POLICY IF EXISTS "users_update_own" ON public.user_subscriptions;

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================

SELECT 'Políticas V6 removidas com sucesso!' as resultado;
