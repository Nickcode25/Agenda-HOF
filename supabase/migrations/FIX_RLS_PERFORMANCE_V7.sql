-- =====================================================
-- SCRIPT V7 - CONSOLIDAR POLÍTICAS SELECT DUPLICADAS
-- Executar no SQL Editor do Supabase
-- Data: 2025-12-03
-- =====================================================
-- PROBLEMA: multiple_permissive_policies
-- - discount_coupons: admins_select_all_coupons + users_read_active_coupons
-- - user_subscriptions: "Users can view their own subscriptions" + admins_manage_subscriptions
-- =====================================================

-- =====================================================
-- PARTE 1: DISCOUNT_COUPONS
-- Remover as duas políticas SELECT e criar uma única consolidada
-- =====================================================

DROP POLICY IF EXISTS "admins_select_all_coupons" ON public.discount_coupons;
DROP POLICY IF EXISTS "users_read_active_coupons" ON public.discount_coupons;

-- Política consolidada: admins veem tudo, usuários autenticados veem apenas ativos
CREATE POLICY "discount_coupons_select" ON public.discount_coupons
FOR SELECT USING (
    is_super_admin()
    OR (is_active = true AND (select auth.uid()) IS NOT NULL)
);

-- =====================================================
-- PARTE 2: USER_SUBSCRIPTIONS
-- admins_manage_subscriptions é FOR ALL (inclui SELECT)
-- "Users can view their own subscriptions" é específica para SELECT
-- Solução: Remover a política específica SELECT do usuário
-- e manter admins_manage_subscriptions que já cobre admin
-- Criar nova política consolidada para SELECT
-- =====================================================

DROP POLICY IF EXISTS "Users can view their own subscriptions" ON public.user_subscriptions;
DROP POLICY IF EXISTS "admins_manage_subscriptions" ON public.user_subscriptions;

-- Política consolidada para SELECT: usuários veem próprios + admins veem tudo
CREATE POLICY "user_subscriptions_select" ON public.user_subscriptions
FOR SELECT USING (
    user_id = (select auth.uid())
    OR is_super_admin()
);

-- Política para INSERT (apenas admin, usuários usam users_insert_own)
CREATE POLICY "user_subscriptions_admin_insert" ON public.user_subscriptions
FOR INSERT WITH CHECK (is_super_admin());

-- Política para UPDATE (apenas admin, usuários usam users_update_own)
CREATE POLICY "user_subscriptions_admin_update" ON public.user_subscriptions
FOR UPDATE USING (is_super_admin()) WITH CHECK (is_super_admin());

-- Política para DELETE (apenas admin)
CREATE POLICY "user_subscriptions_admin_delete" ON public.user_subscriptions
FOR DELETE USING (is_super_admin());

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================

SELECT 'Políticas V7 consolidadas com sucesso!' as resultado;
