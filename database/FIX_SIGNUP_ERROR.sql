-- ==============================================
-- FIX: Erro "Database error saving new user" no signup
-- ==============================================
-- O problema é que existem triggers que tentam inserir em tabelas
-- que não existem (user_profiles) quando um novo usuário é criado.
--
-- Execute este SQL no Supabase SQL Editor para corrigir.
-- ==============================================

-- OPÇÃO 1: Remover os triggers problemáticos (RECOMENDADO)
-- --------------------------------------------------------
-- Baseado nos triggers encontrados no banco:
-- - on_auth_user_created_notification_prefs
-- - trigger_create_default_notification_settings
-- - trigger_create_default_patient_reminder_settings

-- 1. Remover trigger de notification_prefs (tabela notification_preferences pode não existir)
DROP TRIGGER IF EXISTS on_auth_user_created_notification_prefs ON auth.users;

-- 2. Remover trigger de notification_settings (tabela notification_settings pode não existir)
DROP TRIGGER IF EXISTS trigger_create_default_notification_settings ON auth.users;

-- 3. Remover trigger de patient_reminder_settings (tabela patient_reminder_settings pode não existir)
DROP TRIGGER IF EXISTS trigger_create_default_patient_reminder_settings ON auth.users;

-- 4. Remover trigger handle_new_user se existir (tenta inserir em user_profiles que não existe)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 5. Manter apenas o trigger de trial que está funcionando (se existir)
-- O trigger on_auth_user_created_trial deve continuar funcionando

-- ==============================================
-- OPÇÃO 2: Criar a tabela user_profiles (se necessário)
-- ==============================================
-- Descomente o código abaixo se quiser criar a tabela em vez de remover o trigger

/*
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'owner',
    clinic_id UUID,
    display_name TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Política para usuários verem seus próprios dados
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Conceder permissões
GRANT SELECT, UPDATE ON public.user_profiles TO authenticated;
*/

-- ==============================================
-- OPÇÃO 3: Corrigir as funções com exception handlers
-- ==============================================
-- Isso permite que o signup funcione mesmo se as tabelas não existirem

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Tentar inserir em user_profiles, mas não falhar se der erro
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
    EXCEPTION WHEN OTHERS THEN
        -- Ignorar erro - tabela pode não existir
        RAISE WARNING 'handle_new_user error (ignorado): %', SQLERRM;
    END;

    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_default_notification_settings()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    BEGIN
        INSERT INTO public.notification_settings (user_id)
        VALUES (NEW.id)
        ON CONFLICT (user_id) DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'create_default_notification_settings error (ignorado): %', SQLERRM;
    END;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_default_notification_preferences()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    BEGIN
        INSERT INTO public.notification_preferences (user_id)
        VALUES (NEW.id)
        ON CONFLICT (user_id) DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'create_default_notification_preferences error (ignorado): %', SQLERRM;
    END;
    RETURN NEW;
END;
$$;

-- ==============================================
-- VERIFICAÇÃO: Listar todos os triggers em auth.users
-- ==============================================
SELECT
    trigger_name,
    event_manipulation,
    action_timing
FROM information_schema.triggers
WHERE event_object_table = 'users'
AND event_object_schema = 'auth';

-- ==============================================
-- VERIFICAÇÃO: Testar se o signup agora funciona
-- ==============================================
-- Após executar este SQL, tente criar uma nova conta no sistema.
-- Se ainda der erro, verifique os logs do Supabase em:
-- Dashboard > Database > Logs
