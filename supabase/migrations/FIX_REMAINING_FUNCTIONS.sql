-- =====================================================
-- SCRIPT PARA CORRIGIR AS 2 FUNÇÕES RESTANTES
-- Executar no SQL Editor do Supabase
-- Data: 2025-12-03
-- =====================================================

-- PROBLEMA: Existem múltiplas versões dessas funções com assinaturas diferentes
-- Precisamos dropar TODAS as versões antes de recriar

-- =====================================================
-- PASSO 1: DESCOBRIR TODAS AS VERSÕES DAS FUNÇÕES
-- =====================================================

-- Execute esta query primeiro para ver todas as versões:
-- SELECT p.oid, p.proname, pg_get_function_identity_arguments(p.oid) as args, p.proconfig
-- FROM pg_proc p
-- WHERE p.pronamespace = 'public'::regnamespace
-- AND p.proname IN ('create_activity_log', 'is_subscription_active');

-- =====================================================
-- PASSO 2: DROPAR TODAS AS VERSÕES USANDO CASCADE
-- =====================================================

-- Dropar TODAS as funções is_subscription_active (força remoção de todas as versões)
DO $$
DECLARE
    func_oid oid;
BEGIN
    FOR func_oid IN
        SELECT p.oid
        FROM pg_proc p
        WHERE p.pronamespace = 'public'::regnamespace
        AND p.proname = 'is_subscription_active'
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || func_oid::regprocedure || ' CASCADE';
    END LOOP;
END;
$$;

-- Dropar TODAS as funções create_activity_log (força remoção de todas as versões)
DO $$
DECLARE
    func_oid oid;
BEGIN
    FOR func_oid IN
        SELECT p.oid
        FROM pg_proc p
        WHERE p.pronamespace = 'public'::regnamespace
        AND p.proname = 'create_activity_log'
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || func_oid::regprocedure || ' CASCADE';
    END LOOP;
END;
$$;

-- =====================================================
-- PASSO 3: RECRIAR AS FUNÇÕES COM search_path
-- =====================================================

-- Recriar is_subscription_active
CREATE FUNCTION public.is_subscription_active()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_subscriptions
        WHERE user_id = auth.uid()
        AND status = 'active'
    );
END;
$$;

-- Recriar create_activity_log
CREATE FUNCTION public.create_activity_log(
    p_action TEXT,
    p_entity_type TEXT,
    p_entity_id UUID DEFAULT NULL,
    p_details JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO public.activity_logs (user_id, action, entity_type, entity_id, details)
    VALUES (auth.uid(), p_action, p_entity_type, p_entity_id, p_details)
    RETURNING id INTO v_log_id;

    RETURN v_log_id;
END;
$$;

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================

-- Verificar se as funções foram atualizadas com search_path
SELECT
    proname as function_name,
    proconfig as config
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
AND proname IN ('create_activity_log', 'is_subscription_active')
ORDER BY proname;

-- Esperado: Ambas devem mostrar {search_path=public} na coluna config
