-- Adicionar coluna doses_per_unit à tabela stock
ALTER TABLE stock
ADD COLUMN IF NOT EXISTS doses_per_unit INTEGER;

-- Comentário da coluna
COMMENT ON COLUMN stock.doses_per_unit IS 'Quantas aplicações/doses cada unidade de estoque rende. Ex: 1 frasco de toxina = 4 aplicações';
