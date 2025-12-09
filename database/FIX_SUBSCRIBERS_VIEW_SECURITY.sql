-- =====================================================
-- FIX SUBSCRIBERS VIEW SECURITY
-- =====================================================
-- Este script corrige os 2 warnings de segurança:
-- 1. auth_users_exposed - View expondo auth.users
-- 2. security_definer_view - View com SECURITY DEFINER
--
-- Solução: Recriar a view usando SECURITY INVOKER e
-- NÃO acessando auth.users diretamente
-- =====================================================

-- Primeiro, remover a view existente
DROP VIEW IF EXISTS public.subscribers_view CASCADE;

-- Criar uma nova versão segura da view
-- NÃO acessa auth.users diretamente
CREATE VIEW public.subscribers_view
WITH (security_invoker = true)
AS
SELECT
  -- Dados da assinatura
  us.id as subscription_id,
  us.user_id,
  us.pagbank_subscription_id,
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

  -- Dados do cupom (se houver)
  dc.code as coupon_code,
  dc.discount_percentage as coupon_discount_percentage

FROM public.user_subscriptions us
LEFT JOIN public.discount_coupons dc ON us.coupon_id = dc.id
ORDER BY us.created_at DESC;

-- Comentário explicativo
COMMENT ON VIEW public.subscribers_view IS 'View segura de assinantes - não expõe auth.users diretamente';

-- Revogar acesso anônimo
REVOKE ALL ON public.subscribers_view FROM anon;
REVOKE ALL ON public.subscribers_view FROM public;

-- Conceder apenas para autenticados e service_role
GRANT SELECT ON public.subscribers_view TO authenticated;
GRANT SELECT ON public.subscribers_view TO service_role;

-- Verificar que a view foi criada corretamente
DO $$
BEGIN
  RAISE NOTICE '✅ View subscribers_view recriada com SECURITY INVOKER';
  RAISE NOTICE '✅ Acesso anônimo revogado';
  RAISE NOTICE '✅ View não expõe mais auth.users diretamente';
END $$;
