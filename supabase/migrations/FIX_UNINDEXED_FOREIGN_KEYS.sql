-- =====================================================
-- SCRIPT PARA ADICIONAR ÍNDICES EM FOREIGN KEYS
-- Executar no SQL Editor do Supabase
-- Data: 2025-12-03
-- =====================================================
-- Este script cria índices para foreign keys que não
-- possuem índice de cobertura, melhorando performance
-- de JOINs e queries relacionadas
-- =====================================================

-- =====================================================
-- PARTE 1: ANAMNESIS
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_anamnesis_created_by
ON public.anamnesis(created_by);

-- =====================================================
-- PARTE 2: CASH_MOVEMENTS
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_cash_movements_cash_register_id
ON public.cash_movements(cash_register_id);

CREATE INDEX IF NOT EXISTS idx_cash_movements_performed_by_user_id
ON public.cash_movements(performed_by_user_id);

-- =====================================================
-- PARTE 3: CASH_SESSIONS
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_cash_sessions_closed_by_user_id
ON public.cash_sessions(closed_by_user_id);

CREATE INDEX IF NOT EXISTS idx_cash_sessions_opened_by_user_id
ON public.cash_sessions(opened_by_user_id);

-- =====================================================
-- PARTE 4: CLINICAL_EVOLUTIONS
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_clinical_evolutions_created_by
ON public.clinical_evolutions(created_by);

-- =====================================================
-- PARTE 5: ENROLLMENTS
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_enrollments_course_id
ON public.enrollments(course_id);

-- =====================================================
-- PARTE 6: EXPENSES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_expenses_parent_expense_id
ON public.expenses(parent_expense_id);

-- =====================================================
-- PARTE 7: INFORMED_CONSENTS
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_informed_consents_created_by
ON public.informed_consents(created_by);

-- =====================================================
-- PARTE 8: MEDICAL_PHOTOS
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_medical_photos_created_by
ON public.medical_photos(created_by);

-- =====================================================
-- PARTE 9: SALE_ITEMS
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_sale_items_product_id
ON public.sale_items(product_id);

-- =====================================================
-- PARTE 10: USER_SUBSCRIPTIONS
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_coupon_id
ON public.user_subscriptions(coupon_id);

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================

SELECT 'Índices de foreign keys criados com sucesso!' as resultado;
