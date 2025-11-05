-- Verificar e corrigir políticas RLS da tabela students

-- Desabilitar RLS temporariamente
ALTER TABLE students DISABLE ROW LEVEL SECURITY;

-- Remover todas as políticas existentes (forçado)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'students' AND schemaname = 'public')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON students', r.policyname);
    END LOOP;
END $$;

-- Habilitar RLS novamente
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Criar políticas novas
CREATE POLICY "Users can view own students"
  ON students
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own students"
  ON students
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own students"
  ON students
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own students"
  ON students
  FOR DELETE
  USING (auth.uid() = user_id);

-- Verificar políticas criadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'students';
