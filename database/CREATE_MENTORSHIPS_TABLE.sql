-- Criar tabela de pacotes de mentoria
CREATE TABLE IF NOT EXISTS mentorships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  duration TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_mentorships_user_id ON mentorships(user_id);
CREATE INDEX IF NOT EXISTS idx_mentorships_name ON mentorships(name);
CREATE INDEX IF NOT EXISTS idx_mentorships_is_active ON mentorships(is_active);

-- RLS
ALTER TABLE mentorships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own mentorships"
  ON mentorships FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own mentorships"
  ON mentorships FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own mentorships"
  ON mentorships FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own mentorships"
  ON mentorships FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_mentorships_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_mentorships_updated_at
  BEFORE UPDATE ON mentorships
  FOR EACH ROW
  EXECUTE FUNCTION update_mentorships_updated_at();

-- Inserir mentorias padrão (opcional)
-- INSERT INTO mentorships (user_id, name, description, price, duration) VALUES
-- ((SELECT id FROM auth.users LIMIT 1), 'Inscrição Mentoria', 'Taxa de inscrição no programa de mentoria', 500.00, 'Única'),
-- ((SELECT id FROM auth.users LIMIT 1), 'Mentoria Individual', 'Sessão individual de mentoria', 800.00, '1 sessão'),
-- ((SELECT id FROM auth.users LIMIT 1), 'Pacote 3 Meses', 'Programa completo de mentoria por 3 meses', 2400.00, '3 meses');
