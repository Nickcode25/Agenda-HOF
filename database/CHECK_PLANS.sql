-- Ver todos os planos e seus dados exatos
SELECT 
  id,
  name,
  description,
  price,
  has_trial,
  trial_days,
  is_active
FROM subscription_plans
ORDER BY price ASC;
