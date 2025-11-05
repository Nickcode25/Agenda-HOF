-- Diagnóstico completo da tabela students

-- 1. Verificar se a tabela existe
SELECT EXISTS (
   SELECT FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name = 'students'
) as table_exists;

-- 2. Verificar estrutura da tabela
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'students'
ORDER BY ordinal_position;

-- 3. Verificar se RLS está habilitado
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'students';

-- 4. Verificar políticas existentes
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'students';

-- 5. Testar se consegue inserir dados (TESTE - remover depois)
-- Comentado por segurança - descomente para testar
-- INSERT INTO students (user_id, name, cpf, phone)
-- VALUES (auth.uid(), 'Teste', '123.456.789-00', '(11) 99999-9999');

-- 6. Verificar se há dados na tabela
SELECT COUNT(*) as total_students FROM students;

-- 7. Verificar usuário atual
SELECT auth.uid() as current_user_id;
