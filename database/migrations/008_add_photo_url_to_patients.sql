-- Adicionar coluna photo_url à tabela patients
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS photo_url TEXT;

COMMENT ON COLUMN patients.photo_url IS 'URL da foto do paciente (Base64 ou URL externa)';
