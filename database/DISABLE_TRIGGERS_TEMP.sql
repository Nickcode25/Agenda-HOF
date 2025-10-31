-- TEMPORARIAMENTE desabilitar triggers para testar
-- Execute isto para descobrir qual está causando o erro 500

-- Desabilitar todos os triggers
ALTER TABLE auth.users DISABLE TRIGGER on_auth_user_created;
ALTER TABLE auth.users DISABLE TRIGGER on_auth_user_created_notification_prefs;
ALTER TABLE auth.users DISABLE TRIGGER trigger_create_default_notification_settings;
ALTER TABLE auth.users DISABLE TRIGGER trigger_create_default_patient_reminder_settings;

-- Depois de testar, RE-HABILITE os triggers com:
-- ALTER TABLE auth.users ENABLE TRIGGER on_auth_user_created;
-- ALTER TABLE auth.users ENABLE TRIGGER on_auth_user_created_notification_prefs;
-- ALTER TABLE auth.users ENABLE TRIGGER trigger_create_default_notification_settings;
-- ALTER TABLE auth.users ENABLE TRIGGER trigger_create_default_patient_reminder_settings;
