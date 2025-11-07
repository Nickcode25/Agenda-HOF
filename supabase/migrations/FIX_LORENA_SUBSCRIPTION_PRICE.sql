-- =====================================================
-- FIX LORENA SUBSCRIPTION PRICE - Corrigir preço da assinatura da Lorena
-- =====================================================
-- Problema: Assinatura foi criada com preço do plano mas deveria ter desconto
-- Solução: Atualizar o campo price na assinatura para o valor correto
-- =====================================================

BEGIN;

-- Verificar assinatura da Lorena antes da correção
SELECT
  id,
  patient_name,
  plan_name,
  price,
  start_date,
  status
FROM patient_subscriptions
WHERE patient_name ILIKE '%Lorena%Freitas%Aquino%Fialho%'
ORDER BY created_at DESC;

-- Verificar pagamentos da Lorena
SELECT
  sp.id,
  ps.patient_name,
  sp.amount,
  sp.due_date,
  sp.paid_at,
  sp.status
FROM subscription_payments sp
JOIN patient_subscriptions ps ON ps.id = sp.subscription_id
WHERE ps.patient_name ILIKE '%Lorena%Freitas%Aquino%Fialho%'
ORDER BY sp.due_date DESC;

-- Atualizar preço da assinatura para R$ 215,00
-- (baseado no valor do primeiro pagamento)
UPDATE patient_subscriptions
SET price = (
  SELECT amount
  FROM subscription_payments
  WHERE subscription_id = patient_subscriptions.id
  ORDER BY created_at ASC
  LIMIT 1
)
WHERE patient_name ILIKE '%Lorena%Freitas%Aquino%Fialho%'
  AND EXISTS (
    SELECT 1
    FROM subscription_payments
    WHERE subscription_id = patient_subscriptions.id
    AND amount = 215.00
    LIMIT 1
  );

-- Verificar resultado
SELECT
  id,
  patient_name,
  plan_name,
  price,
  start_date,
  status
FROM patient_subscriptions
WHERE patient_name ILIKE '%Lorena%Freitas%Aquino%Fialho%'
ORDER BY created_at DESC;

-- Mensagem de sucesso
DO $$
DECLARE
  updated_price NUMERIC(10, 2);
BEGIN
  SELECT price INTO updated_price
  FROM patient_subscriptions
  WHERE patient_name ILIKE '%Lorena%Freitas%Aquino%Fialho%'
  LIMIT 1;

  RAISE NOTICE '';
  RAISE NOTICE '✅ PREÇO DA ASSINATURA CORRIGIDO!';
  RAISE NOTICE '';
  RAISE NOTICE '👤 Paciente: Lorena de Freitas Aquino Fialho';
  RAISE NOTICE '💰 Novo preço da assinatura: R$ %', updated_price;
  RAISE NOTICE '';
  RAISE NOTICE '📝 NOTA:';
  RAISE NOTICE '  - Todos os próximos pagamentos usarão R$ %', updated_price;
  RAISE NOTICE '  - O desconto agora é permanente para esta assinante';
  RAISE NOTICE '';
END $$;

COMMIT;
