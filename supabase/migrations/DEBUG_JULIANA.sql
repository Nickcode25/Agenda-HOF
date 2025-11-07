-- =====================================================
-- DEBUG JULIANA - Verificar assinatura da Juliana
-- =====================================================

-- Ver assinatura da Juliana
SELECT
  id,
  patient_name,
  plan_name,
  price as preco_assinatura,
  start_date,
  next_billing_date,
  status,
  created_at
FROM patient_subscriptions
WHERE patient_name ILIKE '%Juliana%'
ORDER BY created_at DESC;

-- Ver pagamentos da Juliana
SELECT
  sp.id,
  ps.patient_name,
  sp.amount as valor_pagamento,
  sp.due_date,
  sp.paid_at,
  sp.status,
  sp.payment_method,
  sp.created_at
FROM subscription_payments sp
JOIN patient_subscriptions ps ON ps.id = sp.subscription_id
WHERE ps.patient_name ILIKE '%Juliana%'
ORDER BY sp.created_at ASC;
