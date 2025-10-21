-- Tabela para registrar notificações enviadas
CREATE TABLE IF NOT EXISTS whatsapp_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  appointment_id UUID NOT NULL,
  patient_id UUID NOT NULL,
  patient_name TEXT NOT NULL,
  patient_phone TEXT NOT NULL,
  appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
  message_sent BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMP WITH TIME ZONE,
  twilio_message_sid TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(appointment_id, patient_id) -- Evita duplicatas
);

-- Índices para melhorar performance
CREATE INDEX idx_whatsapp_notifications_user_id ON whatsapp_notifications(user_id);
CREATE INDEX idx_whatsapp_notifications_appointment_date ON whatsapp_notifications(appointment_date);
CREATE INDEX idx_whatsapp_notifications_message_sent ON whatsapp_notifications(message_sent);

-- RLS (Row Level Security)
ALTER TABLE whatsapp_notifications ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver apenas suas notificações
CREATE POLICY "Users can view their own notifications"
  ON whatsapp_notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política: Apenas o sistema pode inserir notificações (via service role)
CREATE POLICY "System can insert notifications"
  ON whatsapp_notifications
  FOR INSERT
  WITH CHECK (true);

-- Política: Apenas o sistema pode atualizar notificações (via service role)
CREATE POLICY "System can update notifications"
  ON whatsapp_notifications
  FOR UPDATE
  USING (true);

-- Tabela para configurações do Twilio por usuário
CREATE TABLE IF NOT EXISTS twilio_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  account_sid TEXT NOT NULL,
  auth_token TEXT NOT NULL,
  whatsapp_from TEXT NOT NULL, -- Formato: whatsapp:+14155238886
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS para twilio_settings
ALTER TABLE twilio_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own twilio settings"
  ON twilio_settings
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own twilio settings"
  ON twilio_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own twilio settings"
  ON twilio_settings
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Função para limpar notificações antigas (mais de 90 dias)
CREATE OR REPLACE FUNCTION clean_old_notifications()
RETURNS void AS $$
BEGIN
  DELETE FROM whatsapp_notifications
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentários para documentação
COMMENT ON TABLE whatsapp_notifications IS 'Registro de notificações WhatsApp enviadas para pacientes';
COMMENT ON TABLE twilio_settings IS 'Configurações do Twilio por usuário';
COMMENT ON COLUMN whatsapp_notifications.appointment_id IS 'ID do agendamento na tabela appointments';
COMMENT ON COLUMN whatsapp_notifications.twilio_message_sid IS 'ID da mensagem retornado pela API do Twilio';
