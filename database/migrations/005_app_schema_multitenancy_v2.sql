-- ========================================
-- SCHEMA COMPLETO - VERSÃO 2 (SEM ERROS)
-- ========================================
-- Limpa policies antigas e recria tudo

-- Habilitar UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- LIMPAR POLICIES ANTIGAS
-- ========================================

DO $$ 
BEGIN
  -- Patients
  DROP POLICY IF EXISTS "Users can view their own patients" ON patients;
  DROP POLICY IF EXISTS "Users can insert their own patients" ON patients;
  DROP POLICY IF EXISTS "Users can update their own patients" ON patients;
  DROP POLICY IF EXISTS "Users can delete their own patients" ON patients;
  
  -- Procedures
  DROP POLICY IF EXISTS "Users can view their own procedures" ON procedures;
  DROP POLICY IF EXISTS "Users can insert their own procedures" ON procedures;
  DROP POLICY IF EXISTS "Users can update their own procedures" ON procedures;
  DROP POLICY IF EXISTS "Users can delete their own procedures" ON procedures;
  
  -- Professionals
  DROP POLICY IF EXISTS "Users can view their own professionals" ON professionals;
  DROP POLICY IF EXISTS "Users can insert their own professionals" ON professionals;
  DROP POLICY IF EXISTS "Users can update their own professionals" ON professionals;
  DROP POLICY IF EXISTS "Users can delete their own professionals" ON professionals;
  
  -- Appointments
  DROP POLICY IF EXISTS "Users can view their own appointments" ON appointments;
  DROP POLICY IF EXISTS "Users can insert their own appointments" ON appointments;
  DROP POLICY IF EXISTS "Users can update their own appointments" ON appointments;
  DROP POLICY IF EXISTS "Users can delete their own appointments" ON appointments;
  
  -- Waitlist
  DROP POLICY IF EXISTS "Users can view their own waitlist" ON waitlist;
  DROP POLICY IF EXISTS "Users can insert their own waitlist" ON waitlist;
  DROP POLICY IF EXISTS "Users can update their own waitlist" ON waitlist;
  DROP POLICY IF EXISTS "Users can delete their own waitlist" ON waitlist;
  
  -- Stock
  DROP POLICY IF EXISTS "Users can view their own stock" ON stock;
  DROP POLICY IF EXISTS "Users can insert their own stock" ON stock;
  DROP POLICY IF EXISTS "Users can update their own stock" ON stock;
  DROP POLICY IF EXISTS "Users can delete their own stock" ON stock;
  
  -- Sales
  DROP POLICY IF EXISTS "Users can view their own sales" ON sales;
  DROP POLICY IF EXISTS "Users can insert their own sales" ON sales;
  DROP POLICY IF EXISTS "Users can update their own sales" ON sales;
  DROP POLICY IF EXISTS "Users can delete their own sales" ON sales;
  
  -- Subscription Plans
  DROP POLICY IF EXISTS "Users can view their own plans" ON subscription_plans;
  DROP POLICY IF EXISTS "Users can insert their own plans" ON subscription_plans;
  DROP POLICY IF EXISTS "Users can update their own plans" ON subscription_plans;
  DROP POLICY IF EXISTS "Users can delete their own plans" ON subscription_plans;
  
  -- Subscriptions
  DROP POLICY IF EXISTS "Users can view their own subscriptions" ON subscriptions;
  DROP POLICY IF EXISTS "Users can insert their own subscriptions" ON subscriptions;
  DROP POLICY IF EXISTS "Users can update their own subscriptions" ON subscriptions;
  DROP POLICY IF EXISTS "Users can delete their own subscriptions" ON subscriptions;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- ========================================
-- CRIAR TABELAS
-- ========================================

CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  cpf TEXT,
  phone TEXT,
  email TEXT,
  birth_date DATE,
  address TEXT,
  notes TEXT,
  planned_procedures JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS procedures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  duration_minutes INT DEFAULT 60,
  category TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS professionals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  specialty TEXT,
  phone TEXT,
  email TEXT,
  cro TEXT,
  address TEXT,
  zip_code TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  patient_name TEXT NOT NULL,
  professional_id UUID REFERENCES professionals(id) ON DELETE SET NULL,
  professional_name TEXT,
  procedure_id UUID REFERENCES procedures(id) ON DELETE SET NULL,
  procedure_name TEXT NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'done', 'cancelled')),
  notes TEXT,
  selected_products JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS waitlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  patient_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  procedure_name TEXT NOT NULL,
  preferred_date DATE,
  notes TEXT,
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'contacted', 'scheduled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stock (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  category TEXT,
  quantity INT DEFAULT 0,
  min_quantity INT DEFAULT 0,
  unit TEXT DEFAULT 'un',
  supplier TEXT,
  cost_price NUMERIC(10, 2) DEFAULT 0,
  sale_price NUMERIC(10, 2) DEFAULT 0,
  barcode TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  sale_type TEXT NOT NULL CHECK (sale_type IN ('product', 'procedure', 'other')),
  customer_name TEXT,
  items JSONB DEFAULT '[]',
  total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  payment_method TEXT,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'cancelled')),
  notes TEXT,
  sale_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL,
  billing_cycle TEXT DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'quarterly', 'semiannual', 'annual')),
  features JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_id UUID REFERENCES subscription_plans(id) ON DELETE SET NULL,
  subscriber_name TEXT NOT NULL,
  subscriber_phone TEXT,
  subscriber_email TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  payment_day INT DEFAULT 1,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- ÍNDICES
-- ========================================

CREATE INDEX IF NOT EXISTS idx_patients_user_id ON patients(user_id);
CREATE INDEX IF NOT EXISTS idx_procedures_user_id ON procedures(user_id);
CREATE INDEX IF NOT EXISTS idx_professionals_user_id ON professionals(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_user_id ON waitlist(user_id);
CREATE INDEX IF NOT EXISTS idx_stock_user_id ON stock(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_user_id ON sales(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_user_id ON subscription_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);

-- ========================================
-- RLS POLICIES
-- ========================================

ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Patients
CREATE POLICY "Users can view their own patients" ON patients FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own patients" ON patients FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own patients" ON patients FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own patients" ON patients FOR DELETE USING (auth.uid() = user_id);

-- Procedures
CREATE POLICY "Users can view their own procedures" ON procedures FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own procedures" ON procedures FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own procedures" ON procedures FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own procedures" ON procedures FOR DELETE USING (auth.uid() = user_id);

-- Professionals
CREATE POLICY "Users can view their own professionals" ON professionals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own professionals" ON professionals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own professionals" ON professionals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own professionals" ON professionals FOR DELETE USING (auth.uid() = user_id);

-- Appointments
CREATE POLICY "Users can view their own appointments" ON appointments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own appointments" ON appointments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own appointments" ON appointments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own appointments" ON appointments FOR DELETE USING (auth.uid() = user_id);

-- Waitlist
CREATE POLICY "Users can view their own waitlist" ON waitlist FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own waitlist" ON waitlist FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own waitlist" ON waitlist FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own waitlist" ON waitlist FOR DELETE USING (auth.uid() = user_id);

-- Stock
CREATE POLICY "Users can view their own stock" ON stock FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own stock" ON stock FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own stock" ON stock FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own stock" ON stock FOR DELETE USING (auth.uid() = user_id);

-- Sales
CREATE POLICY "Users can view their own sales" ON sales FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own sales" ON sales FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own sales" ON sales FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own sales" ON sales FOR DELETE USING (auth.uid() = user_id);

-- Subscription Plans
CREATE POLICY "Users can view their own plans" ON subscription_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own plans" ON subscription_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own plans" ON subscription_plans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own plans" ON subscription_plans FOR DELETE USING (auth.uid() = user_id);

-- Subscriptions
CREATE POLICY "Users can view their own subscriptions" ON subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own subscriptions" ON subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own subscriptions" ON subscriptions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own subscriptions" ON subscriptions FOR DELETE USING (auth.uid() = user_id);

-- ========================================
-- GRANTS
-- ========================================

GRANT SELECT, INSERT, UPDATE, DELETE ON patients TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON procedures TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON professionals TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON appointments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON waitlist TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON stock TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON sales TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON subscription_plans TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON subscriptions TO authenticated;
