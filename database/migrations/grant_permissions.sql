-- Fix: Conceder permissões explícitas na tabela user_profiles

-- 1. Conceder permissões para authenticated users
GRANT ALL ON public.user_profiles TO authenticated;
GRANT ALL ON public.user_profiles TO anon;

-- 2. Garantir que a tabela está no schema public
ALTER TABLE public.user_profiles OWNER TO postgres;

-- 3. Desabilitar RLS
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

-- 4. Verificar permissões
SELECT
  grantee,
  privilege_type
FROM information_schema.table_privileges
WHERE table_name = 'user_profiles'
ORDER BY grantee, privilege_type;

-- 5. Verificar owner da tabela
SELECT
  schemaname,
  tablename,
  tableowner
FROM pg_tables
WHERE tablename = 'user_profiles';
