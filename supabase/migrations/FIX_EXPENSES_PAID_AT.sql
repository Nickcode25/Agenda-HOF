-- =====================================================
-- FIX EXPENSES PAID_AT - Corrigir despesas pagas sem data
-- =====================================================
-- Problema: Despesas com status 'paid' mas sem paid_at
-- não aparecem no relatório financeiro
-- Solução: Preencher paid_at com due_date ou created_at
-- =====================================================

BEGIN;

-- Verificar despesas com problema
SELECT
  id,
  description,
  amount,
  payment_status,
  due_date,
  paid_at,
  created_at
FROM expenses
WHERE payment_status = 'paid'
  AND paid_at IS NULL
ORDER BY created_at DESC;

-- Corrigir: Se tem due_date, usar due_date. Senão, usar created_at
UPDATE expenses
SET paid_at = COALESCE(due_date, DATE(created_at))
WHERE payment_status = 'paid'
  AND paid_at IS NULL;

-- Verificar resultado
SELECT
  payment_status,
  COUNT(*) as total,
  COUNT(CASE WHEN paid_at IS NOT NULL THEN 1 END) as com_paid_at,
  COUNT(CASE WHEN paid_at IS NULL THEN 1 END) as sem_paid_at
FROM expenses
GROUP BY payment_status;

-- Mensagem de sucesso
DO $$
DECLARE
  fixed_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO fixed_count
  FROM expenses
  WHERE payment_status = 'paid'
    AND paid_at IS NOT NULL;

  RAISE NOTICE '';
  RAISE NOTICE '✅ DESPESAS CORRIGIDAS!';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Total de despesas pagas com data: %', fixed_count;
  RAISE NOTICE '';
  RAISE NOTICE '🔄 PRÓXIMO PASSO:';
  RAISE NOTICE '  - Recarregue o relatório financeiro';
  RAISE NOTICE '  - As despesas agora devem aparecer';
  RAISE NOTICE '';
END $$;

COMMIT;
