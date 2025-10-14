-- =============================================
-- AGENDA+ HOF - Database Schema (Supabase PostgreSQL)
-- =============================================
-- Este arquivo documenta a estrutura completa do banco de dados
-- Todas as tabelas já estão criadas e configuradas no Supabase
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABELA: patients (Pacientes)
-- =============================================
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  cpf TEXT NOT NULL,
  birth_date TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  medical_history JSONB,
  allergies TEXT[],
  medications TEXT[],
  photo_url TEXT,
  planned_procedures JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_patients_user_id ON patients(user_id);
CREATE INDEX idx_patients_cpf ON patients(cpf);

-- RLS Policies
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own patients"
  ON patients FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own patients"
  ON patients FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own patients"
  ON patients FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own patients"
  ON patients FOR DELETE
  USING (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON patients TO authenticated;

COMMENT ON TABLE patients IS 'Cadastro de pacientes';
COMMENT ON COLUMN patients.planned_procedures IS 'Procedimentos planejados: [{"id": "uuid", "procedureName": "string", "quantity": number, "unitValue": number, "totalValue": number, "paymentType": "string", "status": "string", "notes": "string", "createdAt": "timestamp"}]';

-- =============================================
-- TABELA: professionals (Profissionais)
-- =============================================
CREATE TABLE professionals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  specialty TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  cro TEXT,
  photo_url TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_professionals_user_id ON professionals(user_id);
CREATE INDEX idx_professionals_active ON professionals(active);

-- RLS Policies
ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own professionals"
  ON professionals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own professionals"
  ON professionals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own professionals"
  ON professionals FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own professionals"
  ON professionals FOR DELETE
  USING (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON professionals TO authenticated;

COMMENT ON TABLE professionals IS 'Cadastro de profissionais da clínica';

-- =============================================
-- TABELA: procedures (Procedimentos)
-- =============================================
CREATE TABLE procedures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  cash_value NUMERIC(10, 2),
  card_value NUMERIC(10, 2),
  duration_minutes INT,
  category TEXT,
  is_active BOOLEAN DEFAULT true,
  stock_categories JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_procedures_user_id ON procedures(user_id);
CREATE INDEX idx_procedures_is_active ON procedures(is_active);

-- RLS Policies
ALTER TABLE procedures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own procedures"
  ON procedures FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own procedures"
  ON procedures FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own procedures"
  ON procedures FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own procedures"
  ON procedures FOR DELETE
  USING (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON procedures TO authenticated;

COMMENT ON TABLE procedures IS 'Procedimentos médicos/estéticos oferecidos';
COMMENT ON COLUMN procedures.price IS 'Preço padrão do procedimento';
COMMENT ON COLUMN procedures.cash_value IS 'Valor com desconto adicional à vista (opcional)';
COMMENT ON COLUMN procedures.card_value IS 'Valor para pagamento parcelado no cartão (opcional)';
COMMENT ON COLUMN procedures.duration_minutes IS 'Duração estimada em minutos';
COMMENT ON COLUMN procedures.stock_categories IS 'Categorias de produtos utilizados: [{"category": "string", "quantityUsed": number}]';

-- =============================================
-- TABELA: appointments (Agendamentos)
-- =============================================
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  patient_id UUID NOT NULL,
  patient_name TEXT NOT NULL,
  procedure TEXT NOT NULL,
  procedure_id UUID,
  selected_products JSONB,
  professional TEXT NOT NULL,
  room TEXT,
  start TIMESTAMP WITH TIME ZONE NOT NULL,
  "end" TIMESTAMP WITH TIME ZONE NOT NULL,
  notes TEXT,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'done', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_appointments_user_id ON appointments(user_id);
CREATE INDEX idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX idx_appointments_professional ON appointments(professional);
CREATE INDEX idx_appointments_start ON appointments(start);
CREATE INDEX idx_appointments_status ON appointments(status);

-- RLS Policies
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own appointments"
  ON appointments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own appointments"
  ON appointments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own appointments"
  ON appointments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own appointments"
  ON appointments FOR DELETE
  USING (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON appointments TO authenticated;

COMMENT ON TABLE appointments IS 'Agendamentos de procedimentos';
COMMENT ON COLUMN appointments.start IS 'Data e hora de início do agendamento';
COMMENT ON COLUMN appointments."end" IS 'Data e hora de término do agendamento';
COMMENT ON COLUMN appointments.selected_products IS 'Produtos selecionados do estoque: [{"category": "string", "stockItemId": "uuid", "quantity": number}]';

-- =============================================
-- TABELA: waitlist (Fila de Espera)
-- =============================================
CREATE TABLE waitlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  patient_name TEXT NOT NULL,
  phone TEXT,
  desired_procedure TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_waitlist_user_id ON waitlist(user_id);

-- RLS Policies
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own waitlist"
  ON waitlist FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own waitlist"
  ON waitlist FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own waitlist"
  ON waitlist FOR DELETE
  USING (auth.uid() = user_id);

GRANT SELECT, INSERT, DELETE ON waitlist TO authenticated;

COMMENT ON TABLE waitlist IS 'Fila de espera para agendamentos';

-- =============================================
-- TABELA: stock_items (Itens de Estoque)
-- =============================================
CREATE TABLE stock_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  brand TEXT,
  description TEXT,
  category TEXT NOT NULL,
  quantity NUMERIC(10, 2) NOT NULL DEFAULT 0,
  min_quantity NUMERIC(10, 2) NOT NULL DEFAULT 0,
  unit TEXT NOT NULL,
  purchase_price NUMERIC(10, 2),
  sale_price NUMERIC(10, 2),
  supplier TEXT,
  batch_number TEXT,
  expiration_date TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_stock_items_user_id ON stock_items(user_id);
CREATE INDEX idx_stock_items_category ON stock_items(category);

-- RLS Policies
ALTER TABLE stock_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own stock items"
  ON stock_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stock items"
  ON stock_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stock items"
  ON stock_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stock items"
  ON stock_items FOR DELETE
  USING (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON stock_items TO authenticated;

COMMENT ON TABLE stock_items IS 'Controle de estoque de produtos e insumos';

-- =============================================
-- TABELA: product_sales (Vendas de Produtos)
-- =============================================
CREATE TABLE product_sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  patient_id UUID,
  patient_name TEXT NOT NULL,
  items JSONB NOT NULL,
  payment_method TEXT NOT NULL,
  total_amount NUMERIC(10, 2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_product_sales_user_id ON product_sales(user_id);
CREATE INDEX idx_product_sales_patient_id ON product_sales(patient_id);
CREATE INDEX idx_product_sales_created_at ON product_sales(created_at);

-- RLS Policies
ALTER TABLE product_sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own product sales"
  ON product_sales FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own product sales"
  ON product_sales FOR INSERT
  WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT ON product_sales TO authenticated;

COMMENT ON TABLE product_sales IS 'Registro de vendas de produtos';
COMMENT ON COLUMN product_sales.items IS 'Lista de produtos vendidos: [{"stockItemId": "uuid", "name": "string", "quantity": number, "unitPrice": number, "totalPrice": number}]';

-- =============================================
-- TABELA: subscriptions (Mensalidades)
-- =============================================
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  patient_id UUID NOT NULL,
  patient_name TEXT NOT NULL,
  procedure_name TEXT NOT NULL,
  total_sessions INT NOT NULL,
  completed_sessions INT DEFAULT 0,
  monthly_value NUMERIC(10, 2) NOT NULL,
  start_date TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled', 'completed')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_patient_id ON subscriptions(patient_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- RLS Policies
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscriptions"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscriptions"
  ON subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions"
  ON subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own subscriptions"
  ON subscriptions FOR DELETE
  USING (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON subscriptions TO authenticated;

COMMENT ON TABLE subscriptions IS 'Controle de mensalidades e planos de procedimentos';

-- =============================================
-- FUNÇÕES E TRIGGERS
-- =============================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
DROP TRIGGER IF EXISTS update_patients_updated_at ON patients;
CREATE TRIGGER update_patients_updated_at
    BEFORE UPDATE ON patients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_professionals_updated_at ON professionals;
CREATE TRIGGER update_professionals_updated_at
    BEFORE UPDATE ON professionals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_procedures_updated_at ON procedures;
CREATE TRIGGER update_procedures_updated_at
    BEFORE UPDATE ON procedures
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_appointments_updated_at ON appointments;
CREATE TRIGGER update_appointments_updated_at
    BEFORE UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_stock_items_updated_at ON stock_items;
CREATE TRIGGER update_stock_items_updated_at
    BEFORE UPDATE ON stock_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- NOTAS IMPORTANTES
-- =============================================
-- 1. Todas as tabelas usam RLS (Row Level Security) para isolar dados por usuário
-- 2. O campo user_id em todas as tabelas referencia auth.users(id) do Supabase
-- 3. Campos JSONB são usados para armazenar dados estruturados complexos
-- 4. Timestamps são em UTC (TIMESTAMP WITH TIME ZONE)
-- 5. Indexes são criados em colunas frequentemente consultadas
