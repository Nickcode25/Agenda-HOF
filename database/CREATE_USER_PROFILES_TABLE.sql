-- ==============================================
-- Criar tabela user_profiles para gerenciar roles de usuários
-- Execute este SQL no Supabase SQL Editor
-- ==============================================

-- 1. Criar tabela user_profiles se não existir
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'owner', -- 'owner' para administrador, 'staff' para funcionário
    clinic_id UUID, -- ID da clínica/owner principal
    parent_user_id UUID REFERENCES auth.users(id), -- Se for funcionário, aponta para o owner
    display_name TEXT,
    full_name TEXT,
    social_name TEXT,
    username TEXT,
    profile_photo TEXT,
    phone TEXT,
    secondary_phone TEXT,
    address JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Criar índices
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_clinic_id ON public.user_profiles(clinic_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_parent_user_id ON public.user_profiles(parent_user_id);

-- 3. Habilitar RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas de acesso
-- Usuários podem ver seu próprio perfil
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT
    TO authenticated
    USING (
        auth.uid() = id
        OR auth.uid() = parent_user_id
        OR auth.uid() = clinic_id
    );

-- Usuários podem criar seu próprio perfil
DROP POLICY IF EXISTS "Users can create own profile" ON public.user_profiles;
CREATE POLICY "Users can create own profile" ON public.user_profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- Usuários podem atualizar seu próprio perfil
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id OR auth.uid() = clinic_id);

-- Owners podem criar perfis de staff
DROP POLICY IF EXISTS "Owners can create staff profiles" ON public.user_profiles;
CREATE POLICY "Owners can create staff profiles" ON public.user_profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = clinic_id
        OR auth.uid() = parent_user_id
    );

-- Owners podem ver perfis de staff
DROP POLICY IF EXISTS "Owners can view staff profiles" ON public.user_profiles;
CREATE POLICY "Owners can view staff profiles" ON public.user_profiles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = clinic_id);

-- Service role pode fazer tudo
DROP POLICY IF EXISTS "Service role can manage profiles" ON public.user_profiles;
CREATE POLICY "Service role can manage profiles" ON public.user_profiles
    FOR ALL
    TO service_role
    USING (TRUE)
    WITH CHECK (TRUE);

-- 5. Conceder permissões
GRANT SELECT, INSERT, UPDATE ON public.user_profiles TO authenticated;
GRANT ALL ON public.user_profiles TO service_role;

-- 6. Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER trigger_update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_user_profiles_updated_at();

-- 7. Criar perfis para usuários existentes que não têm perfil
-- Todos os usuários existentes são considerados owners
INSERT INTO public.user_profiles (id, role, clinic_id, display_name, is_active)
SELECT
    au.id,
    'owner',
    au.id,
    COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1)),
    true
FROM auth.users au
WHERE NOT EXISTS (
    SELECT 1 FROM public.user_profiles up WHERE up.id = au.id
);

-- 8. Verificar resultados
SELECT
    up.id,
    up.role,
    up.display_name,
    up.is_active,
    au.email
FROM public.user_profiles up
JOIN auth.users au ON au.id = up.id
ORDER BY up.created_at DESC
LIMIT 10;

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Tabela user_profiles criada e usuários existentes migrados como owners!';
END $$;
