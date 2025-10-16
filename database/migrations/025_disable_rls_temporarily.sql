-- =============================================
-- DESABILITAR RLS TEMPORARIAMENTE PARA TESTAR
-- =============================================
-- ATENÇÃO: Use isso apenas para teste!
-- Depois que funcionar, reabilite o RLS

-- Desabilitar RLS em todas as tabelas de prontuário
ALTER TABLE public.anamnesis DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_evolutions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_photos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.informed_consents DISABLE ROW LEVEL SECURITY;

-- Para REABILITAR depois (NÃO execute agora):
-- ALTER TABLE public.anamnesis ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.clinical_evolutions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.medical_photos ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.informed_consents ENABLE ROW LEVEL SECURITY;
