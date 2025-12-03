-- =====================================================
-- SCRIPT V3 - PARTE 2: Tabelas que usam user_id
-- Executar no SQL Editor do Supabase APÓS a Parte 1
-- Data: 2025-12-03
-- =====================================================
-- NOTA: Se alguma seção falhar, comente-a e continue
-- =====================================================

-- =====================================================
-- TESTE 1: CATEGORIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view their own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can insert their own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can update their own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can delete their own categories" ON public.categories;

CREATE POLICY "Users can view their own categories" ON public.categories
FOR SELECT USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert their own categories" ON public.categories
FOR INSERT WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update their own categories" ON public.categories
FOR UPDATE USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete their own categories" ON public.categories
FOR DELETE USING (user_id = (select auth.uid()));

SELECT 'categories OK' as resultado;
