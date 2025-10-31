-- Sistema de Trial de 7 dias para novos usuários
-- Execute este SQL no Supabase SQL Editor

-- 1. Adicionar coluna trial_end_date na tabela auth.users (metadata)
-- Como não podemos modificar auth.users diretamente, vamos usar o campo raw_user_meta_data

-- 2. Criar função que adiciona trial ao criar usuário
CREATE OR REPLACE FUNCTION public.handle_new_user_trial()
RETURNS TRIGGER AS $$
BEGIN
  -- Adicionar 7 dias de trial ao criar novo usuário
  -- Atualiza o raw_user_meta_data com trial_end_date
  NEW.raw_user_meta_data = jsonb_set(
    COALESCE(NEW.raw_user_meta_data, '{}'::jsonb),
    '{trial_end_date}',
    to_jsonb((NOW() + INTERVAL '7 days')::timestamp with time zone)
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Criar trigger que executa antes de inserir novo usuário
DROP TRIGGER IF EXISTS on_auth_user_created_trial ON auth.users;
CREATE TRIGGER on_auth_user_created_trial
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_trial();

-- 4. Atualizar usuários existentes que não tem trial_end_date (opcional)
-- CUIDADO: Isso dá 7 dias para TODOS os usuários existentes
-- Comente esta linha se não quiser dar trial para usuários antigos
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{trial_end_date}',
  to_jsonb((NOW() + INTERVAL '7 days')::timestamp with time zone)
)
WHERE raw_user_meta_data->>'trial_end_date' IS NULL;

-- 5. Verificar se funcionou
SELECT
  id,
  email,
  raw_user_meta_data->>'trial_end_date' as trial_end_date,
  (raw_user_meta_data->>'trial_end_date')::timestamp > NOW() as is_in_trial
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;
