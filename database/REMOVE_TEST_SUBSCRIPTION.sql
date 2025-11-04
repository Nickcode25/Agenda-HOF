-- =====================================================
-- REMOVER ASSINATURA DE TESTE
-- =====================================================

-- CONTEXTO:
-- Assinatura da Rosiane (rosiane@teste.com) foi criada com
-- credenciais de TESTE do Mercado Pago e foi aprovada automaticamente.
-- Agora que os testes foram concluídos, vamos removê-la.

-- =====================================================
-- VER ASSINATURA ANTES DE REMOVER
-- =====================================================

SELECT
  'ANTES DA REMOÇÃO' as status,
  u.email,
  u.raw_user_meta_data->>'full_name' as nome,
  us.status,
  us.plan_amount,
  us.mercadopago_subscription_id,
  us.created_at
FROM user_subscriptions us
JOIN auth.users u ON us.user_id = u.id
WHERE us.id = '7210dca0-7f38-4dc0-ad13-7a99866018c6';

-- =====================================================
-- CANCELAR ASSINATURA DE TESTE
-- =====================================================

UPDATE user_subscriptions
SET
  status = 'cancelled',
  cancelled_at = NOW()
WHERE id = '7210dca0-7f38-4dc0-ad13-7a99866018c6';

-- =====================================================
-- VERIFICAR RESULTADO
-- =====================================================

SELECT
  'DEPOIS DA REMOÇÃO' as status,
  u.email,
  u.raw_user_meta_data->>'full_name' as nome,
  us.status,
  us.plan_amount,
  us.mercadopago_subscription_id,
  us.created_at,
  us.cancelled_at
FROM user_subscriptions us
JOIN auth.users u ON us.user_id = u.id
WHERE us.id = '7210dca0-7f38-4dc0-ad13-7a99866018c6';

-- Ver todas as assinaturas ativas (deve estar vazio)
SELECT
  'ASSINATURAS ATIVAS RESTANTES' as info,
  u.email,
  us.status,
  us.plan_amount
FROM user_subscriptions us
JOIN auth.users u ON us.user_id = u.id
WHERE us.status = 'active';

-- Mensagem final
DO $$
DECLARE
  active_count integer;
BEGIN
  SELECT COUNT(*) INTO active_count
  FROM user_subscriptions
  WHERE status = 'active';

  RAISE NOTICE '✅ Assinatura de teste removida!';
  RAISE NOTICE '';
  RAISE NOTICE '📊 RESULTADO:';
  RAISE NOTICE '  - Assinaturas ativas: %', active_count;
  RAISE NOTICE '  - Dashboard deve mostrar: 0 assinaturas ativas';
  RAISE NOTICE '  - Receita total: R$ 0.00';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️ PRÓXIMO PASSO:';
  RAISE NOTICE '  - Recarregue o Admin Dashboard';
  RAISE NOTICE '  - Sistema está limpo e pronto para assinaturas reais';
END $$;
