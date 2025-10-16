-- =============================================
-- CORRIGIR POLÍTICAS RLS DO PRONTUÁRIO ELETRÔNICO
-- =============================================

-- 1. REMOVER TODAS AS POLICIES ANTIGAS
DROP POLICY IF EXISTS "Users can view their own anamnesis" ON public.anamnesis;
DROP POLICY IF EXISTS "Users can insert their own anamnesis" ON public.anamnesis;
DROP POLICY IF EXISTS "Users can update their own anamnesis" ON public.anamnesis;
DROP POLICY IF EXISTS "Users can delete their own anamnesis" ON public.anamnesis;

DROP POLICY IF EXISTS "Users can view their own clinical evolutions" ON public.clinical_evolutions;
DROP POLICY IF EXISTS "Users can insert their own clinical evolutions" ON public.clinical_evolutions;
DROP POLICY IF EXISTS "Users can update their own clinical evolutions" ON public.clinical_evolutions;
DROP POLICY IF EXISTS "Users can delete their own clinical evolutions" ON public.clinical_evolutions;

DROP POLICY IF EXISTS "Users can view their own medical photos" ON public.medical_photos;
DROP POLICY IF EXISTS "Users can insert their own medical photos" ON public.medical_photos;
DROP POLICY IF EXISTS "Users can update their own medical photos" ON public.medical_photos;
DROP POLICY IF EXISTS "Users can delete their own medical photos" ON public.medical_photos;

DROP POLICY IF EXISTS "Users can view their own informed consents" ON public.informed_consents;
DROP POLICY IF EXISTS "Users can insert their own informed consents" ON public.informed_consents;
DROP POLICY IF EXISTS "Users can update their own informed consents" ON public.informed_consents;
DROP POLICY IF EXISTS "Users can delete their own informed consents" ON public.informed_consents;

-- 2. CRIAR NOVAS POLICIES CORRIGIDAS

-- ANAMNESIS
CREATE POLICY "anamnesis_select_policy" ON public.anamnesis
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "anamnesis_insert_policy" ON public.anamnesis
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "anamnesis_update_policy" ON public.anamnesis
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "anamnesis_delete_policy" ON public.anamnesis
  FOR DELETE USING (auth.uid() = user_id);

-- CLINICAL EVOLUTIONS
CREATE POLICY "clinical_evolutions_select_policy" ON public.clinical_evolutions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "clinical_evolutions_insert_policy" ON public.clinical_evolutions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "clinical_evolutions_update_policy" ON public.clinical_evolutions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "clinical_evolutions_delete_policy" ON public.clinical_evolutions
  FOR DELETE USING (auth.uid() = user_id);

-- MEDICAL PHOTOS
CREATE POLICY "medical_photos_select_policy" ON public.medical_photos
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "medical_photos_insert_policy" ON public.medical_photos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "medical_photos_update_policy" ON public.medical_photos
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "medical_photos_delete_policy" ON public.medical_photos
  FOR DELETE USING (auth.uid() = user_id);

-- INFORMED CONSENTS
CREATE POLICY "informed_consents_select_policy" ON public.informed_consents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "informed_consents_insert_policy" ON public.informed_consents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "informed_consents_update_policy" ON public.informed_consents
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "informed_consents_delete_policy" ON public.informed_consents
  FOR DELETE USING (auth.uid() = user_id);
