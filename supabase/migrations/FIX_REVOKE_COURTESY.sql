-- =====================================================
-- CORRIGIR REVOGAÇÃO DE CORTESIA
-- Executar no SQL Editor do Supabase
-- Data: 2025-12-10
-- =====================================================
--
-- PROBLEMA: Quando uma cortesia é revogada, o trial_end_date
-- do usuário NÃO é limpo, fazendo com que o usuário ainda
-- tenha acesso via "período de teste" mesmo após revogação.
--
-- SOLUÇÃO: Atualizar a função admin_revoke_courtesy para
-- também limpar o trial_end_date do usuário.
-- =====================================================

-- Recriar função admin_revoke_courtesy com limpeza do trial_end_date
DROP FUNCTION IF EXISTS admin_revoke_courtesy(UUID);

CREATE OR REPLACE FUNCTION admin_revoke_courtesy(
  p_subscription_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se o usuário atual é super admin
  IF NOT is_super_admin() THEN
    RAISE EXCEPTION 'Acesso negado. Apenas super admins podem revogar cortesias.';
  END IF;

  -- Buscar o user_id da assinatura antes de cancelar
  SELECT user_id INTO v_user_id
  FROM user_subscriptions
  WHERE id = p_subscription_id;

  -- Atualizar o status da assinatura para cancelled
  UPDATE user_subscriptions
  SET
    status = 'cancelled',
    updated_at = NOW()
  WHERE id = p_subscription_id;

  -- IMPORTANTE: Limpar o trial_end_date do usuário para evitar
  -- que ele continue tendo acesso via período de teste
  IF v_user_id IS NOT NULL THEN
    UPDATE auth.users
    SET raw_user_meta_data =
      raw_user_meta_data - 'trial_end_date'
    WHERE id = v_user_id;
  END IF;
END;
$$;

-- Conceder permissão de execução
GRANT EXECUTE ON FUNCTION admin_revoke_courtesy(UUID) TO authenticated;

-- =====================================================
-- LIMPAR USUÁRIOS QUE JÁ TIVERAM CORTESIA REVOGADA
-- =====================================================
-- Este script limpa o trial_end_date de usuários que:
-- 1. Têm assinatura com status 'cancelled' e discount_percentage = 100 (cortesia revogada)
-- 2. NÃO têm nenhuma assinatura ativa
-- =====================================================

UPDATE auth.users u
SET raw_user_meta_data = raw_user_meta_data - 'trial_end_date'
WHERE EXISTS (
  -- Tem cortesia cancelada
  SELECT 1 FROM user_subscriptions us
  WHERE us.user_id = u.id
    AND us.status = 'cancelled'
    AND us.discount_percentage = 100
)
AND NOT EXISTS (
  -- Mas não tem nenhuma assinatura ativa
  SELECT 1 FROM user_subscriptions us2
  WHERE us2.user_id = u.id
    AND us2.status = 'active'
);

SELECT 'Função admin_revoke_courtesy corrigida!' as resultado;
