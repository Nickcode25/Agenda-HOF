-- Permitir que usuários anônimos (não autenticados) leiam cupons ativos
-- Isso é necessário para a página de checkout onde o usuário ainda não está logado

-- Remover política antiga se existir
DROP POLICY IF EXISTS "anonymous_read_active_coupons" ON discount_coupons;

-- Criar nova política para permitir leitura anônima de cupons ativos
CREATE POLICY "anonymous_read_active_coupons" ON discount_coupons
  FOR SELECT
  TO anon
  USING (is_active = TRUE);

-- Também permitir para usuários autenticados
DROP POLICY IF EXISTS "authenticated_read_active_coupons" ON discount_coupons;

CREATE POLICY "authenticated_read_active_coupons" ON discount_coupons
  FOR SELECT
  TO authenticated
  USING (is_active = TRUE);
