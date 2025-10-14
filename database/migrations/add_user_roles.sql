-- Adicionar sistema de roles e multi-conta
-- Este script adiciona suporte para conta principal (owner) e funcionários (staff)

-- 1. Adicionar colunas na tabela auth.users através de uma tabela separada
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'staff')),
  clinic_id UUID, -- ID da clínica (mesmo para owner e seus funcionários)
  parent_user_id UUID REFERENCES auth.users(id), -- Para staff, aponta para o owner
  display_name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Habilitar RLS na nova tabela
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 3. Política: Usuários podem ver seu próprio perfil
CREATE POLICY "Users can view their own profile"
  ON public.user_profiles
  FOR SELECT
  USING (auth.uid() = id);

-- 4. Política: Owners podem ver perfis dos seus funcionários
CREATE POLICY "Owners can view their staff profiles"
  ON public.user_profiles
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM public.user_profiles
      WHERE role = 'owner' AND clinic_id = user_profiles.clinic_id
    )
  );

-- 5. Política: Owners podem criar funcionários
CREATE POLICY "Owners can create staff"
  ON public.user_profiles
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM public.user_profiles WHERE role = 'owner'
    )
  );

-- 6. Política: Owners podem atualizar seus funcionários
CREATE POLICY "Owners can update their staff"
  ON public.user_profiles
  FOR UPDATE
  USING (
    auth.uid() = parent_user_id OR auth.uid() = id
  );

-- 7. Criar função para inicializar perfil automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, role, clinic_id, display_name)
  VALUES (
    NEW.id,
    'owner', -- Por padrão, novos usuários são owners
    NEW.id,  -- clinic_id é o próprio id do owner
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Criar trigger para novos usuários
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 9. Popular perfis existentes (executar apenas uma vez)
INSERT INTO public.user_profiles (id, role, clinic_id, display_name, created_at)
SELECT
  id,
  'owner',
  id,
  COALESCE(raw_user_meta_data->>'name', email),
  created_at
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_profiles WHERE user_profiles.id = users.id
);

-- 10. Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_clinic_id ON public.user_profiles(clinic_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_parent_user_id ON public.user_profiles(parent_user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);

-- 11. Função helper para verificar se usuário é owner
CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'owner'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- 12. Função helper para obter clinic_id do usuário atual
CREATE OR REPLACE FUNCTION public.get_user_clinic_id()
RETURNS UUID AS $$
  SELECT clinic_id FROM public.user_profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;
