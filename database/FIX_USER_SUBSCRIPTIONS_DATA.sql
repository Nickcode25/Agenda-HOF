-- =====================================================
-- SCRIPT PARA CORRIGIR DADOS DE ASSINATURAS
-- =====================================================
-- Este script corrige os registros em user_subscriptions
-- que têm plan_type='basic' e plan_name=NULL mas deveriam
-- ser 'premium' baseado no plan_amount
-- =====================================================

-- 1. VERIFICAR ESTADO ATUAL
SELECT
  'ANTES DA CORREÇÃO' as status,
  id,
  user_id,
  plan_name,
  plan_type,
  plan_amount,
  status as subscription_status,
  created_at
FROM user_subscriptions
ORDER BY created_at DESC;

-- 2. CORRIGIR TODOS OS REGISTROS COM plan_amount >= 99 (Premium)
UPDATE user_subscriptions
SET
  plan_name = 'Plano Premium',
  plan_type = 'premium',
  updated_at = NOW()
WHERE plan_amount >= 99
  AND (plan_type = 'basic' OR plan_type IS NULL OR plan_name IS NULL);

-- 3. CORRIGIR REGISTROS COM plan_amount >= 79 E < 99 (Pro)
UPDATE user_subscriptions
SET
  plan_name = 'Plano Pro',
  plan_type = 'pro',
  updated_at = NOW()
WHERE plan_amount >= 79 AND plan_amount < 99
  AND (plan_type = 'basic' OR plan_type IS NULL OR plan_name IS NULL);

-- 4. CORRIGIR REGISTROS COM plan_amount < 79 (Basic)
-- Apenas define o plan_name se estiver NULL
UPDATE user_subscriptions
SET
  plan_name = 'Plano Básico',
  updated_at = NOW()
WHERE plan_amount < 79
  AND plan_name IS NULL;

-- 5. VERIFICAR RESULTADO
SELECT
  'DEPOIS DA CORREÇÃO' as status,
  id,
  user_id,
  plan_name,
  plan_type,
  plan_amount,
  status as subscription_status,
  created_at
FROM user_subscriptions
ORDER BY created_at DESC;

-- 6. RESUMO
SELECT
  plan_type,
  plan_name,
  COUNT(*) as total,
  MIN(plan_amount) as min_amount,
  MAX(plan_amount) as max_amount
FROM user_subscriptions
GROUP BY plan_type, plan_name
ORDER BY plan_type;
