-- Verificar estrutura da tabela super_admins
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'super_admins'
ORDER BY ordinal_position;

-- Ver dados existentes
SELECT * FROM super_admins LIMIT 5;
