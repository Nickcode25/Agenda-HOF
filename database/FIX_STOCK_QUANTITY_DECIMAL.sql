-- Fix: Alterar coluna quantity para aceitar valores decimais
-- Problema: Coluna está como INTEGER mas precisa ser NUMERIC para aceitar 0.25, 0.5, etc
-- Execute este SQL no Supabase SQL Editor

-- Alterar tipo da coluna quantity para NUMERIC(10, 2)
ALTER TABLE stock
ALTER COLUMN quantity TYPE NUMERIC(10, 2);

-- Alterar tipo da coluna min_quantity para NUMERIC(10, 2)
ALTER TABLE stock
ALTER COLUMN min_quantity TYPE NUMERIC(10, 2);

-- Verificar se funcionou
SELECT column_name, data_type, numeric_precision, numeric_scale
FROM information_schema.columns
WHERE table_name = 'stock'
  AND column_name IN ('quantity', 'min_quantity');

-- Deve retornar:
-- quantity     | numeric | 10 | 2
-- min_quantity | numeric | 10 | 2
