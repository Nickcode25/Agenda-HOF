-- Remover trigger que está causando erro 500
-- Execute este SQL no Supabase SQL Editor

DROP TRIGGER IF EXISTS on_auth_user_created_trial ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user_trial();
