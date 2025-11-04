-- =====================================================
-- FIX COMPLETO PARA ADMIN DASHBOARD
-- Execute este SQL no Supabase SQL Editor
-- Resolve: RLS, View, e Permissões
-- =====================================================

-- ========================================
-- PARTE 1: SUPER ADMIN
-- ========================================

-- 1. Garantir que a tabela super_admins existe
CREATE TABLE IF NOT EXISTS public.super_admins (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true
);

-- 2. Habilitar RLS
ALTER TABLE public.super_admins ENABLE ROW LEVEL SECURITY;

-- 3. Policy para ver próprios dados
DROP POLICY IF EXISTS "Super admins can view their own data" ON public.super_admins;
CREATE POLICY "Super admins can view their own data"
  ON public.super_admins
  FOR SELECT
  USING (auth.uid() = id);

-- 4. Adicionar admin
INSERT INTO public.super_admins (id, email)
SELECT id, email
FROM auth.users
WHERE email = 'agendahof.site@gmail.com'
ON CONFLICT (id) DO NOTHING;

-- 5. Função helper
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

-- ========================================
-- PARTE 2: POLÍTICAS RLS EM USER_SUBSCRIPTIONS
-- ========================================

-- 6. Policies para super admin em user_subscriptions
DROP POLICY IF EXISTS "Super admin can view all subscriptions" ON user_subscriptions;
CREATE POLICY "Super admin can view all subscriptions"
  ON user_subscriptions
  FOR SELECT
  USING (public.is_super_admin());

DROP POLICY IF EXISTS "Super admin can update all subscriptions" ON user_subscriptions;
CREATE POLICY "Super admin can update all subscriptions"
  ON user_subscriptions
  FOR UPDATE
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "Super admin can delete all subscriptions" ON user_subscriptions;
CREATE POLICY "Super admin can delete all subscriptions"
  ON user_subscriptions
  FOR DELETE
  USING (public.is_super_admin());

-- ========================================
-- PARTE 3: RECRIAR VIEW SUBSCRIBERS_VIEW
-- ========================================

-- 7. Dropar e recriar a view
DROP VIEW IF EXISTS public.subscribers_view CASCADE;

CREATE OR REPLACE VIEW public.subscribers_view AS
SELECT
  -- Dados da assinatura
  us.id as subscription_id,
  us.user_id,
  us.mercadopago_subscription_id,
  us.status as subscription_status,
  us.plan_amount,
  us.billing_cycle,
  us.next_billing_date,
  us.last_payment_date,
  us.payment_method,
  us.card_last_digits,
  us.card_brand,
  us.discount_percentage,
  us.coupon_id,
  us.started_at,
  us.suspended_at,
  us.cancelled_at,
  us.created_at as subscription_created_at,

  -- Dados do usuário (auth.users)
  u.email,
  u.raw_user_meta_data->>'name' as name,
  u.raw_user_meta_data->>'cpf' as cpf,
  u.raw_user_meta_data->>'phone' as phone,
  u.created_at as user_created_at,
  u.last_sign_in_at,

  -- Dados do cupom (se houver)
  dc.code as coupon_code,
  dc.discount_percentage as coupon_discount_percentage

FROM user_subscriptions us
LEFT JOIN auth.users u ON us.user_id = u.id
LEFT JOIN discount_coupons dc ON us.coupon_id = dc.id
ORDER BY us.created_at DESC;

-- 8. Comentário
COMMENT ON VIEW public.subscribers_view IS 'View que junta dados de assinaturas com informações completas dos usuários e cupons';

-- 9. Conceder permissões na view
GRANT SELECT ON public.subscribers_view TO service_role;
GRANT SELECT ON public.subscribers_view TO authenticated;
GRANT SELECT ON public.subscribers_view TO anon;

-- ========================================
-- PARTE 4: VERIFICAÇÕES E TESTES
-- ========================================

-- 10. Verificar configuração
DO $$
DECLARE
  admin_exists boolean;
  view_exists boolean;
  subs_count integer;
  view_count integer;
BEGIN
  -- Verificar super admin
  SELECT EXISTS(SELECT 1 FROM public.super_admins WHERE email = 'agendahof.site@gmail.com') INTO admin_exists;

  -- Verificar view
  SELECT EXISTS(SELECT FROM pg_views WHERE schemaname = 'public' AND viewname = 'subscribers_view') INTO view_exists;

  -- Contar assinaturas
  SELECT COUNT(*) INTO subs_count FROM user_subscriptions;
  SELECT COUNT(*) INTO view_count FROM public.subscribers_view;

  -- Mensagens
  IF admin_exists THEN
    RAISE NOTICE '✅ Super admin agendahof.site@gmail.com configurado';
  ELSE
    RAISE NOTICE '❌ ERRO: Super admin NÃO foi adicionado!';
  END IF;

  IF view_exists THEN
    RAISE NOTICE '✅ View subscribers_view criada';
  ELSE
    RAISE NOTICE '❌ ERRO: View NÃO foi criada!';
  END IF;

  RAISE NOTICE '📊 Total de assinaturas na tabela: %', subs_count;
  RAISE NOTICE '📊 Total de assinaturas visíveis na view: %', view_count;

  IF subs_count = view_count THEN
    RAISE NOTICE '✅ View está retornando TODAS as assinaturas';
  ELSE
    RAISE NOTICE '⚠️ ATENÇÃO: View retorna menos registros que a tabela!';
  END IF;

  RAISE NOTICE '🎉 Configuração concluída! Teste o dashboard agora.';
END $$;

-- 11. Mostrar dados da view para conferência
SELECT
  'Dados visíveis na view:' as info,
  subscription_status,
  name,
  email,
  plan_amount,
  discount_percentage,
  (plan_amount * (1 - discount_percentage / 100.0)) as valor_real
FROM public.subscribers_view
ORDER BY subscription_created_at DESC;
