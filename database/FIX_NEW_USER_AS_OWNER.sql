-- Corrigir função handle_new_user para criar novos usuários como 'owner'
-- Execute este SQL no Supabase SQL Editor

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Criar perfil do novo usuário como OWNER (não como staff)
  -- Novos usuários que se cadastram devem ser donos de sua própria clínica
  BEGIN
    INSERT INTO public.user_profiles (
      id,
      role,
      clinic_id,
      parent_user_id,
      display_name,
      is_active,
      created_at,
      updated_at
    )
    VALUES (
      NEW.id,
      'owner',  -- SEMPRE criar como owner, não como staff
      NEW.id,   -- clinic_id é o próprio id do usuário
      NULL,     -- parent_user_id NULL para owners
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
      true,
      now(),
      now()
    )
    ON CONFLICT (id) DO UPDATE
    SET
      display_name = COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
      updated_at = now();
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Error creating user profile: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$;

-- Verificar se funcionou - ver últimos usuários criados
SELECT
  up.id,
  up.role,
  up.display_name,
  au.email,
  up.created_at
FROM user_profiles up
JOIN auth.users au ON au.id = up.id
ORDER BY up.created_at DESC
LIMIT 5;
