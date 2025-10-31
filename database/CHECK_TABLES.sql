-- Verificar se as tabelas necessárias existem
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'notification_preferences',
    'notification_settings',
    'patient_reminder_settings'
  );
