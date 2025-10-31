-- Verificar detalhes das funções que podem estar causando erro
SELECT
    p.proname as function_name,
    pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN (
    'handle_new_user',
    'create_default_notification_preferences',
    'create_default_notification_settings',
    'create_default_patient_reminder_settings'
  );
