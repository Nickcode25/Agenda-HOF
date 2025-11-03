-- ============================================
-- Corrigir Assinaturas com Pagamento Recusado
-- ============================================
-- Este script corrige assinaturas que foram
-- marcadas como ativas mas o pagamento foi
-- recusado pelo Mercado Pago
-- ============================================

-- 1. Verificar assinaturas suspeitas (criadas ontem com valor R$ 2,20)
SELECT
  id,
  user_id,
  mercadopago_subscription_id,
  status,
  plan_amount,
  discount_percentage,
  created_at,
  updated_at
FROM user_subscriptions
WHERE created_at >= NOW() - INTERVAL '2 days'
  AND plan_amount < 10 -- Cupom de 98% = R$ 2,20
ORDER BY created_at DESC;

-- 2. Desativar assinaturas com pagamento recusado
-- ATENÇÃO: Execute apenas após confirmar que são as assinaturas corretas!

UPDATE user_subscriptions
SET
  status = 'payment_failed',
  updated_at = NOW()
WHERE id IN (
  -- Substitua pelos IDs específicos encontrados na query acima
  -- Exemplo: '123e4567-e89b-12d3-a456-426614174000'
  -- Deixe vazio por segurança - preencha manualmente
);

-- 3. Verificar resultado
SELECT
  id,
  user_id,
  status,
  plan_amount,
  mercadopago_subscription_id,
  updated_at
FROM user_subscriptions
WHERE status = 'payment_failed'
ORDER BY updated_at DESC
LIMIT 10;

-- ============================================
-- PARA EXECUTAR MANUALMENTE NO SUPABASE:
-- ============================================
-- 1. Acesse: https://supabase.com/dashboard/project/SEU_PROJECT/editor
-- 2. Execute a query SELECT (item 1) para ver as assinaturas
-- 3. Copie o ID da assinatura da Natália
-- 4. Execute o UPDATE (item 2) com o ID correto
-- 5. Execute o SELECT (item 3) para confirmar
-- ============================================
