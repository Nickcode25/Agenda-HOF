/**
 * Cron Job: Envio automático de lembretes via WhatsApp
 *
 * Execução: Diariamente às 07:00 (horário de Brasília = 10:00 UTC)
 *
 * Para configurar no Supabase Dashboard:
 * 1. Vá em Database > Extensions
 * 2. Habilite a extensão "pg_cron"
 * 3. Execute o SQL abaixo no SQL Editor:
 *
 * SELECT cron.schedule(
 *   'send-whatsapp-reminders',
 *   '0 10 * * *', -- 10:00 UTC = 07:00 Brasília
 *   $$
 *   SELECT
 *     net.http_post(
 *       url := 'https://[SEU-PROJECT-ID].supabase.co/functions/v1/send-whatsapp-reminders',
 *       headers := '{"Content-Type": "application/json", "Authorization": "Bearer [SEU-ANON-KEY]"}'::jsonb,
 *       body := '{}'::jsonb
 *     ) AS request_id;
 *   $$
 * );
 *
 * Para verificar cron jobs ativos:
 * SELECT * FROM cron.job;
 *
 * Para remover um cron job:
 * SELECT cron.unschedule('send-whatsapp-reminders');
 */

export {}
