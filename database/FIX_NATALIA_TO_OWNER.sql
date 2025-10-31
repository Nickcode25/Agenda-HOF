-- Corrigir conta da Natalia para ser OWNER (administrador da própria clínica)
-- Execute este SQL no Supabase SQL Editor

-- 1. Verificar status atual
SELECT
  up.id,
  up.display_name,
  up.role as role_atual,
  up.clinic_id,
  up.parent_user_id,
  au.email,
  au.created_at
FROM user_profiles up
JOIN auth.users au ON au.id = up.id
WHERE au.email = 'nataliacsgoncalves21@gmail.com';

-- 2. Atualizar para OWNER (administrador da própria clínica)
UPDATE user_profiles up
SET
  role = 'owner',                    -- Mudar de staff para owner
  clinic_id = up.id,                  -- clinic_id = próprio id (é dono da própria clínica)
  parent_user_id = NULL,              -- Não tem usuário pai (owners não têm)
  updated_at = now()
FROM auth.users au
WHERE up.id = au.id
  AND au.email = 'nataliacsgoncalves21@gmail.com';

-- 3. Verificar se foi corrigido
SELECT
  up.id,
  up.display_name,
  up.role as role_corrigido,
  up.clinic_id,
  up.parent_user_id,
  au.email,
  CASE
    WHEN up.role = 'owner' THEN '✅ É OWNER - Tem controle total da própria clínica'
    WHEN up.role = 'staff' THEN '❌ É STAFF - Acesso limitado'
    ELSE '⚠️ Role desconhecido'
  END as status
FROM user_profiles up
JOIN auth.users au ON au.id = up.id
WHERE au.email = 'nataliacsgoncalves21@gmail.com';
