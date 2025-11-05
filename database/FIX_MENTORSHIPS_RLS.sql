-- Verificar e corrigir políticas RLS da tabela mentorships

-- Desabilitar RLS temporariamente
ALTER TABLE mentorships DISABLE ROW LEVEL SECURITY;

-- Remover todas as políticas existentes (forçado)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'mentorships' AND schemaname = 'public')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON mentorships', r.policyname);
    END LOOP;
END $$;

-- Habilitar RLS novamente
ALTER TABLE mentorships ENABLE ROW LEVEL SECURITY;

-- Criar políticas novas
CREATE POLICY "Users can view own mentorships"
  ON mentorships
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own mentorships"
  ON mentorships
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own mentorships"
  ON mentorships
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own mentorships"
  ON mentorships
  FOR DELETE
  USING (auth.uid() = user_id);

-- Verificar políticas criadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'mentorships';
