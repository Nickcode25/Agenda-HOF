-- Fix Cash Tables - Add missing fields and permissions

-- Add updated_at to cash_registers if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cash_registers' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE cash_registers ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- Grant permissions
GRANT ALL ON cash_registers TO anon, authenticated, service_role;
GRANT ALL ON cash_sessions TO anon, authenticated, service_role;
GRANT ALL ON cash_movements TO anon, authenticated, service_role;

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE cash_registers;
ALTER PUBLICATION supabase_realtime ADD TABLE cash_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE cash_movements;

-- Verify permissions
SELECT
  grantee,
  privilege_type,
  table_name
FROM information_schema.table_privileges
WHERE table_name IN ('cash_registers', 'cash_sessions', 'cash_movements')
  AND grantee IN ('anon', 'authenticated')
ORDER BY table_name, grantee;
