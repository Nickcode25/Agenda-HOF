-- Verificar estrutura da tabela patients

-- 1. Ver todas as colunas
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'patients'
ORDER BY ordinal_position;

-- 2. Ver se RLS está habilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'patients';

-- 3. Ver políticas RLS
SELECT policyname, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'patients';

-- 4. Contar pacientes por usuário
SELECT user_id, COUNT(*) as total_pacientes
FROM patients
GROUP BY user_id;
