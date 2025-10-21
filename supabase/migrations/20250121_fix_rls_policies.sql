-- Migration: Fix RLS Policies for Expenses and Cash Control
-- Description: Atualiza políticas RLS para permitir acesso correto

-- ============================================
-- DROP EXISTING POLICIES
-- ============================================

-- Expense Categories
DROP POLICY IF EXISTS "Users can view their own expense categories" ON expense_categories;
DROP POLICY IF EXISTS "Users can insert their own expense categories" ON expense_categories;
DROP POLICY IF EXISTS "Users can update their own expense categories" ON expense_categories;
DROP POLICY IF EXISTS "Users can delete their own expense categories" ON expense_categories;

-- Expenses
DROP POLICY IF EXISTS "Users can view their own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can insert their own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can update their own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can delete their own expenses" ON expenses;

-- Cash Registers
DROP POLICY IF EXISTS "Users can view their own cash registers" ON cash_registers;
DROP POLICY IF EXISTS "Users can insert their own cash registers" ON cash_registers;
DROP POLICY IF EXISTS "Users can update their own cash registers" ON cash_registers;
DROP POLICY IF EXISTS "Users can delete their own cash registers" ON cash_registers;

-- Cash Sessions
DROP POLICY IF EXISTS "Users can view their own cash sessions" ON cash_sessions;
DROP POLICY IF EXISTS "Users can insert their own cash sessions" ON cash_sessions;
DROP POLICY IF EXISTS "Users can update their own cash sessions" ON cash_sessions;
DROP POLICY IF EXISTS "Users can delete their own cash sessions" ON cash_sessions;

-- Cash Movements
DROP POLICY IF EXISTS "Users can view their own cash movements" ON cash_movements;
DROP POLICY IF EXISTS "Users can insert their own cash movements" ON cash_movements;
DROP POLICY IF EXISTS "Users can update their own cash movements" ON cash_movements;
DROP POLICY IF EXISTS "Users can delete their own cash movements" ON cash_movements;

-- ============================================
-- CREATE NEW POLICIES (PERMISSIVE)
-- ============================================

-- Expense Categories
CREATE POLICY "Enable all for authenticated users on expense_categories"
  ON expense_categories
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Expenses
CREATE POLICY "Enable all for authenticated users on expenses"
  ON expenses
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Cash Registers
CREATE POLICY "Enable all for authenticated users on cash_registers"
  ON cash_registers
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Cash Sessions
CREATE POLICY "Enable all for authenticated users on cash_sessions"
  ON cash_sessions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Cash Movements
CREATE POLICY "Enable all for authenticated users on cash_movements"
  ON cash_movements
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
