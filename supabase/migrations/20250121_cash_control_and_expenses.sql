-- Migration: Cash Control and Expenses System
-- Description: Adds tables for daily cash control and expense management

-- ============================================
-- CATEGORIAS DE DESPESAS
-- ============================================
CREATE TABLE IF NOT EXISTS expense_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#EF4444', -- cor para identificação visual
  icon TEXT DEFAULT 'DollarSign', -- ícone lucide-react
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- ============================================
-- DESPESAS
-- ============================================
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES expense_categories(id) ON DELETE SET NULL,
  category_name TEXT NOT NULL, -- denormalizado para histórico
  description TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  payment_method TEXT NOT NULL, -- cash, card, pix, transfer, check
  payment_status TEXT NOT NULL DEFAULT 'paid', -- pending, paid, overdue
  due_date DATE,
  paid_at TIMESTAMP WITH TIME ZONE,

  -- Recorrência
  is_recurring BOOLEAN DEFAULT FALSE,
  recurring_frequency TEXT, -- daily, weekly, monthly, yearly
  recurring_day INTEGER, -- dia do mês (1-31) ou dia da semana (0-6)
  recurring_end_date DATE,
  parent_expense_id UUID REFERENCES expenses(id) ON DELETE CASCADE, -- ref para despesa pai se for recorrente

  -- Anexos/Comprovantes
  attachments JSONB DEFAULT '[]'::jsonb,

  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- CAIXAS (múltiplos caixas possíveis)
-- ============================================
CREATE TABLE IF NOT EXISTS cash_registers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- ex: "Caixa Principal", "Recepção 1", "Recepção 2"
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- ============================================
-- SESSÕES DE CAIXA (abertura/fechamento)
-- ============================================
CREATE TABLE IF NOT EXISTS cash_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cash_register_id UUID NOT NULL REFERENCES cash_registers(id) ON DELETE CASCADE,

  -- Abertura
  opened_by_user_id UUID NOT NULL REFERENCES auth.users(id),
  opened_by_name TEXT NOT NULL,
  opened_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  opening_balance DECIMAL(10, 2) NOT NULL DEFAULT 0,
  opening_notes TEXT,

  -- Fechamento
  closed_by_user_id UUID REFERENCES auth.users(id),
  closed_by_name TEXT,
  closed_at TIMESTAMP WITH TIME ZONE,
  closing_balance DECIMAL(10, 2),
  expected_balance DECIMAL(10, 2),
  difference DECIMAL(10, 2), -- diferença entre esperado e real
  closing_notes TEXT,

  -- Status
  status TEXT NOT NULL DEFAULT 'open', -- open, closed

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- MOVIMENTAÇÕES DE CAIXA
-- ============================================
CREATE TABLE IF NOT EXISTS cash_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cash_session_id UUID NOT NULL REFERENCES cash_sessions(id) ON DELETE CASCADE,
  cash_register_id UUID NOT NULL REFERENCES cash_registers(id) ON DELETE CASCADE,

  -- Tipo de movimentação
  type TEXT NOT NULL, -- income (entrada), expense (saída), withdrawal (sangria), deposit (reforço)
  category TEXT NOT NULL, -- procedure, sale, subscription, expense, other

  -- Valores
  amount DECIMAL(10, 2) NOT NULL,
  payment_method TEXT NOT NULL, -- cash, card, pix, transfer, check

  -- Referências (opcional - para rastreabilidade)
  reference_type TEXT, -- procedure, sale, subscription, expense
  reference_id UUID, -- ID da venda, procedimento, etc
  reference_name TEXT, -- nome/descrição da referência

  -- Informações adicionais
  description TEXT NOT NULL,
  notes TEXT,
  performed_by_user_id UUID REFERENCES auth.users(id),
  performed_by_name TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDICES
-- ============================================
CREATE INDEX idx_expense_categories_user ON expense_categories(user_id);
CREATE INDEX idx_expenses_user ON expenses(user_id);
CREATE INDEX idx_expenses_category ON expenses(category_id);
CREATE INDEX idx_expenses_due_date ON expenses(due_date);
CREATE INDEX idx_expenses_paid_at ON expenses(paid_at);
CREATE INDEX idx_cash_registers_user ON cash_registers(user_id);
CREATE INDEX idx_cash_sessions_user ON cash_sessions(user_id);
CREATE INDEX idx_cash_sessions_register ON cash_sessions(cash_register_id);
CREATE INDEX idx_cash_sessions_status ON cash_sessions(status);
CREATE INDEX idx_cash_movements_session ON cash_movements(cash_session_id);
CREATE INDEX idx_cash_movements_user ON cash_movements(user_id);
CREATE INDEX idx_cash_movements_type ON cash_movements(type);
CREATE INDEX idx_cash_movements_created ON cash_movements(created_at);

-- ============================================
-- RLS (Row Level Security)
-- ============================================

-- Expense Categories
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own expense categories"
  ON expense_categories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own expense categories"
  ON expense_categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own expense categories"
  ON expense_categories FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own expense categories"
  ON expense_categories FOR DELETE
  USING (auth.uid() = user_id);

-- Expenses
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own expenses"
  ON expenses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own expenses"
  ON expenses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own expenses"
  ON expenses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own expenses"
  ON expenses FOR DELETE
  USING (auth.uid() = user_id);

-- Cash Registers
ALTER TABLE cash_registers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own cash registers"
  ON cash_registers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cash registers"
  ON cash_registers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cash registers"
  ON cash_registers FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cash registers"
  ON cash_registers FOR DELETE
  USING (auth.uid() = user_id);

-- Cash Sessions
ALTER TABLE cash_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own cash sessions"
  ON cash_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cash sessions"
  ON cash_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cash sessions"
  ON cash_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cash sessions"
  ON cash_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- Cash Movements
ALTER TABLE cash_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own cash movements"
  ON cash_movements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cash movements"
  ON cash_movements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cash movements"
  ON cash_movements FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cash movements"
  ON cash_movements FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- CATEGORIAS PADRÃO
-- ============================================
-- Inserir categorias padrão para novos usuários
-- (Isso será feito via código quando o usuário criar a primeira despesa)

-- ============================================
-- COMENTÁRIOS
-- ============================================
COMMENT ON TABLE expense_categories IS 'Categorias de despesas da clínica';
COMMENT ON TABLE expenses IS 'Despesas da clínica (fixas e variáveis)';
COMMENT ON TABLE cash_registers IS 'Caixas disponíveis na clínica';
COMMENT ON TABLE cash_sessions IS 'Sessões de abertura/fechamento de caixa';
COMMENT ON TABLE cash_movements IS 'Movimentações de entrada/saída do caixa';

COMMENT ON COLUMN expenses.is_recurring IS 'Indica se a despesa é recorrente';
COMMENT ON COLUMN expenses.recurring_frequency IS 'Frequência de recorrência: daily, weekly, monthly, yearly';
COMMENT ON COLUMN expenses.parent_expense_id IS 'Referência para a despesa pai se for uma despesa recorrente gerada automaticamente';
COMMENT ON COLUMN cash_movements.type IS 'Tipo: income (entrada), expense (saída), withdrawal (sangria), deposit (reforço)';
COMMENT ON COLUMN cash_movements.category IS 'Categoria: procedure, sale, subscription, expense, other';
