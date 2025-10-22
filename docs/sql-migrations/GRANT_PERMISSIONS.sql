-- =====================================================
-- CONCEDER PERMISSÕES DIRETAS PARA A ROLE AUTHENTICATED
-- =====================================================

-- Conceder todas as permissões na tabela discount_coupons
GRANT ALL ON TABLE public.discount_coupons TO authenticated;
GRANT ALL ON TABLE public.coupon_usage TO authenticated;

-- Conceder permissões para usar as sequences (para IDs auto-gerados)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Verificar permissões concedidas
SELECT
  grantee,
  table_schema,
  table_name,
  privilege_type
FROM information_schema.table_privileges
WHERE table_name IN ('discount_coupons', 'coupon_usage')
  AND grantee = 'authenticated'
ORDER BY table_name, privilege_type;

-- Mensagem
DO $$
BEGIN
  RAISE NOTICE '✅ Permissões concedidas para role authenticated!';
  RAISE NOTICE '📋 A role authenticated agora tem acesso total às tabelas de cupons';
END $$;
