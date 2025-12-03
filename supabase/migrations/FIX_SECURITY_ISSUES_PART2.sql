-- =====================================================
-- SCRIPT PARA CORRIGIR TABELAS RESTANTES SEM RLS
-- Executar no SQL Editor do Supabase
-- Data: 2025-12-03
-- =====================================================

-- Tabelas que ainda estao sem RLS:
-- 1. patient_subscriptions_backup (backup - pode ignorar)
-- 2. products
-- 3. sale_items
-- 4. stock_items
-- 5. stock_movements
-- 6. subscription_payments_backup (backup - pode ignorar)
-- 7. user_monthly_plans_backup (backup - pode ignorar)

-- =====================================================
-- PARTE 1: HABILITAR RLS NAS TABELAS DE PRODUCAO
-- =====================================================

-- products
ALTER TABLE IF EXISTS public.products ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can view own products" ON public.products;
    DROP POLICY IF EXISTS "Users can insert own products" ON public.products;
    DROP POLICY IF EXISTS "Users can update own products" ON public.products;
    DROP POLICY IF EXISTS "Users can delete own products" ON public.products;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'user_id') THEN
        CREATE POLICY "Users can view own products" ON public.products
            FOR SELECT USING (auth.uid() = user_id);
        CREATE POLICY "Users can insert own products" ON public.products
            FOR INSERT WITH CHECK (auth.uid() = user_id);
        CREATE POLICY "Users can update own products" ON public.products
            FOR UPDATE USING (auth.uid() = user_id);
        CREATE POLICY "Users can delete own products" ON public.products
            FOR DELETE USING (auth.uid() = user_id);
    ELSE
        -- Se nao tem user_id, dar acesso para todos usuarios autenticados
        CREATE POLICY "Authenticated users can view products" ON public.products
            FOR SELECT TO authenticated USING (true);
        CREATE POLICY "Authenticated users can insert products" ON public.products
            FOR INSERT TO authenticated WITH CHECK (true);
        CREATE POLICY "Authenticated users can update products" ON public.products
            FOR UPDATE TO authenticated USING (true);
        CREATE POLICY "Authenticated users can delete products" ON public.products
            FOR DELETE TO authenticated USING (true);
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'products policies error: %', SQLERRM;
END $$;

-- sale_items
ALTER TABLE IF EXISTS public.sale_items ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can view own sale_items" ON public.sale_items;
    DROP POLICY IF EXISTS "Users can insert own sale_items" ON public.sale_items;
    DROP POLICY IF EXISTS "Users can update own sale_items" ON public.sale_items;
    DROP POLICY IF EXISTS "Users can delete own sale_items" ON public.sale_items;

    -- sale_items provavelmente tem sale_id que referencia sales
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sale_items' AND column_name = 'sale_id') THEN
        CREATE POLICY "Users can view own sale_items" ON public.sale_items
            FOR SELECT USING (
                EXISTS (SELECT 1 FROM public.sales WHERE sales.id = sale_items.sale_id AND sales.user_id = auth.uid())
            );
        CREATE POLICY "Users can insert own sale_items" ON public.sale_items
            FOR INSERT WITH CHECK (
                EXISTS (SELECT 1 FROM public.sales WHERE sales.id = sale_items.sale_id AND sales.user_id = auth.uid())
            );
        CREATE POLICY "Users can update own sale_items" ON public.sale_items
            FOR UPDATE USING (
                EXISTS (SELECT 1 FROM public.sales WHERE sales.id = sale_items.sale_id AND sales.user_id = auth.uid())
            );
        CREATE POLICY "Users can delete own sale_items" ON public.sale_items
            FOR DELETE USING (
                EXISTS (SELECT 1 FROM public.sales WHERE sales.id = sale_items.sale_id AND sales.user_id = auth.uid())
            );
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sale_items' AND column_name = 'user_id') THEN
        CREATE POLICY "Users can view own sale_items" ON public.sale_items
            FOR SELECT USING (auth.uid() = user_id);
        CREATE POLICY "Users can insert own sale_items" ON public.sale_items
            FOR INSERT WITH CHECK (auth.uid() = user_id);
        CREATE POLICY "Users can update own sale_items" ON public.sale_items
            FOR UPDATE USING (auth.uid() = user_id);
        CREATE POLICY "Users can delete own sale_items" ON public.sale_items
            FOR DELETE USING (auth.uid() = user_id);
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'sale_items policies error: %', SQLERRM;
END $$;

-- stock_items
ALTER TABLE IF EXISTS public.stock_items ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can view own stock_items" ON public.stock_items;
    DROP POLICY IF EXISTS "Users can insert own stock_items" ON public.stock_items;
    DROP POLICY IF EXISTS "Users can update own stock_items" ON public.stock_items;
    DROP POLICY IF EXISTS "Users can delete own stock_items" ON public.stock_items;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'stock_items' AND column_name = 'user_id') THEN
        CREATE POLICY "Users can view own stock_items" ON public.stock_items
            FOR SELECT USING (auth.uid() = user_id);
        CREATE POLICY "Users can insert own stock_items" ON public.stock_items
            FOR INSERT WITH CHECK (auth.uid() = user_id);
        CREATE POLICY "Users can update own stock_items" ON public.stock_items
            FOR UPDATE USING (auth.uid() = user_id);
        CREATE POLICY "Users can delete own stock_items" ON public.stock_items
            FOR DELETE USING (auth.uid() = user_id);
    ELSE
        -- Se nao tem user_id, dar acesso para todos usuarios autenticados
        CREATE POLICY "Authenticated users can view stock_items" ON public.stock_items
            FOR SELECT TO authenticated USING (true);
        CREATE POLICY "Authenticated users can insert stock_items" ON public.stock_items
            FOR INSERT TO authenticated WITH CHECK (true);
        CREATE POLICY "Authenticated users can update stock_items" ON public.stock_items
            FOR UPDATE TO authenticated USING (true);
        CREATE POLICY "Authenticated users can delete stock_items" ON public.stock_items
            FOR DELETE TO authenticated USING (true);
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'stock_items policies error: %', SQLERRM;
END $$;

-- stock_movements
ALTER TABLE IF EXISTS public.stock_movements ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can view own stock_movements" ON public.stock_movements;
    DROP POLICY IF EXISTS "Users can insert own stock_movements" ON public.stock_movements;
    DROP POLICY IF EXISTS "Users can update own stock_movements" ON public.stock_movements;
    DROP POLICY IF EXISTS "Users can delete own stock_movements" ON public.stock_movements;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'stock_movements' AND column_name = 'user_id') THEN
        CREATE POLICY "Users can view own stock_movements" ON public.stock_movements
            FOR SELECT USING (auth.uid() = user_id);
        CREATE POLICY "Users can insert own stock_movements" ON public.stock_movements
            FOR INSERT WITH CHECK (auth.uid() = user_id);
        CREATE POLICY "Users can update own stock_movements" ON public.stock_movements
            FOR UPDATE USING (auth.uid() = user_id);
        CREATE POLICY "Users can delete own stock_movements" ON public.stock_movements
            FOR DELETE USING (auth.uid() = user_id);
    ELSE
        -- Se nao tem user_id, dar acesso para todos usuarios autenticados
        CREATE POLICY "Authenticated users can view stock_movements" ON public.stock_movements
            FOR SELECT TO authenticated USING (true);
        CREATE POLICY "Authenticated users can insert stock_movements" ON public.stock_movements
            FOR INSERT TO authenticated WITH CHECK (true);
        CREATE POLICY "Authenticated users can update stock_movements" ON public.stock_movements
            FOR UPDATE TO authenticated USING (true);
        CREATE POLICY "Authenticated users can delete stock_movements" ON public.stock_movements
            FOR DELETE TO authenticated USING (true);
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'stock_movements policies error: %', SQLERRM;
END $$;

-- =====================================================
-- PARTE 2: TABELAS DE BACKUP (opcional - habilitar RLS para seguranca)
-- =====================================================

-- patient_subscriptions_backup
ALTER TABLE IF EXISTS public.patient_subscriptions_backup ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Super admins can view patient_subscriptions_backup" ON public.patient_subscriptions_backup;

    CREATE POLICY "Super admins can view patient_subscriptions_backup" ON public.patient_subscriptions_backup
        FOR SELECT USING (
            EXISTS (SELECT 1 FROM public.super_admins WHERE user_id = auth.uid())
        );
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'patient_subscriptions_backup policies error: %', SQLERRM;
END $$;

-- subscription_payments_backup
ALTER TABLE IF EXISTS public.subscription_payments_backup ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Super admins can view subscription_payments_backup" ON public.subscription_payments_backup;

    CREATE POLICY "Super admins can view subscription_payments_backup" ON public.subscription_payments_backup
        FOR SELECT USING (
            EXISTS (SELECT 1 FROM public.super_admins WHERE user_id = auth.uid())
        );
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'subscription_payments_backup policies error: %', SQLERRM;
END $$;

-- user_monthly_plans_backup
ALTER TABLE IF EXISTS public.user_monthly_plans_backup ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Super admins can view user_monthly_plans_backup" ON public.user_monthly_plans_backup;

    CREATE POLICY "Super admins can view user_monthly_plans_backup" ON public.user_monthly_plans_backup
        FOR SELECT USING (
            EXISTS (SELECT 1 FROM public.super_admins WHERE user_id = auth.uid())
        );
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'user_monthly_plans_backup policies error: %', SQLERRM;
END $$;

-- =====================================================
-- VERIFICACAO FINAL
-- =====================================================

SELECT
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = false
ORDER BY tablename;
