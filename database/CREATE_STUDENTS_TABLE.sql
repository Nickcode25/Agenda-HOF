-- Criar tabela de alunos (students)
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  cpf TEXT,
  birth_date TEXT,
  phone TEXT,
  cep TEXT,
  street TEXT,
  number TEXT,
  complement TEXT,
  neighborhood TEXT,
  city TEXT,
  state TEXT,
  notes TEXT,
  photo_url TEXT,
  planned_mentorships JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id);
CREATE INDEX IF NOT EXISTS idx_students_name ON students(name);
CREATE INDEX IF NOT EXISTS idx_students_cpf ON students(cpf);
CREATE INDEX IF NOT EXISTS idx_students_created_at ON students(created_at DESC);

-- RLS (Row Level Security)
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver apenas seus próprios alunos
CREATE POLICY "Users can view own students"
  ON students
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política: Usuários podem inserir seus próprios alunos
CREATE POLICY "Users can insert own students"
  ON students
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política: Usuários podem atualizar seus próprios alunos
CREATE POLICY "Users can update own students"
  ON students
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Política: Usuários podem deletar seus próprios alunos
CREATE POLICY "Users can delete own students"
  ON students
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_students_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_students_updated_at
  BEFORE UPDATE ON students
  FOR EACH ROW
  EXECUTE FUNCTION update_students_updated_at();
