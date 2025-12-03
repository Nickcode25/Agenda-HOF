-- =====================================================
-- SCRIPT PARA CORRIGIR AS VIEWS RESTANTES
-- Executar no SQL Editor do Supabase
-- Data: 2025-12-03
-- =====================================================

-- Problemas restantes:
-- 1. subscribers_view - expoe auth.users E tem SECURITY DEFINER
-- 2. active_courtesy_users - tem SECURITY DEFINER

-- SOLUÇÃO: Como essas views não são usadas no código da aplicação,
-- vamos simplesmente removê-las para eliminar os riscos de segurança.
-- Se forem necessárias no futuro, podem ser recriadas com a estrutura correta.

-- =====================================================
-- REMOVER COMPLETAMENTE AS VIEWS PROBLEMATICAS
-- =====================================================

-- Remover subscribers_view completamente
DROP VIEW IF EXISTS public.subscribers_view CASCADE;

-- Remover active_courtesy_users completamente
DROP VIEW IF EXISTS public.active_courtesy_users CASCADE;

-- =====================================================
-- VERIFICACAO
-- =====================================================

-- Verificar que as views foram removidas
SELECT
    schemaname,
    viewname
FROM pg_views
WHERE schemaname = 'public'
  AND viewname IN ('subscribers_view', 'active_courtesy_users');

-- Se retornar "No rows returned", as views foram removidas com sucesso
