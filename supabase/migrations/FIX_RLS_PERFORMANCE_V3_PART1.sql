-- =====================================================
-- SCRIPT V3 - PARTE 1: Tabelas seguras (apenas DROP ou id-based)
-- Executar no SQL Editor do Supabase
-- Data: 2025-12-03
-- =====================================================

-- =====================================================
-- PASSO 1: STOCK (política adicional - apenas DROP)
-- =====================================================

DROP POLICY IF EXISTS "Users can manage their own stock" ON public.stock;

-- =====================================================
-- PASSO 2: USER_PROFILES (políticas adicionais - usa "id" não "user_id")
-- =====================================================

DROP POLICY IF EXISTS "authenticated_insert" ON public.user_profiles;
DROP POLICY IF EXISTS "authenticated_update" ON public.user_profiles;

CREATE POLICY "authenticated_insert" ON public.user_profiles
FOR INSERT WITH CHECK (id = (select auth.uid()));

CREATE POLICY "authenticated_update" ON public.user_profiles
FOR UPDATE USING (id = (select auth.uid())) WITH CHECK (id = (select auth.uid()));

-- =====================================================
-- PASSO 3: PATIENT_REMINDER_SETTINGS (apenas DROP políticas antigas)
-- =====================================================

DROP POLICY IF EXISTS "Users can view own reminder settings" ON public.patient_reminder_settings;
DROP POLICY IF EXISTS "Users can insert own reminder settings" ON public.patient_reminder_settings;
DROP POLICY IF EXISTS "Users can update own reminder settings" ON public.patient_reminder_settings;
DROP POLICY IF EXISTS "Users can delete own reminder settings" ON public.patient_reminder_settings;

-- =====================================================
-- PASSO 4: PATIENT_SUBSCRIPTIONS_BACKUP (usa is_super_admin)
-- =====================================================

DROP POLICY IF EXISTS "Super admins can view patient_subscriptions_backup" ON public.patient_subscriptions_backup;

CREATE POLICY "Super admins can view patient_subscriptions_backup" ON public.patient_subscriptions_backup
FOR SELECT USING (is_super_admin());

-- =====================================================
-- PASSO 5: DISCOUNT_COUPONS (política adicional)
-- =====================================================

DROP POLICY IF EXISTS "Authenticated users can view active coupons" ON public.discount_coupons;

CREATE POLICY "Authenticated users can view active coupons" ON public.discount_coupons
FOR SELECT USING (is_active = true AND (select auth.uid()) IS NOT NULL);

-- =====================================================
-- PASSO 6: USER_MONTHLY_PLANS_BACKUP (usa is_super_admin)
-- =====================================================

DROP POLICY IF EXISTS "Super admins can view user_monthly_plans_backup" ON public.user_monthly_plans_backup;

CREATE POLICY "Super admins can view user_monthly_plans_backup" ON public.user_monthly_plans_backup
FOR SELECT USING (is_super_admin());

-- =====================================================
-- PASSO 7: COUPON_USAGE (usa is_super_admin)
-- =====================================================

DROP POLICY IF EXISTS "admins_read_coupon_usage" ON public.coupon_usage;

CREATE POLICY "admins_read_coupon_usage" ON public.coupon_usage
FOR SELECT USING (is_super_admin());

-- =====================================================
-- VERIFICAÇÃO PARTE 1
-- =====================================================

SELECT 'Parte 1 executada com sucesso!' as resultado;
