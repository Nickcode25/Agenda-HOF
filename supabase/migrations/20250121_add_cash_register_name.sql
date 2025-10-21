-- Add cash_register_name to cash_sessions table

ALTER TABLE cash_sessions
ADD COLUMN IF NOT EXISTS cash_register_name TEXT;

-- Update existing rows (if any) with the register name
UPDATE cash_sessions cs
SET cash_register_name = cr.name
FROM cash_registers cr
WHERE cs.cash_register_id = cr.id
  AND cs.cash_register_name IS NULL;
