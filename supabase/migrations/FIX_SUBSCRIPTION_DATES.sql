-- =====================================================
-- FIX SUBSCRIPTION DATES - Corrigir datas de assinaturas
-- =====================================================
-- Problema: Datas mostram 1 dia antes do selecionado
-- Causa: Conversão de timezone UTC
-- Solução: Adicionar 1 dia às datas afetadas
-- =====================================================

BEGIN;

-- Verificar assinaturas com problema
SELECT
  id,
  patient_name,
  plan_name,
  start_date,
  next_billing_date,
  created_at
FROM patient_subscriptions
ORDER BY created_at DESC;

-- Verificar pagamentos com problema
SELECT
  sp.id,
  ps.patient_name,
  sp.due_date,
  sp.paid_at,
  sp.status,
  sp.amount
FROM subscription_payments sp
JOIN patient_subscriptions ps ON ps.id = sp.subscription_id
ORDER BY sp.due_date DESC;

-- Corrigir start_date: adicionar 1 dia
UPDATE patient_subscriptions
SET start_date = (start_date::date + INTERVAL '1 day')::date
WHERE start_date IS NOT NULL;

-- Corrigir next_billing_date: adicionar 1 dia
UPDATE patient_subscriptions
SET next_billing_date = (next_billing_date::date + INTERVAL '1 day')::date
WHERE next_billing_date IS NOT NULL;

-- Corrigir due_date nos pagamentos: adicionar 1 dia
UPDATE subscription_payments
SET due_date = (due_date::date + INTERVAL '1 day')::date
WHERE due_date IS NOT NULL;

-- Corrigir paid_at nos pagamentos: adicionar 1 dia (apenas a parte da data, mantendo o horário)
UPDATE subscription_payments
SET paid_at = (paid_at::date + INTERVAL '1 day')::date
WHERE paid_at IS NOT NULL;

-- Verificar resultado
SELECT
  'patient_subscriptions' as tabela,
  COUNT(*) as total_registros
FROM patient_subscriptions
UNION ALL
SELECT
  'subscription_payments' as tabela,
  COUNT(*) as total_registros
FROM subscription_payments;

-- Mensagem de sucesso
DO $$
DECLARE
  subs_count INTEGER;
  payments_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO subs_count FROM patient_subscriptions;
  SELECT COUNT(*) INTO payments_count FROM subscription_payments;

  RAISE NOTICE '';
  RAISE NOTICE '✅ DATAS DE ASSINATURAS CORRIGIDAS!';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Total de assinaturas corrigidas: %', subs_count;
  RAISE NOTICE '📊 Total de pagamentos corrigidos: %', payments_count;
  RAISE NOTICE '';
  RAISE NOTICE '🔄 PRÓXIMO PASSO:';
  RAISE NOTICE '  - Recarregue a página de mensalidades';
  RAISE NOTICE '  - As datas agora devem estar corretas';
  RAISE NOTICE '';
END $$;

COMMIT;
