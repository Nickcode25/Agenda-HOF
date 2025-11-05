-- Atualizar preços dos planos baseado nos valores atuais
-- Plano que está em ~50 → 49.90
-- Plano que está em ~100 → 99.90

-- Atualizar plano básico (preço atual próximo de 50)
UPDATE subscription_plans
SET price = 49.90
WHERE price >= 48 AND price <= 52;

-- Atualizar plano premium (preço atual próximo de 100)
UPDATE subscription_plans
SET price = 99.90
WHERE price >= 95 AND price <= 105;

-- Verificar resultados
SELECT
  id,
  name,
  price,
  has_trial,
  trial_days,
  is_active
FROM subscription_plans
ORDER BY price ASC;
