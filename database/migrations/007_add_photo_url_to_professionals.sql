-- Adicionar coluna photo_url à tabela professionals
ALTER TABLE professionals 
ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Adicionar colunas de endereço detalhado (para manter compatibilidade)
ALTER TABLE professionals
ADD COLUMN IF NOT EXISTS cpf TEXT,
ADD COLUMN IF NOT EXISTS street TEXT,
ADD COLUMN IF NOT EXISTS number TEXT,
ADD COLUMN IF NOT EXISTS complement TEXT,
ADD COLUMN IF NOT EXISTS neighborhood TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT;

COMMENT ON COLUMN professionals.photo_url IS 'URL da foto do profissional (Base64 ou URL externa)';
COMMENT ON COLUMN professionals.cpf IS 'CPF do profissional';
COMMENT ON COLUMN professionals.street IS 'Logradouro do endereço';
COMMENT ON COLUMN professionals.number IS 'Número do endereço';
COMMENT ON COLUMN professionals.complement IS 'Complemento do endereço';
COMMENT ON COLUMN professionals.neighborhood IS 'Bairro';
COMMENT ON COLUMN professionals.city IS 'Cidade';
COMMENT ON COLUMN professionals.state IS 'Estado (UF)';
