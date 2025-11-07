-- =====================================================
-- DEBUG EXPENSES - Verificar despesas criadas hoje
-- =====================================================

-- Ver todas as despesas criadas hoje
SELECT
  id,
  description,
  amount,
  payment_status,
  payment_method,
  due_date,
  paid_at,
  created_at,
  category_name
FROM expenses
WHERE DATE(created_at) = CURRENT_DATE
ORDER BY created_at DESC;

-- Ver estatísticas
SELECT
  payment_status,
  COUNT(*) as total,
  SUM(amount) as soma_valores,
  COUNT(CASE WHEN paid_at IS NOT NULL THEN 1 END) as com_paid_at,
  COUNT(CASE WHEN paid_at IS NULL THEN 1 END) as sem_paid_at
FROM expenses
WHERE DATE(created_at) = CURRENT_DATE
GROUP BY payment_status;

-- Ver movimentações de caixa relacionadas a despesas de hoje
SELECT
  cm.id,
  cm.description,
  cm.amount,
  cm.category,
  cm.type,
  cm.cash_session_id,
  cm.created_at,
  cs.status as session_status,
  cs.closed_at
FROM cash_movements cm
LEFT JOIN cash_sessions cs ON cs.id = cm.cash_session_id
WHERE cm.category = 'expense'
  AND DATE(cm.created_at) = CURRENT_DATE
ORDER BY cm.created_at DESC;
