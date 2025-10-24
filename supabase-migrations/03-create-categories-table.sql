-- =============================================
-- CORREÇÃO FINAL: Políticas RLS corretas
-- =============================================

-- 1. Remover políticas de teste
DROP POLICY IF EXISTS "test_select_all" ON categories;
DROP POLICY IF EXISTS "test_insert_all" ON categories;
DROP POLICY IF EXISTS "test_update_all" ON categories;
DROP POLICY IF EXISTS "test_delete_all" ON categories;

-- 2. Remover políticas antigas (se existirem)
DROP POLICY IF EXISTS "Users can view their own categories" ON categories;
DROP POLICY IF EXISTS "Users can insert their own categories" ON categories;
DROP POLICY IF EXISTS "Users can update their own categories" ON categories;
DROP POLICY IF EXISTS "Users can delete their own categories" ON categories;

-- 3. Criar políticas corretas (com cast explícito de UUID)
CREATE POLICY "Users can view their own categories"
  ON categories
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own categories"
  ON categories
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own categories"
  ON categories
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = user_id::text)
  WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own categories"
  ON categories
  FOR DELETE
  TO authenticated
  USING (auth.uid()::text = user_id::text);

-- 4. Garantir RLS habilitado
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- 5. Verificar políticas
SELECT
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'categories';

-- 6. Testar acesso (deve retornar categorias do usuário)
SELECT
  id,
  name,
  type,
  created_at
FROM categories
WHERE user_id = 'b1a9efa0-e92a-459c-a668-e95efa628f3f'::uuid
ORDER BY name;
