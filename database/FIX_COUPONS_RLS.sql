-- =====================================================
-- ADICIONAR RLS POLICIES PARA CUPONS DE DESCONTO
-- =====================================================

-- PROBLEMA:
-- Super admin não consegue criar, editar ou deletar cupons
-- Erro: 403 Forbidden na API do Supabase

-- =====================================================
-- PARTE 1: Verificar se RLS está habilitado
-- =====================================================

SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'discount_coupons';

-- =====================================================
-- PARTE 2: Adicionar policies para super admin
-- =====================================================

-- Policy para SELECT (visualizar cupons)
DROP POLICY IF EXISTS "Super admin can view all coupons" ON discount_coupons;
CREATE POLICY "Super admin can view all coupons"
  ON discount_coupons
  FOR SELECT
  USING (public.is_super_admin());

-- Policy para INSERT (criar cupons)
DROP POLICY IF EXISTS "Super admin can create coupons" ON discount_coupons;
CREATE POLICY "Super admin can create coupons"
  ON discount_coupons
  FOR INSERT
  WITH CHECK (public.is_super_admin());

-- Policy para UPDATE (editar cupons)
DROP POLICY IF EXISTS "Super admin can update coupons" ON discount_coupons;
CREATE POLICY "Super admin can update coupons"
  ON discount_coupons
  FOR UPDATE
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- Policy para DELETE (deletar cupons)
DROP POLICY IF EXISTS "Super admin can delete coupons" ON discount_coupons;
CREATE POLICY "Super admin can delete coupons"
  ON discount_coupons
  FOR DELETE
  USING (public.is_super_admin());

-- =====================================================
-- PARTE 3: Policy para usuários aplicarem cupons no checkout
-- =====================================================

-- Usuários autenticados podem ver cupons ativos
DROP POLICY IF EXISTS "Authenticated users can view active coupons" ON discount_coupons;
CREATE POLICY "Authenticated users can view active coupons"
  ON discount_coupons
  FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND is_active = true
  );

-- =====================================================
-- VERIFICAR RESULTADO
-- =====================================================

-- Ver todas as policies da tabela discount_coupons
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
WHERE schemaname = 'public'
  AND tablename = 'discount_coupons'
ORDER BY policyname;

-- Mensagem final
DO $$
DECLARE
  policy_count integer;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'discount_coupons';

  RAISE NOTICE '✅ Policies de cupons configuradas!';
  RAISE NOTICE '📊 Total de policies: %', policy_count;
  RAISE NOTICE '';
  RAISE NOTICE '🔐 Permissões configuradas:';
  RAISE NOTICE '  - Super admin: SELECT, INSERT, UPDATE, DELETE';
  RAISE NOTICE '  - Usuários autenticados: SELECT (apenas cupons ativos)';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️ PRÓXIMO PASSO:';
  RAISE NOTICE '  - Recarregue a página do Admin Dashboard';
  RAISE NOTICE '  - Tente criar um cupom novamente';
END $$;
