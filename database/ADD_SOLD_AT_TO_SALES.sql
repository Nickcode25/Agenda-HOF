-- =============================================
-- Adiciona coluna sold_at na tabela sales
-- Data em que a venda foi realizada (para relatório financeiro)
-- =============================================

-- Adicionar coluna sold_at
ALTER TABLE sales ADD COLUMN IF NOT EXISTS sold_at TIMESTAMP WITH TIME ZONE;

-- Comentário explicativo
COMMENT ON COLUMN sales.sold_at IS 'Data em que a venda foi realizada (para relatório financeiro). Se não informada, usa created_at como fallback.';

-- Opcional: Preencher sold_at com created_at para vendas existentes
-- UPDATE sales SET sold_at = created_at WHERE sold_at IS NULL;
