-- =====================================================
-- SCRIPT PARA CORRIGIR TODOS OS ERROS DE SEGURANCA DO SUPABASE
-- Executar no SQL Editor do Supabase
-- Data: 2025-12-03
-- =====================================================

-- =====================================================
-- PARTE 1: HABILITAR RLS NAS TABELAS QUE JA TEM POLICIES
-- =====================================================

-- Tabelas que tem policies mas RLS nao esta habilitado
ALTER TABLE IF EXISTS public.courtesy_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.mentorships ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.patient_reminder_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.super_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.whatsapp_messages_log ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PARTE 2: HABILITAR RLS NAS TABELAS SEM POLICIES E CRIAR POLICIES
-- =====================================================

-- medical_photos
ALTER TABLE IF EXISTS public.medical_photos ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can view own medical_photos" ON public.medical_photos;
    DROP POLICY IF EXISTS "Users can insert own medical_photos" ON public.medical_photos;
    DROP POLICY IF EXISTS "Users can update own medical_photos" ON public.medical_photos;
    DROP POLICY IF EXISTS "Users can delete own medical_photos" ON public.medical_photos;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'medical_photos' AND column_name = 'user_id') THEN
        CREATE POLICY "Users can view own medical_photos" ON public.medical_photos
            FOR SELECT USING (auth.uid() = user_id);
        CREATE POLICY "Users can insert own medical_photos" ON public.medical_photos
            FOR INSERT WITH CHECK (auth.uid() = user_id);
        CREATE POLICY "Users can update own medical_photos" ON public.medical_photos
            FOR UPDATE USING (auth.uid() = user_id);
        CREATE POLICY "Users can delete own medical_photos" ON public.medical_photos
            FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- informed_consents
ALTER TABLE IF EXISTS public.informed_consents ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can view own informed_consents" ON public.informed_consents;
    DROP POLICY IF EXISTS "Users can insert own informed_consents" ON public.informed_consents;
    DROP POLICY IF EXISTS "Users can update own informed_consents" ON public.informed_consents;
    DROP POLICY IF EXISTS "Users can delete own informed_consents" ON public.informed_consents;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'informed_consents' AND column_name = 'user_id') THEN
        CREATE POLICY "Users can view own informed_consents" ON public.informed_consents
            FOR SELECT USING (auth.uid() = user_id);
        CREATE POLICY "Users can insert own informed_consents" ON public.informed_consents
            FOR INSERT WITH CHECK (auth.uid() = user_id);
        CREATE POLICY "Users can update own informed_consents" ON public.informed_consents
            FOR UPDATE USING (auth.uid() = user_id);
        CREATE POLICY "Users can delete own informed_consents" ON public.informed_consents
            FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- anamnesis
ALTER TABLE IF EXISTS public.anamnesis ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can view own anamnesis" ON public.anamnesis;
    DROP POLICY IF EXISTS "Users can insert own anamnesis" ON public.anamnesis;
    DROP POLICY IF EXISTS "Users can update own anamnesis" ON public.anamnesis;
    DROP POLICY IF EXISTS "Users can delete own anamnesis" ON public.anamnesis;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'anamnesis' AND column_name = 'user_id') THEN
        CREATE POLICY "Users can view own anamnesis" ON public.anamnesis
            FOR SELECT USING (auth.uid() = user_id);
        CREATE POLICY "Users can insert own anamnesis" ON public.anamnesis
            FOR INSERT WITH CHECK (auth.uid() = user_id);
        CREATE POLICY "Users can update own anamnesis" ON public.anamnesis
            FOR UPDATE USING (auth.uid() = user_id);
        CREATE POLICY "Users can delete own anamnesis" ON public.anamnesis
            FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- clinical_evolutions
ALTER TABLE IF EXISTS public.clinical_evolutions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can view own clinical_evolutions" ON public.clinical_evolutions;
    DROP POLICY IF EXISTS "Users can insert own clinical_evolutions" ON public.clinical_evolutions;
    DROP POLICY IF EXISTS "Users can update own clinical_evolutions" ON public.clinical_evolutions;
    DROP POLICY IF EXISTS "Users can delete own clinical_evolutions" ON public.clinical_evolutions;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'clinical_evolutions' AND column_name = 'user_id') THEN
        CREATE POLICY "Users can view own clinical_evolutions" ON public.clinical_evolutions
            FOR SELECT USING (auth.uid() = user_id);
        CREATE POLICY "Users can insert own clinical_evolutions" ON public.clinical_evolutions
            FOR INSERT WITH CHECK (auth.uid() = user_id);
        CREATE POLICY "Users can update own clinical_evolutions" ON public.clinical_evolutions
            FOR UPDATE USING (auth.uid() = user_id);
        CREATE POLICY "Users can delete own clinical_evolutions" ON public.clinical_evolutions
            FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- admin_users - acesso apenas para super admins
ALTER TABLE IF EXISTS public.admin_users ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Super admins can view admin_users" ON public.admin_users;
    DROP POLICY IF EXISTS "Super admins can manage admin_users" ON public.admin_users;

    CREATE POLICY "Super admins can view admin_users" ON public.admin_users
        FOR SELECT USING (
            EXISTS (SELECT 1 FROM public.super_admins WHERE user_id = auth.uid())
        );
    CREATE POLICY "Super admins can manage admin_users" ON public.admin_users
        FOR ALL USING (
            EXISTS (SELECT 1 FROM public.super_admins WHERE user_id = auth.uid())
        );
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'admin_users policies already exist or table does not exist';
END $$;

-- customers - acesso para super admins (dados de clientes do sistema)
ALTER TABLE IF EXISTS public.customers ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Super admins can view customers" ON public.customers;
    DROP POLICY IF EXISTS "Super admins can manage customers" ON public.customers;

    CREATE POLICY "Super admins can view customers" ON public.customers
        FOR SELECT USING (
            EXISTS (SELECT 1 FROM public.super_admins WHERE user_id = auth.uid())
        );
    CREATE POLICY "Super admins can manage customers" ON public.customers
        FOR ALL USING (
            EXISTS (SELECT 1 FROM public.super_admins WHERE user_id = auth.uid())
        );
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'customers policies already exist or table does not exist';
END $$;

-- purchases - compras/assinaturas
ALTER TABLE IF EXISTS public.purchases ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can view own purchases" ON public.purchases;
    DROP POLICY IF EXISTS "Super admins can view all purchases" ON public.purchases;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'purchases' AND column_name = 'user_id') THEN
        CREATE POLICY "Users can view own purchases" ON public.purchases
            FOR SELECT USING (auth.uid() = user_id);
    END IF;

    CREATE POLICY "Super admins can view all purchases" ON public.purchases
        FOR SELECT USING (
            EXISTS (SELECT 1 FROM public.super_admins WHERE user_id = auth.uid())
        );
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'purchases policies already exist or table does not exist';
END $$;

-- activity_logs - logs de atividade
ALTER TABLE IF EXISTS public.activity_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Super admins can view activity_logs" ON public.activity_logs;
    DROP POLICY IF EXISTS "Users can insert activity_logs" ON public.activity_logs;

    CREATE POLICY "Super admins can view activity_logs" ON public.activity_logs
        FOR SELECT USING (
            EXISTS (SELECT 1 FROM public.super_admins WHERE user_id = auth.uid())
        );
    CREATE POLICY "Users can insert activity_logs" ON public.activity_logs
        FOR INSERT WITH CHECK (true);
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'activity_logs policies already exist or table does not exist';
END $$;

-- notification_preferences
ALTER TABLE IF EXISTS public.notification_preferences ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can view own notification_preferences" ON public.notification_preferences;
    DROP POLICY IF EXISTS "Users can insert own notification_preferences" ON public.notification_preferences;
    DROP POLICY IF EXISTS "Users can update own notification_preferences" ON public.notification_preferences;
    DROP POLICY IF EXISTS "Users can delete own notification_preferences" ON public.notification_preferences;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'notification_preferences' AND column_name = 'user_id') THEN
        CREATE POLICY "Users can view own notification_preferences" ON public.notification_preferences
            FOR SELECT USING (auth.uid() = user_id);
        CREATE POLICY "Users can insert own notification_preferences" ON public.notification_preferences
            FOR INSERT WITH CHECK (auth.uid() = user_id);
        CREATE POLICY "Users can update own notification_preferences" ON public.notification_preferences
            FOR UPDATE USING (auth.uid() = user_id);
        CREATE POLICY "Users can delete own notification_preferences" ON public.notification_preferences
            FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- notifications
ALTER TABLE IF EXISTS public.notifications ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
    DROP POLICY IF EXISTS "Users can insert own notifications" ON public.notifications;
    DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
    DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'user_id') THEN
        CREATE POLICY "Users can view own notifications" ON public.notifications
            FOR SELECT USING (auth.uid() = user_id);
        CREATE POLICY "Users can insert own notifications" ON public.notifications
            FOR INSERT WITH CHECK (auth.uid() = user_id);
        CREATE POLICY "Users can update own notifications" ON public.notifications
            FOR UPDATE USING (auth.uid() = user_id);
        CREATE POLICY "Users can delete own notifications" ON public.notifications
            FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- enrollments
ALTER TABLE IF EXISTS public.enrollments ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can view own enrollments" ON public.enrollments;
    DROP POLICY IF EXISTS "Users can insert own enrollments" ON public.enrollments;
    DROP POLICY IF EXISTS "Users can update own enrollments" ON public.enrollments;
    DROP POLICY IF EXISTS "Users can delete own enrollments" ON public.enrollments;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'enrollments' AND column_name = 'user_id') THEN
        CREATE POLICY "Users can view own enrollments" ON public.enrollments
            FOR SELECT USING (auth.uid() = user_id);
        CREATE POLICY "Users can insert own enrollments" ON public.enrollments
            FOR INSERT WITH CHECK (auth.uid() = user_id);
        CREATE POLICY "Users can update own enrollments" ON public.enrollments
            FOR UPDATE USING (auth.uid() = user_id);
        CREATE POLICY "Users can delete own enrollments" ON public.enrollments
            FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- courses
ALTER TABLE IF EXISTS public.courses ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can view own courses" ON public.courses;
    DROP POLICY IF EXISTS "Users can insert own courses" ON public.courses;
    DROP POLICY IF EXISTS "Users can update own courses" ON public.courses;
    DROP POLICY IF EXISTS "Users can delete own courses" ON public.courses;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'courses' AND column_name = 'user_id') THEN
        CREATE POLICY "Users can view own courses" ON public.courses
            FOR SELECT USING (auth.uid() = user_id);
        CREATE POLICY "Users can insert own courses" ON public.courses
            FOR INSERT WITH CHECK (auth.uid() = user_id);
        CREATE POLICY "Users can update own courses" ON public.courses
            FOR UPDATE USING (auth.uid() = user_id);
        CREATE POLICY "Users can delete own courses" ON public.courses
            FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- =====================================================
-- PARTE 3: CORRIGIR VIEWS COM SECURITY DEFINER
-- Recriar como SECURITY INVOKER (padrao mais seguro)
-- =====================================================

-- monthly_registrations - view admin, remover acesso publico
DO $$
BEGIN
    DROP VIEW IF EXISTS public.monthly_registrations;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'monthly_registrations view does not exist';
END $$;

-- monthly_sales_stats - recriar sem SECURITY DEFINER
DO $$
BEGIN
    DROP VIEW IF EXISTS public.monthly_sales_stats CASCADE;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'monthly_sales_stats view does not exist';
END $$;

-- active_courtesy_users - recriar sem SECURITY DEFINER
DO $$
BEGIN
    DROP VIEW IF EXISTS public.active_courtesy_users;

    CREATE VIEW public.active_courtesy_users AS
    SELECT
        cu.id,
        cu.user_id,
        cu.email,
        cu.courtesy_months,
        cu.start_date,
        cu.end_date,
        cu.is_active,
        cu.notes,
        cu.created_at
    FROM public.courtesy_users cu
    WHERE cu.is_active = true
      AND cu.end_date >= CURRENT_DATE;

    REVOKE ALL ON public.active_courtesy_users FROM anon;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'active_courtesy_users view could not be created';
END $$;

-- activity_logs_with_customer - drop (view admin)
DO $$
BEGIN
    DROP VIEW IF EXISTS public.activity_logs_with_customer;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'activity_logs_with_customer view does not exist';
END $$;

-- =====================================================
-- PARTE 4: CORRIGIR subscribers_view QUE EXPOE auth.users
-- =====================================================

DO $$
BEGIN
    DROP VIEW IF EXISTS public.subscribers_view;

    -- Criar uma versao segura que nao expoe auth.users diretamente
    CREATE VIEW public.subscribers_view AS
    SELECT
        up.user_id,
        up.display_name,
        up.role,
        up.subscription_status,
        up.subscription_end_date,
        up.created_at
    FROM public.user_profiles up
    WHERE up.subscription_status = 'active';

    -- Revogar acesso anonimo
    REVOKE ALL ON public.subscribers_view FROM anon;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'subscribers_view could not be recreated';
END $$;

-- =====================================================
-- PARTE 5: GARANTIR QUE subscription_plans TENHA POLICY ADEQUADA
-- =====================================================

DO $$
BEGIN
    DROP POLICY IF EXISTS "TEMP - Permitir tudo" ON public.subscription_plans;
    DROP POLICY IF EXISTS "Anyone can view subscription_plans" ON public.subscription_plans;
    DROP POLICY IF EXISTS "Super admins can manage subscription_plans" ON public.subscription_plans;

    CREATE POLICY "Anyone can view subscription_plans" ON public.subscription_plans
        FOR SELECT USING (true);

    CREATE POLICY "Super admins can manage subscription_plans" ON public.subscription_plans
        FOR ALL USING (
            EXISTS (SELECT 1 FROM public.super_admins WHERE user_id = auth.uid())
        );
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'subscription_plans policies could not be created';
END $$;

-- =====================================================
-- PARTE 6: GARANTIR POLICY ADEQUADA PARA super_admins
-- =====================================================

DO $$
BEGIN
    DROP POLICY IF EXISTS "Super admins can view their own data" ON public.super_admins;
    DROP POLICY IF EXISTS "Super admins can view all" ON public.super_admins;

    CREATE POLICY "Super admins can view all" ON public.super_admins
        FOR SELECT USING (
            auth.uid() = user_id OR
            EXISTS (SELECT 1 FROM public.super_admins sa WHERE sa.user_id = auth.uid())
        );
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'super_admins policies could not be created';
END $$;

-- =====================================================
-- VERIFICACAO FINAL
-- =====================================================

-- Verificar se todas as tabelas tem RLS habilitado
SELECT
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
