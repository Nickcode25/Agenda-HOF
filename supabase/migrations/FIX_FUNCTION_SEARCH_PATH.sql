-- =====================================================
-- SCRIPT PARA CORRIGIR WARNINGS DE search_path NAS FUNÇÕES
-- Executar no SQL Editor do Supabase
-- Data: 2025-12-03
-- =====================================================

-- O warning "function_search_path_mutable" indica que as funções
-- não têm o parâmetro search_path definido, o que pode ser uma
-- vulnerabilidade de segurança.
--
-- A solução é adicionar: SET search_path = public
-- Isso garante que a função sempre use o schema público.

-- =====================================================
-- PARTE 1: FUNÇÕES DE TRIGGER (update_*_updated_at)
-- =====================================================

-- update_medical_records_updated_at
CREATE OR REPLACE FUNCTION public.update_medical_records_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- update_courses_updated_at
CREATE OR REPLACE FUNCTION public.update_courses_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- update_notification_settings_updated_at
CREATE OR REPLACE FUNCTION public.update_notification_settings_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- update_subscription_plans_updated_at
CREATE OR REPLACE FUNCTION public.update_subscription_plans_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- update_students_updated_at
CREATE OR REPLACE FUNCTION public.update_students_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- update_patient_reminder_settings_updated_at
CREATE OR REPLACE FUNCTION public.update_patient_reminder_settings_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- update_updated_at_column (genérico)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- update_mentorships_updated_at
CREATE OR REPLACE FUNCTION public.update_mentorships_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- update_monthly_plans_updated_at
CREATE OR REPLACE FUNCTION public.update_monthly_plans_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- update_discount_coupons_updated_at
CREATE OR REPLACE FUNCTION public.update_discount_coupons_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- update_subscriptions_updated_at
CREATE OR REPLACE FUNCTION public.update_subscriptions_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- =====================================================
-- PARTE 2: FUNÇÕES DE UTILIDADE
-- =====================================================

-- is_owner
CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid()
        AND role = 'owner'
    );
END;
$$;

-- get_user_clinic_id
CREATE OR REPLACE FUNCTION public.get_user_clinic_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
    v_clinic_id UUID;
BEGIN
    SELECT clinic_id INTO v_clinic_id
    FROM public.user_profiles
    WHERE id = auth.uid();

    RETURN v_clinic_id;
END;
$$;

-- get_user_id_by_email (precisa dropar primeiro por causa do nome do parâmetro)
DROP FUNCTION IF EXISTS public.get_user_id_by_email(TEXT);
CREATE FUNCTION public.get_user_id_by_email(p_email TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
BEGIN
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = p_email;

    RETURN v_user_id;
END;
$$;

-- create_default_patient_reminder_settings
CREATE OR REPLACE FUNCTION public.create_default_patient_reminder_settings()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.patient_reminder_settings (patient_id, user_id)
    VALUES (NEW.id, NEW.user_id)
    ON CONFLICT (patient_id) DO NOTHING;
    RETURN NEW;
END;
$$;

-- is_subscription_active
CREATE OR REPLACE FUNCTION public.is_subscription_active()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_subscriptions
        WHERE user_id = auth.uid()
        AND status = 'active'
    );
END;
$$;

-- handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.user_profiles (id, role, clinic_id, display_name, is_active)
    VALUES (
        NEW.id,
        'owner',
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
        true
    )
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
END;
$$;

-- increment_coupon_usage (precisa dropar primeiro por causa do nome do parâmetro)
DROP FUNCTION IF EXISTS public.increment_coupon_usage(UUID);
CREATE FUNCTION public.increment_coupon_usage(p_coupon_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
    UPDATE public.discount_coupons
    SET current_uses = current_uses + 1
    WHERE id = p_coupon_id;
END;
$$;

-- create_default_notification_settings
CREATE OR REPLACE FUNCTION public.create_default_notification_settings()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.notification_settings (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$;

-- create_default_notification_preferences
CREATE OR REPLACE FUNCTION public.create_default_notification_preferences()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.notification_preferences (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$;

-- =====================================================
-- PARTE 3: FUNÇÕES ADMIN (SECURITY DEFINER)
-- =====================================================

-- get_all_users (admin) - precisa dropar primeiro
DROP FUNCTION IF EXISTS public.get_all_users();
CREATE FUNCTION public.get_all_users()
RETURNS TABLE (
    id UUID,
    email TEXT,
    created_at TIMESTAMPTZ,
    last_sign_in_at TIMESTAMPTZ,
    raw_user_meta_data JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.super_admins WHERE user_id = auth.uid()) THEN
        RAISE EXCEPTION 'Acesso negado';
    END IF;

    RETURN QUERY
    SELECT u.id, u.email::TEXT, u.created_at, u.last_sign_in_at, u.raw_user_meta_data
    FROM auth.users u
    ORDER BY u.created_at DESC;
END;
$$;

-- get_all_subscriptions (admin) - precisa dropar primeiro
DROP FUNCTION IF EXISTS public.get_all_subscriptions();
CREATE FUNCTION public.get_all_subscriptions()
RETURNS TABLE (
    id UUID,
    user_id UUID,
    status TEXT,
    plan_amount NUMERIC,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.super_admins WHERE user_id = auth.uid()) THEN
        RAISE EXCEPTION 'Acesso negado';
    END IF;

    RETURN QUERY
    SELECT s.id, s.user_id, s.status::TEXT, s.plan_amount, s.created_at
    FROM public.user_subscriptions s
    ORDER BY s.created_at DESC;
END;
$$;

-- get_all_plans (admin) - precisa dropar primeiro
DROP FUNCTION IF EXISTS public.get_all_plans();
CREATE FUNCTION public.get_all_plans()
RETURNS TABLE (
    id UUID,
    name TEXT,
    price NUMERIC,
    active BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.super_admins WHERE user_id = auth.uid()) THEN
        RAISE EXCEPTION 'Acesso negado';
    END IF;

    RETURN QUERY
    SELECT p.id, p.name::TEXT, p.price, p.active
    FROM public.subscription_plans p
    ORDER BY p.price;
END;
$$;

-- admin_grant_courtesy (precisa dropar primeiro)
DROP FUNCTION IF EXISTS public.admin_grant_courtesy(UUID, UUID, NUMERIC, TIMESTAMPTZ);
CREATE FUNCTION public.admin_grant_courtesy(
    p_user_id UUID,
    p_plan_id UUID,
    p_plan_amount NUMERIC,
    p_trial_end_date TIMESTAMPTZ
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_existing_sub UUID;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.super_admins WHERE user_id = auth.uid()) THEN
        RETURN json_build_object('error', 'Acesso negado. Apenas super admins podem conceder cortesias.');
    END IF;

    SELECT id INTO v_existing_sub
    FROM public.user_subscriptions
    WHERE user_id = p_user_id
    AND status = 'active'
    LIMIT 1;

    IF v_existing_sub IS NOT NULL THEN
        RETURN json_build_object('error', 'Este usuário já possui uma assinatura ativa');
    END IF;

    UPDATE auth.users
    SET raw_user_meta_data =
        COALESCE(raw_user_meta_data, '{}'::jsonb) ||
        jsonb_build_object('trial_end_date', p_trial_end_date::text)
    WHERE id = p_user_id;

    INSERT INTO public.user_subscriptions (
        user_id, status, plan_amount, discount_percentage, created_at, updated_at
    ) VALUES (
        p_user_id, 'active', p_plan_amount, 100, NOW(), NOW()
    );

    RETURN json_build_object('success', true);
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('error', SQLERRM);
END;
$$;

-- admin_revoke_courtesy (precisa dropar primeiro)
DROP FUNCTION IF EXISTS public.admin_revoke_courtesy(UUID);
CREATE FUNCTION public.admin_revoke_courtesy(p_subscription_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.super_admins WHERE user_id = auth.uid()) THEN
        RAISE EXCEPTION 'Acesso negado. Apenas super admins podem revogar cortesias.';
    END IF;

    UPDATE public.user_subscriptions
    SET status = 'cancelled', updated_at = NOW()
    WHERE id = p_subscription_id;
END;
$$;

-- create_activity_log (precisa dropar primeiro)
DROP FUNCTION IF EXISTS public.create_activity_log(TEXT, TEXT, UUID, JSONB);
CREATE FUNCTION public.create_activity_log(
    p_action TEXT,
    p_entity_type TEXT,
    p_entity_id UUID DEFAULT NULL,
    p_details JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO public.activity_logs (user_id, action, entity_type, entity_id, details)
    VALUES (auth.uid(), p_action, p_entity_type, p_entity_id, p_details)
    RETURNING id INTO v_log_id;

    RETURN v_log_id;
END;
$$;

-- test_super_admin_access - precisa dropar primeiro
DROP FUNCTION IF EXISTS public.test_super_admin_access();
CREATE FUNCTION public.test_super_admin_access()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.super_admins
        WHERE user_id = auth.uid()
    );
END;
$$;

-- log_purchase_activity
CREATE OR REPLACE FUNCTION public.log_purchase_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.activity_logs (user_id, action, entity_type, entity_id, details)
    VALUES (
        NEW.user_id,
        'purchase_created',
        'purchase',
        NEW.id,
        jsonb_build_object('amount', NEW.amount, 'status', NEW.status)
    );
    RETURN NEW;
END;
$$;

-- get_recent_activity_logs (admin) - precisa dropar primeiro
DROP FUNCTION IF EXISTS public.get_recent_activity_logs(INT);
CREATE FUNCTION public.get_recent_activity_logs(p_limit INT DEFAULT 50)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    action TEXT,
    entity_type TEXT,
    entity_id UUID,
    details JSONB,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.super_admins WHERE user_id = auth.uid()) THEN
        RAISE EXCEPTION 'Acesso negado';
    END IF;

    RETURN QUERY
    SELECT l.id, l.user_id, l.action::TEXT, l.entity_type::TEXT, l.entity_id, l.details, l.created_at
    FROM public.activity_logs l
    ORDER BY l.created_at DESC
    LIMIT p_limit;
END;
$$;

-- log_customer_activity
CREATE OR REPLACE FUNCTION public.log_customer_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.activity_logs (action, entity_type, entity_id, details)
        VALUES ('customer_created', 'customer', NEW.id, to_jsonb(NEW));
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO public.activity_logs (action, entity_type, entity_id, details)
        VALUES ('customer_updated', 'customer', NEW.id, jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW)));
    END IF;
    RETURN NEW;
END;
$$;

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================

-- Verificar se as funções foram atualizadas
SELECT
    proname as function_name,
    proconfig as config
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
AND proname IN (
    'update_medical_records_updated_at',
    'update_courses_updated_at',
    'is_owner',
    'get_user_clinic_id',
    'handle_new_user'
)
ORDER BY proname;
