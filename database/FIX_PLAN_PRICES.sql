-- Corrigir preços dos planos

-- Atualizar Plano Básico para R$ 49,90
UPDATE subscription_plans
SET price = 49.90
WHERE name = 'Plano Básico';

-- Atualizar Plano Premium para R$ 99,90  
UPDATE subscription_plans
SET price = 99.90
WHERE name = 'Plano Premium';

-- Verificar valores atualizados
SELECT 
  name,
  price,
  has_trial,
  trial_days
FROM subscription_plans
ORDER BY price ASC;
