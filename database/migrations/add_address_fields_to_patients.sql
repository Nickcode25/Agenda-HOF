-- Adicionar campos de endereço e informações clínicas à tabela patients

-- Adicionar colunas se não existirem
ALTER TABLE patients ADD COLUMN IF NOT EXISTS cep TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS street TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS number TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS complement TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS neighborhood TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS clinical_info TEXT;

-- Comentários
COMMENT ON COLUMN patients.cep IS 'CEP do paciente';
COMMENT ON COLUMN patients.street IS 'Rua/Logradouro';
COMMENT ON COLUMN patients.number IS 'Número da residência';
COMMENT ON COLUMN patients.complement IS 'Complemento do endereço';
COMMENT ON COLUMN patients.neighborhood IS 'Bairro';
COMMENT ON COLUMN patients.city IS 'Cidade';
COMMENT ON COLUMN patients.state IS 'Estado (UF)';
COMMENT ON COLUMN patients.clinical_info IS 'Informações clínicas do paciente (histórico, alergias, medicamentos)';
