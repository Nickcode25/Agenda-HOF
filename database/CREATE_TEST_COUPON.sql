-- ============================================
-- Criar Cupom de Teste - 98% de Desconto
-- ============================================
-- Use este cupom para testar a assinatura
-- com valor baixo (R$ 2,20 ao invés de R$ 109,90)
-- ============================================

INSERT INTO discount_coupons (
  code,
  discount_percentage,
  max_uses,
  current_uses,
  is_active,
  valid_until,
  description,
  created_at
) VALUES (
  'TESTE98',                    -- Código do cupom
  98,                           -- 98% de desconto
  10,                           -- Máximo 10 usos
  0,                            -- Nenhum uso ainda
  true,                         -- Ativo
  NOW() + INTERVAL '30 days',  -- Válido por 30 dias
  'Cupom de teste - 98% de desconto',
  NOW()
);

-- Verificar se foi criado
SELECT * FROM discount_coupons WHERE code = 'TESTE98';
