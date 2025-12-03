-- =====================================================
-- SCRIPT PARA CORRIGIR RECURSÃO NAS POLÍTICAS RLS
-- Executar no SQL Editor do Supabase
-- Data: 2025-12-03
-- =====================================================

-- PROBLEMA: As políticas RLS fazem subquery na própria tabela
-- que está sendo consultada, causando recursão infinita.
-- SOLUÇÃO: Remover políticas problemáticas e manter apenas as simples.

-- =====================================================
-- REMOVER TODAS AS POLÍTICAS PROBLEMÁTICAS
-- (políticas que usam subquery em user_profiles ou is_super_admin)
-- =====================================================

-- user_profiles
DROP POLICY IF EXISTS "Users can view profiles from their clinic" ON public.user_profiles;

-- appointments
DROP POLICY IF EXISTS "Users can view appointments from their clinic" ON public.appointments;

-- patients
DROP POLICY IF EXISTS "Users can view patients from their clinic" ON public.patients;

-- professionals
DROP POLICY IF EXISTS "Users can view professionals from their clinic" ON public.professionals;

-- sales
DROP POLICY IF EXISTS "Users can view sales from their clinic" ON public.sales;

-- procedures
DROP POLICY IF EXISTS "Users can view procedures from their clinic" ON public.procedures;

-- expenses
DROP POLICY IF EXISTS "Users can view expenses from their clinic" ON public.expenses;

-- stock_items
DROP POLICY IF EXISTS "Users can view stock_items from their clinic" ON public.stock_items;

-- stock_movements
DROP POLICY IF EXISTS "Users can view stock_movements from their clinic" ON public.stock_movements;

-- notification_preferences
DROP POLICY IF EXISTS "Users can view notification_preferences from their clinic" ON public.notification_preferences;

-- notification_settings
DROP POLICY IF EXISTS "Users can view notification_settings from their clinic" ON public.notification_settings;

-- patient_reminder_settings
DROP POLICY IF EXISTS "Users can view patient_reminder_settings from their clinic" ON public.patient_reminder_settings;

-- cash_registers
DROP POLICY IF EXISTS "Users can view cash registers from their clinic" ON public.cash_registers;

-- stock
DROP POLICY IF EXISTS "Users can view stock from their clinic" ON public.stock;

-- discount_coupons (super admin policies - mantém apenas para super admins)
-- Estas são seguras pois usam apenas is_super_admin() sem subquery em user_profiles

-- user_subscriptions (super admin policies - mantém apenas para super admins)
-- Estas são seguras pois usam apenas is_super_admin() sem subquery em user_profiles

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================

-- Verificar todas as políticas que ainda usam is_super_admin ou subquery em user_profiles
SELECT
    tablename,
    policyname,
    qual
FROM pg_policies
WHERE schemaname = 'public'
AND (qual LIKE '%is_super_admin%' OR qual LIKE '%user_profiles%')
ORDER BY tablename, policyname;
