-- =====================================================
-- TABELA DE CUPONS DE DESCONTO
-- Execute PRIMEIRO
-- =====================================================

-- Tabela de cupons de desconto
CREATE TABLE IF NOT EXISTS discount_coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  discount_percentage INTEGER NOT NULL CHECK (discount_percentage > 0 AND discount_percentage <= 100),
  max_uses INTEGER DEFAULT NULL, -- NULL = ilimitado
  current_uses INTEGER DEFAULT 0,
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valid_until TIMESTAMP WITH TIME ZONE DEFAULT NULL, -- NULL = sem expiração
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID, -- Removido REFERENCES pois users pode não existir ainda
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para rastrear uso de cupons
CREATE TABLE IF NOT EXISTS coupon_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID REFERENCES discount_coupons(id) ON DELETE CASCADE,
  user_email VARCHAR(255) NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  order_amount DECIMAL(10, 2),
  discount_amount DECIMAL(10, 2)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_discount_coupons_code ON discount_coupons(code);
CREATE INDEX IF NOT EXISTS idx_discount_coupons_active ON discount_coupons(is_active);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_coupon_id ON coupon_usage(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_user_email ON coupon_usage(user_email);

-- RLS (Row Level Security)
ALTER TABLE discount_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_usage ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso para cupons
-- Qualquer um autenticado pode ler cupons ativos (para validação)
CREATE POLICY "Anyone authenticated can read active coupons" ON discount_coupons
  FOR SELECT
  TO authenticated
  USING (is_active = TRUE);

-- Service role pode fazer tudo (para o backend)
CREATE POLICY "Service role can manage coupons" ON discount_coupons
  FOR ALL
  TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);

-- Políticas para uso de cupons
CREATE POLICY "Anyone authenticated can insert coupon usage" ON coupon_usage
  FOR INSERT
  TO authenticated
  WITH CHECK (TRUE);

CREATE POLICY "Service role can manage coupon usage" ON coupon_usage
  FOR ALL
  TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_discount_coupons_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para updated_at
DROP TRIGGER IF EXISTS trigger_update_discount_coupons_updated_at ON discount_coupons;
CREATE TRIGGER trigger_update_discount_coupons_updated_at
  BEFORE UPDATE ON discount_coupons
  FOR EACH ROW
  EXECUTE FUNCTION update_discount_coupons_updated_at();

-- Função para incrementar uso do cupom
CREATE OR REPLACE FUNCTION increment_coupon_usage(coupon_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE discount_coupons
  SET current_uses = current_uses + 1
  WHERE id = coupon_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentários
COMMENT ON TABLE discount_coupons IS 'Cupons de desconto para assinaturas';
COMMENT ON COLUMN discount_coupons.code IS 'Código do cupom (ex: PROMO10)';
COMMENT ON COLUMN discount_coupons.discount_percentage IS 'Porcentagem de desconto (1-100)';
COMMENT ON COLUMN discount_coupons.max_uses IS 'Número máximo de usos (NULL = ilimitado)';
COMMENT ON COLUMN discount_coupons.current_uses IS 'Número de vezes que o cupom foi usado';

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Tabela de cupons criada com sucesso!';
END $$;
