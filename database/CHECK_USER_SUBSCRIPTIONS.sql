-- Verificar se a tabela user_subscriptions existe e suas políticas RLS

-- 1. Verificar se a tabela existe
SELECT
    table_name,
    table_schema
FROM information_schema.tables
WHERE table_name = 'user_subscriptions';

-- 2. Verificar colunas da tabela
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'user_subscriptions'
ORDER BY ordinal_position;

-- 3. Verificar se RLS está habilitado
SELECT
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename = 'user_subscriptions';

-- 4. Verificar políticas RLS existentes
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'user_subscriptions';
