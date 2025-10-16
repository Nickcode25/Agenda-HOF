-- =============================================
-- CORRIGIR TODAS AS PERMISSÕES DE UMA VEZ
-- =============================================

-- 1. GARANTIR QUE AS TABELAS EXISTEM
CREATE TABLE IF NOT EXISTS public.anamnesis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  chief_complaint TEXT,
  current_illness_history TEXT,
  previous_illnesses TEXT,
  medications TEXT,
  allergies TEXT,
  family_history TEXT,
  smoking BOOLEAN DEFAULT false,
  alcohol_consumption BOOLEAN DEFAULT false,
  physical_activity TEXT,
  previous_aesthetic_procedures TEXT,
  skin_type TEXT,
  skin_concerns TEXT,
  expectations TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT unique_patient_anamnesis UNIQUE(user_id, patient_id)
);

CREATE TABLE IF NOT EXISTS public.clinical_evolutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  date TIMESTAMPTZ DEFAULT NOW(),
  professional_name TEXT NOT NULL,
  evolution_type TEXT NOT NULL CHECK (evolution_type IN ('consultation', 'procedure', 'follow_up', 'complication', 'other')),
  subjective TEXT,
  objective TEXT,
  assessment TEXT,
  plan TEXT,
  procedure_performed TEXT,
  products_used TEXT,
  dosage TEXT,
  application_areas TEXT,
  observations TEXT,
  complications TEXT,
  next_appointment_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.medical_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  photo_type TEXT NOT NULL CHECK (photo_type IN ('before', 'after', 'during', 'complication')),
  procedure_name TEXT,
  body_area TEXT,
  clinical_evolution_id UUID REFERENCES public.clinical_evolutions(id) ON DELETE SET NULL,
  description TEXT,
  taken_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.informed_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  procedure_name TEXT NOT NULL,
  consent_text TEXT NOT NULL,
  risks_explained TEXT,
  patient_signature_url TEXT,
  signed_at TIMESTAMPTZ,
  witness_name TEXT,
  witness_signature_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'signed', 'declined')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 2. DESABILITAR RLS COMPLETAMENTE
ALTER TABLE public.anamnesis DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_evolutions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_photos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.informed_consents DISABLE ROW LEVEL SECURITY;

-- 3. REMOVER TODAS AS POLICIES
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('anamnesis', 'clinical_evolutions', 'medical_photos', 'informed_consents'))
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.' || r.tablename;
    END LOOP;
END $$;

-- 4. GARANTIR PERMISSÕES TOTAIS PARA USUÁRIOS AUTENTICADOS
GRANT ALL ON public.anamnesis TO authenticated;
GRANT ALL ON public.clinical_evolutions TO authenticated;
GRANT ALL ON public.medical_photos TO authenticated;
GRANT ALL ON public.informed_consents TO authenticated;

GRANT ALL ON public.anamnesis TO service_role;
GRANT ALL ON public.clinical_evolutions TO service_role;
GRANT ALL ON public.medical_photos TO service_role;
GRANT ALL ON public.informed_consents TO service_role;

-- 5. RECRIAR ÍNDICES (se não existirem)
CREATE INDEX IF NOT EXISTS idx_anamnesis_patient ON public.anamnesis(patient_id);
CREATE INDEX IF NOT EXISTS idx_anamnesis_user ON public.anamnesis(user_id);

CREATE INDEX IF NOT EXISTS idx_clinical_evolutions_patient ON public.clinical_evolutions(patient_id);
CREATE INDEX IF NOT EXISTS idx_clinical_evolutions_user ON public.clinical_evolutions(user_id);
CREATE INDEX IF NOT EXISTS idx_clinical_evolutions_date ON public.clinical_evolutions(date DESC);

CREATE INDEX IF NOT EXISTS idx_medical_photos_patient ON public.medical_photos(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_photos_user ON public.medical_photos(user_id);
CREATE INDEX IF NOT EXISTS idx_medical_photos_evolution ON public.medical_photos(clinical_evolution_id);

CREATE INDEX IF NOT EXISTS idx_informed_consents_patient ON public.informed_consents(patient_id);
CREATE INDEX IF NOT EXISTS idx_informed_consents_user ON public.informed_consents(user_id);

-- 6. CRIAR BUCKET DE STORAGE (se não existir)
INSERT INTO storage.buckets (id, name, public)
VALUES ('medical-photos', 'medical-photos', true)
ON CONFLICT (id) DO NOTHING;

-- 7. LIMPAR POLICIES DO STORAGE
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname LIKE '%medical%')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON storage.objects';
    END LOOP;
END $$;

-- 8. CRIAR POLICIES DO STORAGE
CREATE POLICY "medical_photos_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'medical-photos');

CREATE POLICY "medical_photos_view" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'medical-photos');

CREATE POLICY "medical_photos_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'medical-photos');

CREATE POLICY "medical_photos_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'medical-photos');
