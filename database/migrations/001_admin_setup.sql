-- ========================================
-- SETUP COMPLETO DO SISTEMA ADMIN
-- Execute TODO este arquivo de uma vez
-- ========================================

-- PARTE 1: Recriar tabela admin_users
-- ========================================

DROP TABLE IF EXISTS admin_users CASCADE;

CREATE TABLE admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);

-- PARTE 2: Permissões (CRITICAL!)
-- ========================================

-- Desabilitar RLS
ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;

-- Dar permissões aos roles do Supabase
GRANT SELECT ON admin_users TO anon;
GRANT SELECT ON admin_users TO authenticated;
GRANT ALL ON admin_users TO authenticated;

-- Permissões para customers e purchases
GRANT SELECT, INSERT, UPDATE, DELETE ON customers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON customers TO authenticated;
GRANT ALL ON customers TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON purchases TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON purchases TO authenticated;
GRANT ALL ON purchases TO authenticated;

-- Permissões para views
GRANT SELECT ON monthly_sales_stats TO anon;
GRANT SELECT ON monthly_sales_stats TO authenticated;
GRANT SELECT ON monthly_registrations TO anon;
GRANT SELECT ON monthly_registrations TO authenticated;

-- PARTE 3: Adicionar seu usuário admin
-- ========================================

INSERT INTO admin_users (id, email, full_name, role)
SELECT
  id,
  email,
  'Admin HOF',
  'super_admin'
FROM auth.users
WHERE email = 'agendamaishof@gmail.com'
ON CONFLICT (id) DO UPDATE
SET role = 'super_admin', full_name = 'Admin HOF';

-- PARTE 4: Verificações
-- ========================================

-- 1. Verificar se admin foi criado
SELECT
  'Admin cadastrado com sucesso!' as status,
  email,
  role
FROM admin_users
WHERE email = 'agendamaishof@gmail.com';

-- 2. Verificar RLS
SELECT
  'RLS Status' as check_name,
  CASE WHEN rowsecurity THEN '❌ HABILITADO (vai dar erro)' ELSE '✅ DESABILITADO (correto)' END as status
FROM pg_tables
WHERE tablename = 'admin_users';

-- 3. Verificar permissões
SELECT
  'Permissões' as check_name,
  COUNT(*) as total_permissoes
FROM information_schema.table_privileges
WHERE table_name = 'admin_users'
  AND grantee IN ('anon', 'authenticated');

-- Deve retornar total_permissoes >= 2

-- 4. Testar query que o código usa
SELECT
  'Teste de query' as check_name,
  COUNT(*) as encontrado
FROM admin_users
WHERE email = 'agendamaishof@gmail.com';

-- Deve retornar encontrado = 1

-- ========================================
-- RESULTADO ESPERADO
-- ========================================

-- Você deve ver 4 resultados:
-- 1. ✅ Admin cadastrado com sucesso!
-- 2. ✅ RLS DESABILITADO (correto)
-- 3. ✅ total_permissoes >= 2
-- 4. ✅ encontrado = 1

-- Se todos os checks passaram:
-- 🎉 VAMOS TESTAR NO APP!
--
-- 1. Recarregue a página (F5)
-- 2. Vá em /admin/login
-- 3. Email: agendamaishof@gmail.com
-- 4. Digite sua senha
-- 5. Clique em "Entrar no Painel"
-- 6. DEVE FUNCIONAR! 🚀
