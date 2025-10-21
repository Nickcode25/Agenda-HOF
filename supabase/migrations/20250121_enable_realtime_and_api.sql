-- Migration: Enable Realtime and API Access for Expenses Tables
-- Description: Habilita acesso via API REST e Realtime para as tabelas de despesas

-- ============================================
-- ENABLE REALTIME (opcional, mas recomendado)
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE expense_categories;
ALTER PUBLICATION supabase_realtime ADD TABLE expenses;
ALTER PUBLICATION supabase_realtime ADD TABLE cash_registers;
ALTER PUBLICATION supabase_realtime ADD TABLE cash_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE cash_movements;

-- ============================================
-- GRANT USAGE ON SCHEMA (importante!)
-- ============================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- ============================================
-- GRANT ALL PRIVILEGES ON TABLES
-- ============================================

-- Expense Categories
GRANT ALL ON expense_categories TO anon, authenticated;
GRANT ALL ON expense_categories TO service_role;

-- Expenses
GRANT ALL ON expenses TO anon, authenticated;
GRANT ALL ON expenses TO service_role;

-- Cash Registers
GRANT ALL ON cash_registers TO anon, authenticated;
GRANT ALL ON cash_registers TO service_role;

-- Cash Sessions
GRANT ALL ON cash_sessions TO anon, authenticated;
GRANT ALL ON cash_sessions TO service_role;

-- Cash Movements
GRANT ALL ON cash_movements TO anon, authenticated;
GRANT ALL ON cash_movements TO service_role;

-- ============================================
-- GRANT USAGE ON SEQUENCES (para IDs)
-- ============================================
-- As tabelas usam gen_random_uuid(), então não precisam de sequences
-- Mas é bom garantir acesso ao schema

-- ============================================
-- VERIFICAÇÃO FINAL
-- ============================================
-- Você pode verificar se as permissões foram aplicadas com:
-- SELECT * FROM information_schema.table_privileges WHERE grantee IN ('anon', 'authenticated') AND table_name = 'expense_categories';
