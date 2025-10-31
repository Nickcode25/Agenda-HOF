-- Adicionar EXCEPTION handler nas funções dos triggers
-- Para que não quebrem o signup se algo der errado

-- 1. Fix handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Tentar criar profile, mas não falhar se der erro
  BEGIN
    INSERT INTO public.profiles (id, email, created_at)
    VALUES (new.id, new.email, now());
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Error creating profile: %', SQLERRM;
  END;

  RETURN new;
END;
$$;

-- 2. Fix create_default_notification_preferences
CREATE OR REPLACE FUNCTION public.create_default_notification_preferences()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  BEGIN
    INSERT INTO public.notification_preferences (user_id, created_at)
    VALUES (new.id, now())
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Error creating notification preferences: %', SQLERRM;
  END;

  RETURN new;
END;
$$;

-- 3. Fix create_default_notification_settings
CREATE OR REPLACE FUNCTION public.create_default_notification_settings()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  BEGIN
    INSERT INTO public.notification_settings (user_id, created_at)
    VALUES (new.id, now())
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Error creating notification settings: %', SQLERRM;
  END;

  RETURN new;
END;
$$;

-- 4. Fix create_default_patient_reminder_settings
CREATE OR REPLACE FUNCTION public.create_default_patient_reminder_settings()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  BEGIN
    INSERT INTO public.patient_reminder_settings (user_id, created_at)
    VALUES (new.id, now())
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Error creating patient reminder settings: %', SQLERRM;
  END;

  RETURN new;
END;
$$;
