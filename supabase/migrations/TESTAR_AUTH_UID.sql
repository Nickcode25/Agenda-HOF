-- =====================================================
-- TESTAR SE auth.uid() ESTÁ FUNCIONANDO
-- =====================================================

-- Verificar se a função auth.uid() existe
SELECT
  proname,
  pronargs,
  prorettype::regtype
FROM pg_proc
WHERE proname = 'uid' AND pronamespace = 'auth'::regnamespace;

-- Verificar o schema auth
SELECT schema_name
FROM information_schema.schemata
WHERE schema_name = 'auth';

-- Testar se conseguimos chamar auth.uid()
-- IMPORTANTE: Este teste só funciona se você estiver autenticado
SELECT
  auth.uid() as current_user_id,
  CASE
    WHEN auth.uid() IS NULL THEN '❌ auth.uid() retornou NULL - Usuário não autenticado ou função com problema'
    ELSE '✅ auth.uid() está funcionando: ' || auth.uid()::text
  END as status;
