-- =====================================================
-- SCRIPT PARA CORRIGIR TABELAS RESTANTES (V3)
-- Executar no SQL Editor do Supabase
-- Data: 2025-12-03
-- =====================================================
-- NOTA: Tabelas com user_id que podem não existir foram
-- movidas para seções comentadas no final
-- =====================================================

-- =====================================================
-- PASSO 1: STOCK (política adicional - apenas DROP)
-- =====================================================

DROP POLICY IF EXISTS "Users can manage their own stock" ON public.stock;

-- =====================================================
-- PASSO 2: USER_PROFILES (políticas adicionais - usa "id")
-- =====================================================

DROP POLICY IF EXISTS "authenticated_insert" ON public.user_profiles;
DROP POLICY IF EXISTS "authenticated_update" ON public.user_profiles;

CREATE POLICY "authenticated_insert" ON public.user_profiles
FOR INSERT WITH CHECK (id = (select auth.uid()));

CREATE POLICY "authenticated_update" ON public.user_profiles
FOR UPDATE USING (id = (select auth.uid())) WITH CHECK (id = (select auth.uid()));

-- =====================================================
-- PASSO 3: PATIENT_REMINDER_SETTINGS (apenas DROP)
-- =====================================================

DROP POLICY IF EXISTS "Users can view own reminder settings" ON public.patient_reminder_settings;
DROP POLICY IF EXISTS "Users can insert own reminder settings" ON public.patient_reminder_settings;
DROP POLICY IF EXISTS "Users can update own reminder settings" ON public.patient_reminder_settings;
DROP POLICY IF EXISTS "Users can delete own reminder settings" ON public.patient_reminder_settings;

-- =====================================================
-- PASSO 4: PATIENT_SUBSCRIPTIONS_BACKUP
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
-- PASSO 6: USER_MONTHLY_PLANS_BACKUP
-- =====================================================

DROP POLICY IF EXISTS "Super admins can view user_monthly_plans_backup" ON public.user_monthly_plans_backup;

CREATE POLICY "Super admins can view user_monthly_plans_backup" ON public.user_monthly_plans_backup
FOR SELECT USING (is_super_admin());

-- =====================================================
-- PASSO 7: COUPON_USAGE
-- =====================================================

DROP POLICY IF EXISTS "admins_read_coupon_usage" ON public.coupon_usage;

CREATE POLICY "admins_read_coupon_usage" ON public.coupon_usage
FOR SELECT USING (is_super_admin());

-- =====================================================
-- PASSO 8: USER_MONTHLY_PLANS
-- =====================================================

DROP POLICY IF EXISTS "monthly_plans_select" ON public.user_monthly_plans;
DROP POLICY IF EXISTS "monthly_plans_insert" ON public.user_monthly_plans;
DROP POLICY IF EXISTS "monthly_plans_update" ON public.user_monthly_plans;
DROP POLICY IF EXISTS "monthly_plans_delete" ON public.user_monthly_plans;

CREATE POLICY "monthly_plans_select" ON public.user_monthly_plans
FOR SELECT USING (user_id = (select auth.uid()) OR is_super_admin());

CREATE POLICY "monthly_plans_insert" ON public.user_monthly_plans
FOR INSERT WITH CHECK (user_id = (select auth.uid()) OR is_super_admin());

CREATE POLICY "monthly_plans_update" ON public.user_monthly_plans
FOR UPDATE USING (user_id = (select auth.uid()) OR is_super_admin()) WITH CHECK (user_id = (select auth.uid()) OR is_super_admin());

CREATE POLICY "monthly_plans_delete" ON public.user_monthly_plans
FOR DELETE USING (user_id = (select auth.uid()) OR is_super_admin());

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================

SELECT 'Políticas RLS V3 otimizadas com sucesso!' as resultado;

-- =====================================================
-- SEÇÕES OPCIONAIS - DESCOMENTE SE AS TABELAS EXISTIREM
-- =====================================================

/*
-- CATEGORIES (descomente se a tabela tiver user_id)
DROP POLICY IF EXISTS "Users can view their own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can insert their own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can update their own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can delete their own categories" ON public.categories;

CREATE POLICY "Users can view their own categories" ON public.categories
FOR SELECT USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert their own categories" ON public.categories
FOR INSERT WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update their own categories" ON public.categories
FOR UPDATE USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete their own categories" ON public.categories
FOR DELETE USING (user_id = (select auth.uid()));
*/

/*
-- WHATSAPP_MESSAGES_LOG (descomente se a tabela tiver user_id)
DROP POLICY IF EXISTS "Users can view own messages" ON public.whatsapp_messages_log;
DROP POLICY IF EXISTS "Users can insert own messages" ON public.whatsapp_messages_log;
DROP POLICY IF EXISTS "Users can update own messages" ON public.whatsapp_messages_log;
DROP POLICY IF EXISTS "Users can delete own messages" ON public.whatsapp_messages_log;

CREATE POLICY "Users can view own messages" ON public.whatsapp_messages_log
FOR SELECT USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own messages" ON public.whatsapp_messages_log
FOR INSERT WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own messages" ON public.whatsapp_messages_log
FOR UPDATE USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own messages" ON public.whatsapp_messages_log
FOR DELETE USING (user_id = (select auth.uid()));
*/

/*
-- COURTESY_USERS (descomente se a tabela tiver user_id)
DROP POLICY IF EXISTS "allow_users_read_own_courtesy" ON public.courtesy_users;

CREATE POLICY "allow_users_read_own_courtesy" ON public.courtesy_users
FOR SELECT USING (user_id = (select auth.uid()));
*/

/*
-- SUPER_ADMINS (descomente se a tabela tiver user_id)
DROP POLICY IF EXISTS "Super admins can view their own data" ON public.super_admins;

CREATE POLICY "Super admins can view their own data" ON public.super_admins
FOR SELECT USING (user_id = (select auth.uid()));
*/

/*
-- STUDENTS (descomente se a tabela tiver user_id)
DROP POLICY IF EXISTS "Users can view own students" ON public.students;
DROP POLICY IF EXISTS "Users can insert own students" ON public.students;
DROP POLICY IF EXISTS "Users can update own students" ON public.students;
DROP POLICY IF EXISTS "Users can delete own students" ON public.students;

CREATE POLICY "Users can view own students" ON public.students
FOR SELECT USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own students" ON public.students
FOR INSERT WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own students" ON public.students
FOR UPDATE USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own students" ON public.students
FOR DELETE USING (user_id = (select auth.uid()));
*/

/*
-- MENTORSHIPS (descomente se a tabela tiver user_id)
DROP POLICY IF EXISTS "Users can view own mentorships" ON public.mentorships;
DROP POLICY IF EXISTS "Users can insert own mentorships" ON public.mentorships;
DROP POLICY IF EXISTS "Users can update own mentorships" ON public.mentorships;
DROP POLICY IF EXISTS "Users can delete own mentorships" ON public.mentorships;

CREATE POLICY "Users can view own mentorships" ON public.mentorships
FOR SELECT USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own mentorships" ON public.mentorships
FOR INSERT WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own mentorships" ON public.mentorships
FOR UPDATE USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own mentorships" ON public.mentorships
FOR DELETE USING (user_id = (select auth.uid()));
*/

/*
-- MEDICAL_PHOTOS (descomente se a tabela tiver user_id)
DROP POLICY IF EXISTS "Users can view own medical_photos" ON public.medical_photos;
DROP POLICY IF EXISTS "Users can insert own medical_photos" ON public.medical_photos;
DROP POLICY IF EXISTS "Users can update own medical_photos" ON public.medical_photos;
DROP POLICY IF EXISTS "Users can delete own medical_photos" ON public.medical_photos;

CREATE POLICY "Users can view own medical_photos" ON public.medical_photos
FOR SELECT USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own medical_photos" ON public.medical_photos
FOR INSERT WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own medical_photos" ON public.medical_photos
FOR UPDATE USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own medical_photos" ON public.medical_photos
FOR DELETE USING (user_id = (select auth.uid()));
*/

/*
-- INFORMED_CONSENTS (descomente se a tabela tiver user_id)
DROP POLICY IF EXISTS "Users can view own informed_consents" ON public.informed_consents;
DROP POLICY IF EXISTS "Users can insert own informed_consents" ON public.informed_consents;
DROP POLICY IF EXISTS "Users can update own informed_consents" ON public.informed_consents;
DROP POLICY IF EXISTS "Users can delete own informed_consents" ON public.informed_consents;

CREATE POLICY "Users can view own informed_consents" ON public.informed_consents
FOR SELECT USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own informed_consents" ON public.informed_consents
FOR INSERT WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own informed_consents" ON public.informed_consents
FOR UPDATE USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own informed_consents" ON public.informed_consents
FOR DELETE USING (user_id = (select auth.uid()));
*/
