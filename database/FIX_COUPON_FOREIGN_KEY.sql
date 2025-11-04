-- =====================================================
-- CORRIGIR FOREIGN KEY DE CUPONS
-- =====================================================

-- PROBLEMA:
-- Não consegue deletar cupons porque há assinaturas referenciando eles
-- Erro: violates foreign key constraint "user_subscriptions_coupon_id_fkey"

-- SOLUÇÃO:
-- Recriar a foreign key com ON DELETE SET NULL
-- Quando um cupom for deletado, o coupon_id nas assinaturas vira NULL

-- =====================================================
-- PARTE 1: Verificar constraint atual
-- =====================================================

SELECT
  tc.table_name,
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.delete_rule,
  rc.update_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
  ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'user_subscriptions'
  AND kcu.column_name = 'coupon_id';

-- =====================================================
-- PARTE 2: Remover constraint antiga
-- =====================================================

ALTER TABLE user_subscriptions
DROP CONSTRAINT IF EXISTS user_subscriptions_coupon_id_fkey;

-- =====================================================
-- PARTE 3: Recriar constraint com ON DELETE SET NULL
-- =====================================================

ALTER TABLE user_subscriptions
ADD CONSTRAINT user_subscriptions_coupon_id_fkey
FOREIGN KEY (coupon_id)
REFERENCES discount_coupons(id)
ON DELETE SET NULL
ON UPDATE CASCADE;

-- =====================================================
-- VERIFICAR RESULTADO
-- =====================================================

-- Ver a nova constraint
SELECT
  tc.table_name,
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.delete_rule,
  rc.update_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
  ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'user_subscriptions'
  AND kcu.column_name = 'coupon_id';

-- Mensagem final
DO $$
BEGIN
  RAISE NOTICE '✅ Foreign key corrigida!';
  RAISE NOTICE '';
  RAISE NOTICE '🔧 Comportamento atualizado:';
  RAISE NOTICE '  - ON DELETE SET NULL: Quando cupom é deletado, coupon_id vira NULL';
  RAISE NOTICE '  - ON UPDATE CASCADE: Quando cupom_id é atualizado, reflete nas assinaturas';
  RAISE NOTICE '';
  RAISE NOTICE '💡 IMPORTANTE:';
  RAISE NOTICE '  - Assinaturas antigas mantêm o discount_percentage mesmo sem cupom';
  RAISE NOTICE '  - Apenas a referência ao cupom é removida';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️ PRÓXIMO PASSO:';
  RAISE NOTICE '  - Recarregue a página do Admin Dashboard';
  RAISE NOTICE '  - Tente deletar um cupom novamente';
END $$;
