-- =====================================================
-- DIAGNÓSTICO RLS - Verificar o estado das políticas
-- =====================================================
-- Execute este SQL no Supabase para ver o que está acontecendo

-- 1. Verificar se as tabelas existem
SELECT
  '✅ Tabela existe: ' || table_name as status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('user_monthly_plans', 'patient_subscriptions', 'subscription_payments')
ORDER BY table_name;

-- 2. Verificar se RLS está habilitado
SELECT
  schemaname,
  tablename,
  CASE WHEN rowsecurity THEN '✅ RLS HABILITADO' ELSE '❌ RLS DESABILITADO' END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('user_monthly_plans', 'patient_subscriptions', 'subscription_payments')
ORDER BY tablename;

-- 3. Listar todas as políticas existentes
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
  AND tablename IN ('user_monthly_plans', 'patient_subscriptions', 'subscription_payments')
ORDER BY tablename, policyname;

-- 4. Contar políticas por tabela
SELECT
  tablename,
  COUNT(*) as total_policies,
  CASE
    WHEN COUNT(*) = 0 THEN '❌ NENHUMA POLÍTICA'
    WHEN COUNT(*) < 4 THEN '⚠️ POLÍTICAS INCOMPLETAS'
    WHEN COUNT(*) = 4 THEN '✅ POLÍTICAS COMPLETAS'
    ELSE '⚠️ POLÍTICAS EXTRAS'
  END as status
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('user_monthly_plans', 'patient_subscriptions', 'subscription_payments')
GROUP BY tablename
ORDER BY tablename;
