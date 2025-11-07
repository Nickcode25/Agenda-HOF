-- =====================================================
-- DEBUG SUBSCRIPTION DATES - Verificar datas de assinaturas
-- =====================================================

-- Ver todas as assinaturas
SELECT
  id,
  patient_name,
  plan_name,
  start_date,
  next_billing_date,
  status,
  created_at
FROM patient_subscriptions
ORDER BY created_at DESC;

-- Ver todos os pagamentos
SELECT
  sp.id,
  ps.patient_name,
  ps.plan_name,
  sp.due_date,
  sp.paid_at,
  sp.status,
  sp.amount,
  sp.payment_method
FROM subscription_payments sp
JOIN patient_subscriptions ps ON ps.id = sp.subscription_id
ORDER BY sp.due_date DESC;

-- Ver estatísticas
SELECT
  status,
  COUNT(*) as total_assinaturas,
  SUM((SELECT COUNT(*) FROM subscription_payments WHERE subscription_id = patient_subscriptions.id)) as total_pagamentos
FROM patient_subscriptions
GROUP BY status;
