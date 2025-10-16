-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own sales professionals" ON sales_professionals;
DROP POLICY IF EXISTS "Users can insert their own sales professionals" ON sales_professionals;
DROP POLICY IF EXISTS "Users can update their own sales professionals" ON sales_professionals;
DROP POLICY IF EXISTS "Users can delete their own sales professionals" ON sales_professionals;

-- Drop existing indexes if they exist
DROP INDEX IF EXISTS idx_sales_professionals_user_id;
DROP INDEX IF EXISTS idx_sales_professionals_created_at;

-- Drop table if exists (cuidado: isso vai apagar os dados)
DROP TABLE IF EXISTS sales_professionals;

-- Create sales_professionals table
CREATE TABLE sales_professionals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  cpf TEXT,
  phone TEXT,
  email TEXT,
  birth_date DATE,
  specialty TEXT,
  registration_number TEXT,
  clinic TEXT,
  cep TEXT,
  street TEXT,
  number TEXT,
  complement TEXT,
  neighborhood TEXT,
  city TEXT,
  state TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE sales_professionals ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own sales professionals"
  ON sales_professionals
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sales professionals"
  ON sales_professionals
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sales professionals"
  ON sales_professionals
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sales professionals"
  ON sales_professionals
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for faster queries
CREATE INDEX idx_sales_professionals_user_id ON sales_professionals(user_id);
CREATE INDEX idx_sales_professionals_created_at ON sales_professionals(created_at DESC);
