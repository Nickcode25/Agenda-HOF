-- =====================================================
-- REABILITAR RLS COM POLÍTICAS CORRETAS PARA PRODUÇÃO
-- =====================================================

-- Reabilitar RLS
ALTER TABLE public.discount_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_usage ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "admins_select_all_coupons" ON discount_coupons;
DROP POLICY IF EXISTS "admins_insert_coupons" ON discount_coupons;
DROP POLICY IF EXISTS "admins_update_coupons" ON discount_coupons;
DROP POLICY IF EXISTS "admins_delete_coupons" ON discount_coupons;
DROP POLICY IF EXISTS "users_read_active_coupons" ON discount_coupons;
DROP POLICY IF EXISTS "users_insert_coupon_usage" ON coupon_usage;
DROP POLICY IF EXISTS "admins_read_coupon_usage" ON coupon_usage;

-- =====================================================
-- POLÍTICAS PARA PRODUÇÃO
-- =====================================================

-- 1. Admins podem SELECT todos os cupons
CREATE POLICY "admins_select_all_coupons" ON discount_coupons
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
    )
  );

-- 2. Admins podem INSERT cupons
CREATE POLICY "admins_insert_coupons" ON discount_coupons
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
    )
  );

-- 3. Admins podem UPDATE cupons
CREATE POLICY "admins_update_coupons" ON discount_coupons
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
    )
  );

-- 4. Admins podem DELETE cupons
CREATE POLICY "admins_delete_coupons" ON discount_coupons
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
    )
  );

-- 5. Usuários comuns podem ler apenas cupons ativos (para validação no checkout)
CREATE POLICY "users_read_active_coupons" ON discount_coupons
  FOR SELECT
  TO authenticated
  USING (
    is_active = TRUE
    AND NOT EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
    )
  );

-- 6. Qualquer usuário autenticado pode registrar uso de cupom
CREATE POLICY "users_insert_coupon_usage" ON coupon_usage
  FOR INSERT
  TO authenticated
  WITH CHECK (TRUE);

-- 7. Admins podem ler todo histórico de uso
CREATE POLICY "admins_read_coupon_usage" ON coupon_usage
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
    )
  );

-- Verificar RLS está habilitado
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN ('discount_coupons', 'coupon_usage')
  AND schemaname = 'public';

-- Verificar políticas criadas
SELECT
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename IN ('discount_coupons', 'coupon_usage')
ORDER BY tablename, policyname;

-- Mensagem
DO $$
BEGIN
  RAISE NOTICE '✅ RLS reabilitado com políticas de produção!';
  RAISE NOTICE '🔒 Agora apenas admins podem gerenciar cupons';
  RAISE NOTICE '👥 Usuários comuns podem ler cupons ativos para validação';
END $$;
