-- =====================================================
-- SCRIPT PARA OTIMIZAR PERFORMANCE DAS POLÍTICAS RLS
-- Executar no SQL Editor do Supabase
-- Data: 2025-12-03
-- =====================================================

-- PROBLEMA: Políticas RLS usando auth.uid() diretamente são re-avaliadas
-- para cada linha, causando performance ruim em tabelas grandes.
-- SOLUÇÃO: Usar (select auth.uid()) para avaliar uma única vez.

-- =====================================================
-- PASSO 1: PROFESSIONALS
-- =====================================================

DROP POLICY IF EXISTS "Users can view their own professionals" ON public.professionals;
DROP POLICY IF EXISTS "Users can insert their own professionals" ON public.professionals;
DROP POLICY IF EXISTS "Users can update their own professionals" ON public.professionals;
DROP POLICY IF EXISTS "Users can delete their own professionals" ON public.professionals;

CREATE POLICY "Users can view their own professionals" ON public.professionals
FOR SELECT USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert their own professionals" ON public.professionals
FOR INSERT WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update their own professionals" ON public.professionals
FOR UPDATE USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete their own professionals" ON public.professionals
FOR DELETE USING (user_id = (select auth.uid()));

-- =====================================================
-- PASSO 2: PATIENTS
-- =====================================================

DROP POLICY IF EXISTS "Users can view their own patients" ON public.patients;
DROP POLICY IF EXISTS "Users can insert their own patients" ON public.patients;
DROP POLICY IF EXISTS "Users can update their own patients" ON public.patients;
DROP POLICY IF EXISTS "Users can delete their own patients" ON public.patients;

CREATE POLICY "Users can view their own patients" ON public.patients
FOR SELECT USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert their own patients" ON public.patients
FOR INSERT WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update their own patients" ON public.patients
FOR UPDATE USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete their own patients" ON public.patients
FOR DELETE USING (user_id = (select auth.uid()));

-- =====================================================
-- PASSO 3: APPOINTMENTS
-- =====================================================

DROP POLICY IF EXISTS "Users can view their own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can insert their own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can update their own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can delete their own appointments" ON public.appointments;

CREATE POLICY "Users can view their own appointments" ON public.appointments
FOR SELECT USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert their own appointments" ON public.appointments
FOR INSERT WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update their own appointments" ON public.appointments
FOR UPDATE USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete their own appointments" ON public.appointments
FOR DELETE USING (user_id = (select auth.uid()));

-- =====================================================
-- PASSO 4: PROCEDURES
-- =====================================================

DROP POLICY IF EXISTS "Users can view their own procedures" ON public.procedures;
DROP POLICY IF EXISTS "Users can insert their own procedures" ON public.procedures;
DROP POLICY IF EXISTS "Users can update their own procedures" ON public.procedures;
DROP POLICY IF EXISTS "Users can delete their own procedures" ON public.procedures;

CREATE POLICY "Users can view their own procedures" ON public.procedures
FOR SELECT USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert their own procedures" ON public.procedures
FOR INSERT WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update their own procedures" ON public.procedures
FOR UPDATE USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete their own procedures" ON public.procedures
FOR DELETE USING (user_id = (select auth.uid()));

-- =====================================================
-- PASSO 5: SALES
-- =====================================================

DROP POLICY IF EXISTS "Users can view their own sales" ON public.sales;
DROP POLICY IF EXISTS "Users can insert their own sales" ON public.sales;
DROP POLICY IF EXISTS "Users can update their own sales" ON public.sales;
DROP POLICY IF EXISTS "Users can delete their own sales" ON public.sales;

CREATE POLICY "Users can view their own sales" ON public.sales
FOR SELECT USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert their own sales" ON public.sales
FOR INSERT WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update their own sales" ON public.sales
FOR UPDATE USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete their own sales" ON public.sales
FOR DELETE USING (user_id = (select auth.uid()));

-- =====================================================
-- PASSO 6: EXPENSES
-- =====================================================

DROP POLICY IF EXISTS "Enable all for authenticated users on expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can view their own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can insert their own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can update their own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can delete their own expenses" ON public.expenses;

CREATE POLICY "Users can view their own expenses" ON public.expenses
FOR SELECT USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert their own expenses" ON public.expenses
FOR INSERT WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update their own expenses" ON public.expenses
FOR UPDATE USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete their own expenses" ON public.expenses
FOR DELETE USING (user_id = (select auth.uid()));

-- =====================================================
-- PASSO 7: EXPENSE_CATEGORIES
-- =====================================================

DROP POLICY IF EXISTS "Enable all for authenticated users on expense_categories" ON public.expense_categories;
DROP POLICY IF EXISTS "Users can view their own expense_categories" ON public.expense_categories;
DROP POLICY IF EXISTS "Users can insert their own expense_categories" ON public.expense_categories;
DROP POLICY IF EXISTS "Users can update their own expense_categories" ON public.expense_categories;
DROP POLICY IF EXISTS "Users can delete their own expense_categories" ON public.expense_categories;

CREATE POLICY "Users can view their own expense_categories" ON public.expense_categories
FOR SELECT USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert their own expense_categories" ON public.expense_categories
FOR INSERT WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update their own expense_categories" ON public.expense_categories
FOR UPDATE USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete their own expense_categories" ON public.expense_categories
FOR DELETE USING (user_id = (select auth.uid()));

-- =====================================================
-- PASSO 8: WAITLIST
-- =====================================================

DROP POLICY IF EXISTS "Users can view their own waitlist" ON public.waitlist;
DROP POLICY IF EXISTS "Users can insert their own waitlist" ON public.waitlist;
DROP POLICY IF EXISTS "Users can update their own waitlist" ON public.waitlist;
DROP POLICY IF EXISTS "Users can delete their own waitlist" ON public.waitlist;

CREATE POLICY "Users can view their own waitlist" ON public.waitlist
FOR SELECT USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert their own waitlist" ON public.waitlist
FOR INSERT WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update their own waitlist" ON public.waitlist
FOR UPDATE USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete their own waitlist" ON public.waitlist
FOR DELETE USING (user_id = (select auth.uid()));

-- =====================================================
-- PASSO 9: RECURRING_BLOCKS
-- =====================================================

DROP POLICY IF EXISTS "Users can view own recurring_blocks" ON public.recurring_blocks;
DROP POLICY IF EXISTS "Users can insert own recurring_blocks" ON public.recurring_blocks;
DROP POLICY IF EXISTS "Users can update own recurring_blocks" ON public.recurring_blocks;
DROP POLICY IF EXISTS "Users can delete own recurring_blocks" ON public.recurring_blocks;
DROP POLICY IF EXISTS "Users can view their own recurring_blocks" ON public.recurring_blocks;
DROP POLICY IF EXISTS "Users can insert their own recurring_blocks" ON public.recurring_blocks;
DROP POLICY IF EXISTS "Users can update their own recurring_blocks" ON public.recurring_blocks;
DROP POLICY IF EXISTS "Users can delete their own recurring_blocks" ON public.recurring_blocks;

CREATE POLICY "Users can view their own recurring_blocks" ON public.recurring_blocks
FOR SELECT USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert their own recurring_blocks" ON public.recurring_blocks
FOR INSERT WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update their own recurring_blocks" ON public.recurring_blocks
FOR UPDATE USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete their own recurring_blocks" ON public.recurring_blocks
FOR DELETE USING (user_id = (select auth.uid()));

-- =====================================================
-- PASSO 10: CASH_REGISTERS
-- =====================================================

DROP POLICY IF EXISTS "Enable all for authenticated users on cash_registers" ON public.cash_registers;
DROP POLICY IF EXISTS "Users can view their own cash_registers" ON public.cash_registers;
DROP POLICY IF EXISTS "Users can insert their own cash_registers" ON public.cash_registers;
DROP POLICY IF EXISTS "Users can update their own cash_registers" ON public.cash_registers;
DROP POLICY IF EXISTS "Users can delete their own cash_registers" ON public.cash_registers;

CREATE POLICY "Users can view their own cash_registers" ON public.cash_registers
FOR SELECT USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert their own cash_registers" ON public.cash_registers
FOR INSERT WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update their own cash_registers" ON public.cash_registers
FOR UPDATE USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete their own cash_registers" ON public.cash_registers
FOR DELETE USING (user_id = (select auth.uid()));

-- =====================================================
-- PASSO 11: CASH_SESSIONS
-- =====================================================

DROP POLICY IF EXISTS "Enable all for authenticated users on cash_sessions" ON public.cash_sessions;
DROP POLICY IF EXISTS "Users can view their own cash_sessions" ON public.cash_sessions;
DROP POLICY IF EXISTS "Users can insert their own cash_sessions" ON public.cash_sessions;
DROP POLICY IF EXISTS "Users can update their own cash_sessions" ON public.cash_sessions;
DROP POLICY IF EXISTS "Users can delete their own cash_sessions" ON public.cash_sessions;

CREATE POLICY "Users can view their own cash_sessions" ON public.cash_sessions
FOR SELECT USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert their own cash_sessions" ON public.cash_sessions
FOR INSERT WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update their own cash_sessions" ON public.cash_sessions
FOR UPDATE USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete their own cash_sessions" ON public.cash_sessions
FOR DELETE USING (user_id = (select auth.uid()));

-- =====================================================
-- PASSO 12: CASH_MOVEMENTS
-- =====================================================

DROP POLICY IF EXISTS "Enable all for authenticated users on cash_movements" ON public.cash_movements;
DROP POLICY IF EXISTS "Users can view their own cash_movements" ON public.cash_movements;
DROP POLICY IF EXISTS "Users can insert their own cash_movements" ON public.cash_movements;
DROP POLICY IF EXISTS "Users can update their own cash_movements" ON public.cash_movements;
DROP POLICY IF EXISTS "Users can delete their own cash_movements" ON public.cash_movements;

CREATE POLICY "Users can view their own cash_movements" ON public.cash_movements
FOR SELECT USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert their own cash_movements" ON public.cash_movements
FOR INSERT WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update their own cash_movements" ON public.cash_movements
FOR UPDATE USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete their own cash_movements" ON public.cash_movements
FOR DELETE USING (user_id = (select auth.uid()));

-- =====================================================
-- PASSO 13: NOTIFICATION_SETTINGS
-- =====================================================

DROP POLICY IF EXISTS "Users can view own settings" ON public.notification_settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON public.notification_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON public.notification_settings;
DROP POLICY IF EXISTS "Users can view their own notification_settings" ON public.notification_settings;
DROP POLICY IF EXISTS "Users can insert their own notification_settings" ON public.notification_settings;
DROP POLICY IF EXISTS "Users can update their own notification_settings" ON public.notification_settings;
DROP POLICY IF EXISTS "Users can delete their own notification_settings" ON public.notification_settings;

CREATE POLICY "Users can view their own notification_settings" ON public.notification_settings
FOR SELECT USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert their own notification_settings" ON public.notification_settings
FOR INSERT WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update their own notification_settings" ON public.notification_settings
FOR UPDATE USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete their own notification_settings" ON public.notification_settings
FOR DELETE USING (user_id = (select auth.uid()));

-- =====================================================
-- PASSO 14: NOTIFICATION_PREFERENCES
-- =====================================================

DROP POLICY IF EXISTS "Users can view own notification_preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Users can insert own notification_preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Users can update own notification_preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Users can delete own notification_preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Users can view their own notification_preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Users can insert their own notification_preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Users can update their own notification_preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Users can delete their own notification_preferences" ON public.notification_preferences;

CREATE POLICY "Users can view their own notification_preferences" ON public.notification_preferences
FOR SELECT USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert their own notification_preferences" ON public.notification_preferences
FOR INSERT WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update their own notification_preferences" ON public.notification_preferences
FOR UPDATE USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete their own notification_preferences" ON public.notification_preferences
FOR DELETE USING (user_id = (select auth.uid()));

-- =====================================================
-- PASSO 15: SALES_PROFESSIONALS
-- =====================================================

DROP POLICY IF EXISTS "Users can view their own sales professionals" ON public.sales_professionals;
DROP POLICY IF EXISTS "Users can insert their own sales professionals" ON public.sales_professionals;
DROP POLICY IF EXISTS "Users can update their own sales professionals" ON public.sales_professionals;
DROP POLICY IF EXISTS "Users can delete their own sales professionals" ON public.sales_professionals;

CREATE POLICY "Users can view their own sales_professionals" ON public.sales_professionals
FOR SELECT USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert their own sales_professionals" ON public.sales_professionals
FOR INSERT WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update their own sales_professionals" ON public.sales_professionals
FOR UPDATE USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete their own sales_professionals" ON public.sales_professionals
FOR DELETE USING (user_id = (select auth.uid()));

-- =====================================================
-- PASSO 16: SALE_ITEMS
-- =====================================================

DROP POLICY IF EXISTS "Users can view own sale_items" ON public.sale_items;
DROP POLICY IF EXISTS "Users can insert own sale_items" ON public.sale_items;
DROP POLICY IF EXISTS "Users can view their own sale_items" ON public.sale_items;
DROP POLICY IF EXISTS "Users can insert their own sale_items" ON public.sale_items;
DROP POLICY IF EXISTS "Users can update their own sale_items" ON public.sale_items;
DROP POLICY IF EXISTS "Users can delete their own sale_items" ON public.sale_items;

CREATE POLICY "Users can view their own sale_items" ON public.sale_items
FOR SELECT USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert their own sale_items" ON public.sale_items
FOR INSERT WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update their own sale_items" ON public.sale_items
FOR UPDATE USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete their own sale_items" ON public.sale_items
FOR DELETE USING (user_id = (select auth.uid()));

-- =====================================================
-- PASSO 17: USER_PROFILES
-- =====================================================

DROP POLICY IF EXISTS "authenticated_select" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;

CREATE POLICY "Users can view their own profile" ON public.user_profiles
FOR SELECT USING (id = (select auth.uid()) OR clinic_id = (select auth.uid()) OR parent_user_id = (select auth.uid()));

CREATE POLICY "Users can update their own profile" ON public.user_profiles
FOR UPDATE USING (id = (select auth.uid())) WITH CHECK (id = (select auth.uid()));

CREATE POLICY "Users can insert their own profile" ON public.user_profiles
FOR INSERT WITH CHECK (id = (select auth.uid()));

-- =====================================================
-- PASSO 18: EVOLUTION_SETTINGS
-- =====================================================

DROP POLICY IF EXISTS "Users can view their own Evolution API settings" ON public.evolution_settings;
DROP POLICY IF EXISTS "Users can insert their own Evolution API settings" ON public.evolution_settings;
DROP POLICY IF EXISTS "Users can update their own Evolution API settings" ON public.evolution_settings;
DROP POLICY IF EXISTS "Users can delete their own Evolution API settings" ON public.evolution_settings;

CREATE POLICY "Users can view their own evolution_settings" ON public.evolution_settings
FOR SELECT USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert their own evolution_settings" ON public.evolution_settings
FOR INSERT WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update their own evolution_settings" ON public.evolution_settings
FOR UPDATE USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete their own evolution_settings" ON public.evolution_settings
FOR DELETE USING (user_id = (select auth.uid()));

-- =====================================================
-- PASSO 19: STOCK
-- =====================================================

DROP POLICY IF EXISTS "Users can view their own stock" ON public.stock;
DROP POLICY IF EXISTS "Users can insert their own stock" ON public.stock;
DROP POLICY IF EXISTS "Users can update their own stock" ON public.stock;
DROP POLICY IF EXISTS "Users can delete their own stock" ON public.stock;

CREATE POLICY "Users can view their own stock" ON public.stock
FOR SELECT USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert their own stock" ON public.stock
FOR INSERT WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update their own stock" ON public.stock
FOR UPDATE USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete their own stock" ON public.stock
FOR DELETE USING (user_id = (select auth.uid()));

-- =====================================================
-- PASSO 20: STOCK_ITEMS
-- =====================================================

DROP POLICY IF EXISTS "Users can view their own stock_items" ON public.stock_items;
DROP POLICY IF EXISTS "Users can insert their own stock_items" ON public.stock_items;
DROP POLICY IF EXISTS "Users can update their own stock_items" ON public.stock_items;
DROP POLICY IF EXISTS "Users can delete their own stock_items" ON public.stock_items;

CREATE POLICY "Users can view their own stock_items" ON public.stock_items
FOR SELECT USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert their own stock_items" ON public.stock_items
FOR INSERT WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update their own stock_items" ON public.stock_items
FOR UPDATE USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete their own stock_items" ON public.stock_items
FOR DELETE USING (user_id = (select auth.uid()));

-- =====================================================
-- PASSO 21: STOCK_MOVEMENTS
-- =====================================================

DROP POLICY IF EXISTS "Users can view their own stock_movements" ON public.stock_movements;
DROP POLICY IF EXISTS "Users can insert their own stock_movements" ON public.stock_movements;
DROP POLICY IF EXISTS "Users can update their own stock_movements" ON public.stock_movements;
DROP POLICY IF EXISTS "Users can delete their own stock_movements" ON public.stock_movements;

CREATE POLICY "Users can view their own stock_movements" ON public.stock_movements
FOR SELECT USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert their own stock_movements" ON public.stock_movements
FOR INSERT WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update their own stock_movements" ON public.stock_movements
FOR UPDATE USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete their own stock_movements" ON public.stock_movements
FOR DELETE USING (user_id = (select auth.uid()));

-- =====================================================
-- PASSO 22: NOTIFICATIONS
-- =====================================================

DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can insert their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;

CREATE POLICY "Users can view their own notifications" ON public.notifications
FOR SELECT USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert their own notifications" ON public.notifications
FOR INSERT WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update their own notifications" ON public.notifications
FOR UPDATE USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete their own notifications" ON public.notifications
FOR DELETE USING (user_id = (select auth.uid()));

-- =====================================================
-- PASSO 23: PATIENT_REMINDER_SETTINGS
-- =====================================================

DROP POLICY IF EXISTS "Users can view their own patient_reminder_settings" ON public.patient_reminder_settings;
DROP POLICY IF EXISTS "Users can insert their own patient_reminder_settings" ON public.patient_reminder_settings;
DROP POLICY IF EXISTS "Users can update their own patient_reminder_settings" ON public.patient_reminder_settings;
DROP POLICY IF EXISTS "Users can delete their own patient_reminder_settings" ON public.patient_reminder_settings;

CREATE POLICY "Users can view their own patient_reminder_settings" ON public.patient_reminder_settings
FOR SELECT USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert their own patient_reminder_settings" ON public.patient_reminder_settings
FOR INSERT WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update their own patient_reminder_settings" ON public.patient_reminder_settings
FOR UPDATE USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete their own patient_reminder_settings" ON public.patient_reminder_settings
FOR DELETE USING (user_id = (select auth.uid()));

-- =====================================================
-- PASSO 24: DISCOUNT_COUPONS (Admin policies)
-- =====================================================

DROP POLICY IF EXISTS "admins_select_all_coupons" ON public.discount_coupons;
DROP POLICY IF EXISTS "admins_insert_coupons" ON public.discount_coupons;
DROP POLICY IF EXISTS "admins_update_coupons" ON public.discount_coupons;
DROP POLICY IF EXISTS "admins_delete_coupons" ON public.discount_coupons;
DROP POLICY IF EXISTS "users_read_active_coupons" ON public.discount_coupons;

CREATE POLICY "admins_select_all_coupons" ON public.discount_coupons
FOR SELECT USING (is_super_admin());

CREATE POLICY "admins_insert_coupons" ON public.discount_coupons
FOR INSERT WITH CHECK (is_super_admin());

CREATE POLICY "admins_update_coupons" ON public.discount_coupons
FOR UPDATE USING (is_super_admin()) WITH CHECK (is_super_admin());

CREATE POLICY "admins_delete_coupons" ON public.discount_coupons
FOR DELETE USING (is_super_admin());

CREATE POLICY "users_read_active_coupons" ON public.discount_coupons
FOR SELECT USING (active = true AND (select auth.uid()) IS NOT NULL);

-- =====================================================
-- PASSO 25: COUPON_USAGE
-- =====================================================

DROP POLICY IF EXISTS "admins_read_coupon_usage" ON public.coupon_usage;
DROP POLICY IF EXISTS "users_insert_own_coupon_usage" ON public.coupon_usage;

CREATE POLICY "admins_read_coupon_usage" ON public.coupon_usage
FOR SELECT USING (is_super_admin());

CREATE POLICY "users_insert_own_coupon_usage" ON public.coupon_usage
FOR INSERT WITH CHECK (user_id = (select auth.uid()));

-- =====================================================
-- PASSO 26: USER_SUBSCRIPTIONS (Admin + own)
-- =====================================================

DROP POLICY IF EXISTS "Users can view their own subscriptions" ON public.user_subscriptions;
DROP POLICY IF EXISTS "admins_manage_subscriptions" ON public.user_subscriptions;

CREATE POLICY "Users can view their own subscriptions" ON public.user_subscriptions
FOR SELECT USING (user_id = (select auth.uid()) OR is_super_admin());

CREATE POLICY "admins_manage_subscriptions" ON public.user_subscriptions
FOR ALL USING (is_super_admin()) WITH CHECK (is_super_admin());

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================

SELECT 'Políticas RLS otimizadas com sucesso!' as resultado;
