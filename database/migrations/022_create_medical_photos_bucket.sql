-- =============================================
-- STORAGE BUCKET PARA FOTOS MÉDICAS
-- =============================================

-- Criar bucket para fotos médicas (se não existir)
INSERT INTO storage.buckets (id, name, public)
VALUES ('medical-photos', 'medical-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Policy para permitir upload de fotos (apenas usuários autenticados)
CREATE POLICY "Authenticated users can upload medical photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'medical-photos');

-- Policy para permitir visualização de fotos (apenas do próprio usuário)
CREATE POLICY "Users can view their own medical photos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'medical-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Policy para permitir deleção de fotos (apenas do próprio usuário)
CREATE POLICY "Users can delete their own medical photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'medical-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Policy para permitir atualização de fotos (apenas do próprio usuário)
CREATE POLICY "Users can update their own medical photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'medical-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
