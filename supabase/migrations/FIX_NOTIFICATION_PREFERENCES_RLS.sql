-- =====================================================
-- SCRIPT PARA CORRIGIR RLS DA TABELA notification_preferences
-- Executar no SQL Editor do Supabase
-- Data: 2025-12-03
-- =====================================================

-- PROBLEMA: A tabela notification_preferences não tem políticas RLS simples
-- que permitem acesso ao próprio usuário

-- =====================================================
-- PASSO 1: VERIFICAR SE RLS ESTÁ HABILITADO
-- =====================================================

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PASSO 2: REMOVER POLÍTICAS PROBLEMÁTICAS (se existirem)
-- =====================================================

DROP POLICY IF EXISTS "Users can view their own notification_preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Users can insert their own notification_preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Users can update their own notification_preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Users can delete their own notification_preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Users can view notification_preferences from their clinic" ON public.notification_preferences;

-- =====================================================
-- PASSO 3: CRIAR POLÍTICAS SIMPLES BASEADAS EM user_id = auth.uid()
-- =====================================================

-- SELECT - Usuário pode ver suas próprias preferências
CREATE POLICY "Users can view their own notification_preferences"
ON public.notification_preferences
FOR SELECT
USING (user_id = auth.uid());

-- INSERT - Usuário pode criar suas próprias preferências
CREATE POLICY "Users can insert their own notification_preferences"
ON public.notification_preferences
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- UPDATE - Usuário pode atualizar suas próprias preferências
CREATE POLICY "Users can update their own notification_preferences"
ON public.notification_preferences
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- DELETE - Usuário pode deletar suas próprias preferências
CREATE POLICY "Users can delete their own notification_preferences"
ON public.notification_preferences
FOR DELETE
USING (user_id = auth.uid());

-- =====================================================
-- PASSO 4: FAZER O MESMO PARA notification_settings
-- =====================================================

ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own notification_settings" ON public.notification_settings;
DROP POLICY IF EXISTS "Users can insert their own notification_settings" ON public.notification_settings;
DROP POLICY IF EXISTS "Users can update their own notification_settings" ON public.notification_settings;
DROP POLICY IF EXISTS "Users can delete their own notification_settings" ON public.notification_settings;
DROP POLICY IF EXISTS "Users can view notification_settings from their clinic" ON public.notification_settings;

CREATE POLICY "Users can view their own notification_settings"
ON public.notification_settings
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own notification_settings"
ON public.notification_settings
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own notification_settings"
ON public.notification_settings
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own notification_settings"
ON public.notification_settings
FOR DELETE
USING (user_id = auth.uid());

-- =====================================================
-- PASSO 5: GARANTIR QUE appointments TEM POLÍTICAS CORRETAS
-- =====================================================

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can insert their own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can update their own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can delete their own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can view appointments from their clinic" ON public.appointments;

CREATE POLICY "Users can view their own appointments"
ON public.appointments
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own appointments"
ON public.appointments
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own appointments"
ON public.appointments
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own appointments"
ON public.appointments
FOR DELETE
USING (user_id = auth.uid());

-- =====================================================
-- PASSO 6: GARANTIR QUE recurring_blocks TEM POLÍTICAS CORRETAS
-- =====================================================

ALTER TABLE public.recurring_blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own recurring_blocks" ON public.recurring_blocks;
DROP POLICY IF EXISTS "Users can insert their own recurring_blocks" ON public.recurring_blocks;
DROP POLICY IF EXISTS "Users can update their own recurring_blocks" ON public.recurring_blocks;
DROP POLICY IF EXISTS "Users can delete their own recurring_blocks" ON public.recurring_blocks;
DROP POLICY IF EXISTS "Users can view recurring_blocks from their clinic" ON public.recurring_blocks;

CREATE POLICY "Users can view their own recurring_blocks"
ON public.recurring_blocks
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own recurring_blocks"
ON public.recurring_blocks
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own recurring_blocks"
ON public.recurring_blocks
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own recurring_blocks"
ON public.recurring_blocks
FOR DELETE
USING (user_id = auth.uid());

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================

-- Verificar políticas criadas
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('notification_preferences', 'notification_settings', 'appointments', 'recurring_blocks')
ORDER BY tablename, policyname;
