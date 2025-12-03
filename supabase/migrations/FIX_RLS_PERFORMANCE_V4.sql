-- =====================================================
-- SCRIPT PARA CORRIGIR TABELAS RESTANTES (V4)
-- Executar no SQL Editor do Supabase
-- Data: 2025-12-03
-- =====================================================

-- =====================================================
-- PASSO 1: USER_SUBSCRIPTIONS (políticas adicionais)
-- =====================================================

DROP POLICY IF EXISTS "users_insert_own" ON public.user_subscriptions;
DROP POLICY IF EXISTS "users_select_own" ON public.user_subscriptions;
DROP POLICY IF EXISTS "users_update_own" ON public.user_subscriptions;

CREATE POLICY "users_insert_own" ON public.user_subscriptions
FOR INSERT WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "users_select_own" ON public.user_subscriptions
FOR SELECT USING (user_id = (select auth.uid()));

CREATE POLICY "users_update_own" ON public.user_subscriptions
FOR UPDATE USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================

SELECT 'Políticas RLS V4 otimizadas com sucesso!' as resultado;
