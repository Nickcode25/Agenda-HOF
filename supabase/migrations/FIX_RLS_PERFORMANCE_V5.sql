-- =====================================================
-- SCRIPT V5 - APENAS DROP das políticas problemáticas
-- Executar no SQL Editor do Supabase
-- Data: 2025-12-03
-- =====================================================
-- NOTA: Algumas tabelas não têm user_id direto
-- Este script apenas remove as políticas antigas
-- =====================================================

-- =====================================================
-- PASSO 1: DROP políticas antigas (não falha se não existir)
-- =====================================================

-- STOCK_ITEMS
DROP POLICY IF EXISTS "Users can view own stock_items" ON public.stock_items;
DROP POLICY IF EXISTS "Users can insert own stock_items" ON public.stock_items;
DROP POLICY IF EXISTS "Users can update own stock_items" ON public.stock_items;
DROP POLICY IF EXISTS "Users can delete own stock_items" ON public.stock_items;

-- SALE_ITEMS
DROP POLICY IF EXISTS "Users can view own sale_items" ON public.sale_items;
DROP POLICY IF EXISTS "Users can insert own sale_items" ON public.sale_items;
DROP POLICY IF EXISTS "Users can update own sale_items" ON public.sale_items;
DROP POLICY IF EXISTS "Users can delete own sale_items" ON public.sale_items;

-- NOTIFICATIONS (políticas antigas com nome diferente)
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can insert own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;

-- CATEGORIES
DROP POLICY IF EXISTS "Users can view their own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can insert their own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can update their own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can delete their own categories" ON public.categories;

-- WHATSAPP_MESSAGES_LOG
DROP POLICY IF EXISTS "Users can view own messages" ON public.whatsapp_messages_log;
DROP POLICY IF EXISTS "Users can insert own messages" ON public.whatsapp_messages_log;
DROP POLICY IF EXISTS "Users can update own messages" ON public.whatsapp_messages_log;
DROP POLICY IF EXISTS "Users can delete own messages" ON public.whatsapp_messages_log;

-- PAYMENT_HISTORY
DROP POLICY IF EXISTS "Usuários podem ver próprio histórico" ON public.payment_history;

-- COURTESY_USERS
DROP POLICY IF EXISTS "allow_users_read_own_courtesy" ON public.courtesy_users;

-- SUPER_ADMINS
DROP POLICY IF EXISTS "Super admins can view their own data" ON public.super_admins;

-- ANAMNESIS
DROP POLICY IF EXISTS "Users can view own anamnesis" ON public.anamnesis;
DROP POLICY IF EXISTS "Users can insert own anamnesis" ON public.anamnesis;
DROP POLICY IF EXISTS "Users can update own anamnesis" ON public.anamnesis;
DROP POLICY IF EXISTS "Users can delete own anamnesis" ON public.anamnesis;

-- CLINICAL_EVOLUTIONS
DROP POLICY IF EXISTS "Users can view own clinical_evolutions" ON public.clinical_evolutions;
DROP POLICY IF EXISTS "Users can insert own clinical_evolutions" ON public.clinical_evolutions;
DROP POLICY IF EXISTS "Users can update own clinical_evolutions" ON public.clinical_evolutions;
DROP POLICY IF EXISTS "Users can delete own clinical_evolutions" ON public.clinical_evolutions;

-- MEDICAL_PHOTOS
DROP POLICY IF EXISTS "Users can view own medical_photos" ON public.medical_photos;
DROP POLICY IF EXISTS "Users can insert own medical_photos" ON public.medical_photos;
DROP POLICY IF EXISTS "Users can update own medical_photos" ON public.medical_photos;
DROP POLICY IF EXISTS "Users can delete own medical_photos" ON public.medical_photos;

-- INFORMED_CONSENTS
DROP POLICY IF EXISTS "Users can view own informed_consents" ON public.informed_consents;
DROP POLICY IF EXISTS "Users can insert own informed_consents" ON public.informed_consents;
DROP POLICY IF EXISTS "Users can update own informed_consents" ON public.informed_consents;
DROP POLICY IF EXISTS "Users can delete own informed_consents" ON public.informed_consents;

-- STUDENTS
DROP POLICY IF EXISTS "Users can view own students" ON public.students;
DROP POLICY IF EXISTS "Users can insert own students" ON public.students;
DROP POLICY IF EXISTS "Users can update own students" ON public.students;
DROP POLICY IF EXISTS "Users can delete own students" ON public.students;

-- MENTORSHIPS
DROP POLICY IF EXISTS "Users can view own mentorships" ON public.mentorships;
DROP POLICY IF EXISTS "Users can insert own mentorships" ON public.mentorships;
DROP POLICY IF EXISTS "Users can update own mentorships" ON public.mentorships;
DROP POLICY IF EXISTS "Users can delete own mentorships" ON public.mentorships;

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================

SELECT 'Políticas antigas removidas com sucesso!' as resultado;

-- =====================================================
-- SEÇÕES COMENTADAS - TABELAS QUE PODEM NÃO EXISTIR
-- Descomentar e executar separadamente se necessário
-- =====================================================

/*
-- COURTESY_USERS
DROP POLICY IF EXISTS "allow_users_read_own_courtesy" ON public.courtesy_users;
CREATE POLICY "allow_users_read_own_courtesy" ON public.courtesy_users
FOR SELECT USING (user_id = (select auth.uid()));

-- SUPER_ADMINS
DROP POLICY IF EXISTS "Super admins can view their own data" ON public.super_admins;
CREATE POLICY "Super admins can view their own data" ON public.super_admins
FOR SELECT USING (user_id = (select auth.uid()));

-- ANAMNESIS
DROP POLICY IF EXISTS "Users can view own anamnesis" ON public.anamnesis;
DROP POLICY IF EXISTS "Users can insert own anamnesis" ON public.anamnesis;
DROP POLICY IF EXISTS "Users can update own anamnesis" ON public.anamnesis;
DROP POLICY IF EXISTS "Users can delete own anamnesis" ON public.anamnesis;

CREATE POLICY "Users can view own anamnesis" ON public.anamnesis
FOR SELECT USING (user_id = (select auth.uid()));
CREATE POLICY "Users can insert own anamnesis" ON public.anamnesis
FOR INSERT WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "Users can update own anamnesis" ON public.anamnesis
FOR UPDATE USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "Users can delete own anamnesis" ON public.anamnesis
FOR DELETE USING (user_id = (select auth.uid()));

-- CLINICAL_EVOLUTIONS
DROP POLICY IF EXISTS "Users can view own clinical_evolutions" ON public.clinical_evolutions;
DROP POLICY IF EXISTS "Users can insert own clinical_evolutions" ON public.clinical_evolutions;
DROP POLICY IF EXISTS "Users can update own clinical_evolutions" ON public.clinical_evolutions;
DROP POLICY IF EXISTS "Users can delete own clinical_evolutions" ON public.clinical_evolutions;

CREATE POLICY "Users can view own clinical_evolutions" ON public.clinical_evolutions
FOR SELECT USING (user_id = (select auth.uid()));
CREATE POLICY "Users can insert own clinical_evolutions" ON public.clinical_evolutions
FOR INSERT WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "Users can update own clinical_evolutions" ON public.clinical_evolutions
FOR UPDATE USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "Users can delete own clinical_evolutions" ON public.clinical_evolutions
FOR DELETE USING (user_id = (select auth.uid()));

-- MEDICAL_PHOTOS
DROP POLICY IF EXISTS "Users can view own medical_photos" ON public.medical_photos;
DROP POLICY IF EXISTS "Users can insert own medical_photos" ON public.medical_photos;
DROP POLICY IF EXISTS "Users can update own medical_photos" ON public.medical_photos;
DROP POLICY IF EXISTS "Users can delete own medical_photos" ON public.medical_photos;

CREATE POLICY "Users can view own medical_photos" ON public.medical_photos
FOR SELECT USING (user_id = (select auth.uid()));
CREATE POLICY "Users can insert own medical_photos" ON public.medical_photos
FOR INSERT WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "Users can update own medical_photos" ON public.medical_photos
FOR UPDATE USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "Users can delete own medical_photos" ON public.medical_photos
FOR DELETE USING (user_id = (select auth.uid()));

-- INFORMED_CONSENTS
DROP POLICY IF EXISTS "Users can view own informed_consents" ON public.informed_consents;
DROP POLICY IF EXISTS "Users can insert own informed_consents" ON public.informed_consents;
DROP POLICY IF EXISTS "Users can update own informed_consents" ON public.informed_consents;
DROP POLICY IF EXISTS "Users can delete own informed_consents" ON public.informed_consents;

CREATE POLICY "Users can view own informed_consents" ON public.informed_consents
FOR SELECT USING (user_id = (select auth.uid()));
CREATE POLICY "Users can insert own informed_consents" ON public.informed_consents
FOR INSERT WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "Users can update own informed_consents" ON public.informed_consents
FOR UPDATE USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "Users can delete own informed_consents" ON public.informed_consents
FOR DELETE USING (user_id = (select auth.uid()));

-- STUDENTS
DROP POLICY IF EXISTS "Users can view own students" ON public.students;
DROP POLICY IF EXISTS "Users can insert own students" ON public.students;
DROP POLICY IF EXISTS "Users can update own students" ON public.students;
DROP POLICY IF EXISTS "Users can delete own students" ON public.students;

CREATE POLICY "Users can view own students" ON public.students
FOR SELECT USING (user_id = (select auth.uid()));
CREATE POLICY "Users can insert own students" ON public.students
FOR INSERT WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "Users can update own students" ON public.students
FOR UPDATE USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "Users can delete own students" ON public.students
FOR DELETE USING (user_id = (select auth.uid()));

-- MENTORSHIPS
DROP POLICY IF EXISTS "Users can view own mentorships" ON public.mentorships;
DROP POLICY IF EXISTS "Users can insert own mentorships" ON public.mentorships;
DROP POLICY IF EXISTS "Users can update own mentorships" ON public.mentorships;
DROP POLICY IF EXISTS "Users can delete own mentorships" ON public.mentorships;

CREATE POLICY "Users can view own mentorships" ON public.mentorships
FOR SELECT USING (user_id = (select auth.uid()));
CREATE POLICY "Users can insert own mentorships" ON public.mentorships
FOR INSERT WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "Users can update own mentorships" ON public.mentorships
FOR UPDATE USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "Users can delete own mentorships" ON public.mentorships
FOR DELETE USING (user_id = (select auth.uid()));
*/
