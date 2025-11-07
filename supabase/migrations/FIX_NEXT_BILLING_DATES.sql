-- =====================================================
-- FIX NEXT BILLING DATES - Corrigir datas de próxima cobrança
-- =====================================================
-- Problema: Próxima cobrança está 1 dia após o devido
-- Causa: Uso incorreto de setMonth() que adiciona dias extras
-- Solução: Recalcular next_billing_date baseado em start_date
-- =====================================================

BEGIN;

-- Verificar assinaturas antes da correção
SELECT
  id,
  patient_name,
  plan_name,
  start_date,
  next_billing_date,
  EXTRACT(DAY FROM start_date) as dia_inicio,
  EXTRACT(DAY FROM next_billing_date) as dia_proxima_cobranca
FROM patient_subscriptions
ORDER BY created_at DESC;

-- Corrigir next_billing_date para ser exatamente o mesmo dia do mês seguinte
UPDATE patient_subscriptions
SET next_billing_date = (
  -- Pega a data de início e adiciona 1 mês mantendo o mesmo dia
  DATE_TRUNC('month', start_date) + INTERVAL '1 month' +
  (EXTRACT(DAY FROM start_date) - 1) * INTERVAL '1 day'
)::date
WHERE next_billing_date IS NOT NULL
  AND start_date IS NOT NULL;

-- Verificar resultado
SELECT
  id,
  patient_name,
  plan_name,
  start_date,
  next_billing_date,
  EXTRACT(DAY FROM start_date) as dia_inicio,
  EXTRACT(DAY FROM next_billing_date) as dia_proxima_cobranca,
  CASE
    WHEN EXTRACT(DAY FROM start_date) = EXTRACT(DAY FROM next_billing_date)
    THEN '✅ Correto'
    ELSE '❌ Diferente'
  END as status
FROM patient_subscriptions
ORDER BY created_at DESC;

-- Mensagem de sucesso
DO $$
DECLARE
  total_count INTEGER;
  corrected_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_count
  FROM patient_subscriptions
  WHERE next_billing_date IS NOT NULL;

  SELECT COUNT(*) INTO corrected_count
  FROM patient_subscriptions
  WHERE next_billing_date IS NOT NULL
    AND EXTRACT(DAY FROM start_date) = EXTRACT(DAY FROM next_billing_date);

  RAISE NOTICE '';
  RAISE NOTICE '✅ DATAS DE PRÓXIMA COBRANÇA CORRIGIDAS!';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Total de assinaturas: %', total_count;
  RAISE NOTICE '✅ Assinaturas com data correta: %', corrected_count;
  RAISE NOTICE '';
  RAISE NOTICE '🔄 PRÓXIMO PASSO:';
  RAISE NOTICE '  - Recarregue a página de mensalidades';
  RAISE NOTICE '  - As datas de próxima cobrança agora devem estar no mesmo dia do mês';
  RAISE NOTICE '';
END $$;

COMMIT;
