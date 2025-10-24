-- EXECUTAR NO SUPABASE SQL EDITOR AGORA
-- Corrige permissão de leitura de cupons para usuários anônimos

-- 1. Verificar políticas atuais
SELECT policyname, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'discount_coupons';

-- 2. REMOVER política antiga de anônimo se existir
DROP POLICY IF EXISTS "anonymous_read_active_coupons" ON discount_coupons;

-- 3. CRIAR nova política permitindo leitura anônima de cupons ativos
CREATE POLICY "allow_anon_read_active_coupons"
ON discount_coupons
FOR SELECT
TO anon
USING (is_active = true);

-- 4. Verificar que foi criada
SELECT policyname, roles, cmd
FROM pg_policies
WHERE tablename = 'discount_coupons' AND roles::text LIKE '%anon%';
