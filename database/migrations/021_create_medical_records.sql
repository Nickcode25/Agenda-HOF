-- =============================================
-- SISTEMA DE PRONTUÁRIO ELETRÔNICO
-- =============================================

-- Tabela de Anamnese (Histórico médico do paciente)
CREATE TABLE IF NOT EXISTS public.anamnesis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,

  -- Dados da anamnese
  chief_complaint TEXT, -- Queixa principal
  current_illness_history TEXT, -- História da doença atual
  previous_illnesses TEXT, -- Doenças anteriores
  medications TEXT, -- Medicações em uso
  allergies TEXT, -- Alergias
  family_history TEXT, -- Histórico familiar

  -- Estilo de vida
  smoking BOOLEAN DEFAULT false,
  alcohol_consumption BOOLEAN DEFAULT false,
  physical_activity TEXT,

  -- Específico para estética
  previous_aesthetic_procedures TEXT, -- Procedimentos estéticos anteriores
  skin_type TEXT, -- Tipo de pele
  skin_concerns TEXT, -- Preocupações com a pele
  expectations TEXT, -- Expectativas do paciente

  -- Metadados
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),

  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT unique_patient_anamnesis UNIQUE(user_id, patient_id)
);

-- Tabela de Evolução Clínica (Timeline de atendimentos)
CREATE TABLE IF NOT EXISTS public.clinical_evolutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,

  -- Dados da evolução
  date TIMESTAMPTZ DEFAULT NOW(),
  professional_name TEXT NOT NULL,
  evolution_type TEXT NOT NULL CHECK (evolution_type IN ('consultation', 'procedure', 'follow_up', 'complication', 'other')),

  -- Conteúdo
  subjective TEXT, -- Subjetivo (o que o paciente relata)
  objective TEXT, -- Objetivo (o que o profissional observa)
  assessment TEXT, -- Avaliação/Diagnóstico
  plan TEXT, -- Plano de tratamento

  -- Procedimento realizado (se aplicável)
  procedure_performed TEXT,
  products_used TEXT,
  dosage TEXT,
  application_areas TEXT,

  -- Observações
  observations TEXT,
  complications TEXT,
  next_appointment_date DATE,

  -- Metadados
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),

  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Tabela de Fotos (Antes/Depois)
CREATE TABLE IF NOT EXISTS public.medical_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,

  -- Dados da foto
  photo_url TEXT NOT NULL,
  photo_type TEXT NOT NULL CHECK (photo_type IN ('before', 'after', 'during', 'complication')),
  procedure_name TEXT,
  body_area TEXT, -- Área do corpo fotografada

  -- Associação com procedimento/evolução
  clinical_evolution_id UUID REFERENCES public.clinical_evolutions(id) ON DELETE SET NULL,

  -- Descrição e metadados
  description TEXT,
  taken_at TIMESTAMPTZ DEFAULT NOW(),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),

  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Tabela de Consentimentos Informados
CREATE TABLE IF NOT EXISTS public.informed_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,

  -- Dados do consentimento
  procedure_name TEXT NOT NULL,
  consent_text TEXT NOT NULL,
  risks_explained TEXT,

  -- Assinatura digital
  patient_signature_url TEXT, -- URL da assinatura digitalizada
  signed_at TIMESTAMPTZ,
  witness_name TEXT,
  witness_signature_url TEXT,

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'signed', 'declined')),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),

  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Índices para otimização
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

-- RLS Policies
ALTER TABLE public.anamnesis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_evolutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.informed_consents ENABLE ROW LEVEL SECURITY;

-- Policies para anamnesis
CREATE POLICY "Users can view their own anamnesis" ON public.anamnesis
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own anamnesis" ON public.anamnesis
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own anamnesis" ON public.anamnesis
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own anamnesis" ON public.anamnesis
  FOR DELETE USING (auth.uid() = user_id);

-- Policies para clinical_evolutions
CREATE POLICY "Users can view their own clinical evolutions" ON public.clinical_evolutions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own clinical evolutions" ON public.clinical_evolutions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own clinical evolutions" ON public.clinical_evolutions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own clinical evolutions" ON public.clinical_evolutions
  FOR DELETE USING (auth.uid() = user_id);

-- Policies para medical_photos
CREATE POLICY "Users can view their own medical photos" ON public.medical_photos
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own medical photos" ON public.medical_photos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own medical photos" ON public.medical_photos
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own medical photos" ON public.medical_photos
  FOR DELETE USING (auth.uid() = user_id);

-- Policies para informed_consents
CREATE POLICY "Users can view their own informed consents" ON public.informed_consents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own informed consents" ON public.informed_consents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own informed consents" ON public.informed_consents
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own informed consents" ON public.informed_consents
  FOR DELETE USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_medical_records_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_anamnesis_updated_at
  BEFORE UPDATE ON public.anamnesis
  FOR EACH ROW
  EXECUTE FUNCTION update_medical_records_updated_at();

CREATE TRIGGER update_clinical_evolutions_updated_at
  BEFORE UPDATE ON public.clinical_evolutions
  FOR EACH ROW
  EXECUTE FUNCTION update_medical_records_updated_at();
