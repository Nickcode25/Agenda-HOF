-- Sistema de Super Admin para controle total da plataforma
-- Execute este SQL no Supabase SQL Editor

-- 1. Criar tabela de super admins
CREATE TABLE IF NOT EXISTS public.super_admins (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true
);

-- 2. Habilitar RLS na tabela
ALTER TABLE public.super_admins ENABLE ROW LEVEL SECURITY;

-- 3. Policy para super admins verem apenas seus próprios dados
DROP POLICY IF EXISTS "Super admins can view their own data" ON public.super_admins;
CREATE POLICY "Super admins can view their own data"
  ON public.super_admins
  FOR SELECT
  USING (auth.uid() = id);

-- 4. Adicionar você como super admin
INSERT INTO public.super_admins (id, email)
SELECT id, email
FROM auth.users
WHERE email = 'agendahof.site@gmail.com'
ON CONFLICT (id) DO NOTHING;

-- 5. Criar função helper para verificar se usuário é super admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.super_admins
    WHERE id = auth.uid()
    AND is_active = true
  );
$$;

-- 6. Modificar RLS policies principais para permitir super admin ver TUDO
-- NOTA: Apenas para tabelas que existem

-- Patients
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'patients') THEN
    DROP POLICY IF EXISTS "Users can view patients from their clinic" ON public.patients;
    CREATE POLICY "Users can view patients from their clinic"
      ON public.patients
      FOR SELECT
      USING (
        user_id IN (
          SELECT clinic_id FROM public.user_profiles WHERE id = auth.uid()
        )
        OR public.is_super_admin()
      );
  END IF;
END $$;

-- Appointments
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'appointments') THEN
    DROP POLICY IF EXISTS "Users can view appointments from their clinic" ON public.appointments;
    CREATE POLICY "Users can view appointments from their clinic"
      ON public.appointments
      FOR SELECT
      USING (
        user_id IN (
          SELECT clinic_id FROM public.user_profiles WHERE id = auth.uid()
        )
        OR public.is_super_admin()
      );
  END IF;
END $$;

-- Procedures
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'procedures') THEN
    DROP POLICY IF EXISTS "Users can view procedures from their clinic" ON public.procedures;
    CREATE POLICY "Users can view procedures from their clinic"
      ON public.procedures
      FOR SELECT
      USING (
        user_id IN (
          SELECT clinic_id FROM public.user_profiles WHERE id = auth.uid()
        )
        OR public.is_super_admin()
      );
  END IF;
END $$;

-- Stock
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'stock') THEN
    DROP POLICY IF EXISTS "Users can view stock from their clinic" ON public.stock;
    CREATE POLICY "Users can view stock from their clinic"
      ON public.stock
      FOR SELECT
      USING (
        user_id IN (
          SELECT clinic_id FROM public.user_profiles WHERE id = auth.uid()
        )
        OR public.is_super_admin()
      );
  END IF;
END $$;

-- Sales
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'sales') THEN
    DROP POLICY IF EXISTS "Users can view sales from their clinic" ON public.sales;
    CREATE POLICY "Users can view sales from their clinic"
      ON public.sales
      FOR SELECT
      USING (
        user_id IN (
          SELECT clinic_id FROM public.user_profiles WHERE id = auth.uid()
        )
        OR public.is_super_admin()
      );
  END IF;
END $$;

-- User Profiles
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_profiles') THEN
    DROP POLICY IF EXISTS "Users can view profiles from their clinic" ON public.user_profiles;
    CREATE POLICY "Users can view profiles from their clinic"
      ON public.user_profiles
      FOR SELECT
      USING (
        clinic_id IN (
          SELECT clinic_id FROM public.user_profiles WHERE id = auth.uid()
        )
        OR public.is_super_admin()
      );
  END IF;
END $$;

-- Subscriptions (pulando - estrutura desconhecida)
-- DO $$
-- BEGIN
--   IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'subscriptions') THEN
--     -- A tabela subscriptions não segue o padrão user_id, ignorando por enquanto
--   END IF;
-- END $$;

-- Expenses
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'expenses') THEN
    DROP POLICY IF EXISTS "Users can view expenses from their clinic" ON public.expenses;
    CREATE POLICY "Users can view expenses from their clinic"
      ON public.expenses
      FOR SELECT
      USING (
        user_id IN (
          SELECT clinic_id FROM public.user_profiles WHERE id = auth.uid()
        )
        OR public.is_super_admin()
      );
  END IF;
END $$;

-- Cash Registers
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'cash_registers') THEN
    DROP POLICY IF EXISTS "Users can view cash registers from their clinic" ON public.cash_registers;
    CREATE POLICY "Users can view cash registers from their clinic"
      ON public.cash_registers
      FOR SELECT
      USING (
        user_id IN (
          SELECT clinic_id FROM public.user_profiles WHERE id = auth.uid()
        )
        OR public.is_super_admin()
      );
  END IF;
END $$;

-- Professionals
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'professionals') THEN
    DROP POLICY IF EXISTS "Users can view professionals from their clinic" ON public.professionals;
    CREATE POLICY "Users can view professionals from their clinic"
      ON public.professionals
      FOR SELECT
      USING (
        user_id IN (
          SELECT clinic_id FROM public.user_profiles WHERE id = auth.uid()
        )
        OR public.is_super_admin()
      );
  END IF;
END $$;

-- Verificar se você foi adicionado como super admin
SELECT
  sa.id,
  sa.email,
  sa.is_active,
  sa.created_at
FROM super_admins sa
ORDER BY sa.created_at DESC;
