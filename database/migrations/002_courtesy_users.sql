-- ========================================
-- SISTEMA DE USUÁRIOS CORTESIA
-- ========================================

-- Tabela para armazenar usuários cortesia (acesso gratuito ao app)
CREATE TABLE IF NOT EXISTS courtesy_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  notes TEXT, -- Observações do admin sobre o usuário
  created_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  expires_at TIMESTAMP WITH TIME ZONE, -- Data de expiração do acesso (opcional)
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_courtesy_users_email ON courtesy_users(email);
CREATE INDEX IF NOT EXISTS idx_courtesy_users_auth_user_id ON courtesy_users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_courtesy_users_is_active ON courtesy_users(is_active);
CREATE INDEX IF NOT EXISTS idx_courtesy_users_expires_at ON courtesy_users(expires_at);

-- Trigger para updated_at
DROP TRIGGER IF EXISTS update_courtesy_users_updated_at ON courtesy_users;
CREATE TRIGGER update_courtesy_users_updated_at BEFORE UPDATE ON courtesy_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Permissões
ALTER TABLE courtesy_users DISABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON courtesy_users TO anon;
GRANT ALL ON courtesy_users TO authenticated;

-- View: Usuários cortesia ativos
CREATE OR REPLACE VIEW active_courtesy_users AS
SELECT
  cu.*,
  au.email as created_by_email,
  au.full_name as created_by_name,
  CASE
    WHEN cu.expires_at IS NOT NULL AND cu.expires_at < NOW() THEN false
    ELSE cu.is_active
  END as is_currently_active
FROM courtesy_users cu
LEFT JOIN admin_users au ON cu.created_by = au.id
ORDER BY cu.created_at DESC;

GRANT SELECT ON active_courtesy_users TO anon;
GRANT SELECT ON active_courtesy_users TO authenticated;

-- Verificar
SELECT 'Tabela courtesy_users criada com sucesso!' as status;
SELECT COUNT(*) as total_courtesy_users FROM courtesy_users;
