-- =====================================================
-- FIX ADMIN ACCESS TO USER_SUBSCRIPTIONS
-- Execute este SQL no Supabase SQL Editor
-- =====================================================

-- 1. Garantir que a tabela super_admins existe
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

-- 4. Adicionar admin como super admin
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

-- 6. ADICIONAR POLICY PARA SUPER ADMIN VER TODAS AS ASSINATURAS
DROP POLICY IF EXISTS "Super admin can view all subscriptions" ON user_subscriptions;
CREATE POLICY "Super admin can view all subscriptions"
  ON user_subscriptions
  FOR SELECT
  USING (public.is_super_admin());

-- 7. ADICIONAR POLICY PARA SUPER ADMIN ATUALIZAR TODAS AS ASSINATURAS
DROP POLICY IF EXISTS "Super admin can update all subscriptions" ON user_subscriptions;
CREATE POLICY "Super admin can update all subscriptions"
  ON user_subscriptions
  FOR UPDATE
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- 8. ADICIONAR POLICY PARA SUPER ADMIN DELETAR TODAS AS ASSINATURAS
DROP POLICY IF EXISTS "Super admin can delete all subscriptions" ON user_subscriptions;
CREATE POLICY "Super admin can delete all subscriptions"
  ON user_subscriptions
  FOR DELETE
  USING (public.is_super_admin());

-- 9. Verificar se o admin foi adicionado corretamente
DO $$
DECLARE
  admin_exists boolean;
BEGIN
  SELECT EXISTS(SELECT 1 FROM public.super_admins WHERE email = 'agendahof.site@gmail.com') INTO admin_exists;

  IF admin_exists THEN
    RAISE NOTICE '✅ Super admin agendahof.site@gmail.com configurado com sucesso!';
    RAISE NOTICE '✅ Políticas RLS adicionadas para user_subscriptions';
    RAISE NOTICE '✅ Agora o admin pode ver todas as assinaturas no dashboard';
  ELSE
    RAISE NOTICE '⚠️ ATENÇÃO: Super admin não foi adicionado. Verifique se o email existe em auth.users';
  END IF;
END $$;

-- 10. Testar se está funcionando
SELECT
  'Total de super admins:' as info,
  COUNT(*) as quantidade
FROM public.super_admins;

SELECT
  'Total de assinaturas visíveis:' as info,
  COUNT(*) as quantidade
FROM user_subscriptions;
