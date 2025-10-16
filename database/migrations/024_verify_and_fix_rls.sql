-- =============================================
-- VERIFICAR E CORRIGIR RLS
-- =============================================

-- Verificar se as tabelas existem e têm RLS habilitado
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename IN ('anamnesis', 'clinical_evolutions', 'medical_photos', 'informed_consents');

-- Verificar policies existentes
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename IN ('anamnesis', 'clinical_evolutions', 'medical_photos', 'informed_consents')
ORDER BY tablename, policyname;
