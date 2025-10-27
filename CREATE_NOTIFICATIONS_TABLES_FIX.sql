-- =====================================================
-- CORREÇÃO: Adiciona novas colunas e tipos de notificação
-- =====================================================

-- Adicionar novos tipos de notificação se ainda não existem
DO $$
BEGIN
  -- Atualizar o constraint de tipo para incluir os novos tipos
  ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
  ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
    CHECK (type IN (
      'appointment_reminder',
      'low_stock',
      'stock_out',
      'appointment_confirmed',
      'appointment_cancelled',
      'subscription_due',
      'subscription_overdue',
      'payment_overdue',
      'planned_procedure'
    ));
END $$;

-- Criar tabela de configurações se não existir
CREATE TABLE IF NOT EXISTS notification_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Estoque
  low_stock_enabled BOOLEAN DEFAULT TRUE,
  low_stock_threshold INTEGER DEFAULT 5,

  -- Pagamentos
  payment_overdue_enabled BOOLEAN DEFAULT TRUE,
  payment_overdue_days INTEGER DEFAULT 3,

  -- Procedimentos Planejados
  planned_procedure_enabled BOOLEAN DEFAULT TRUE,
  planned_procedure_days INTEGER DEFAULT 7,

  -- Mensalidades
  monthly_subscription_enabled BOOLEAN DEFAULT TRUE,
  monthly_subscription_days_before INTEGER DEFAULT 5,

  -- WhatsApp/SMS (para implementação futura)
  whatsapp_enabled BOOLEAN DEFAULT FALSE,
  sms_enabled BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

-- Políticas para notification_settings
DROP POLICY IF EXISTS "Users can view own settings" ON notification_settings;
CREATE POLICY "Users can view own settings"
  ON notification_settings FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own settings" ON notification_settings;
CREATE POLICY "Users can insert own settings"
  ON notification_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own settings" ON notification_settings;
CREATE POLICY "Users can update own settings"
  ON notification_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- Criar índice
CREATE INDEX IF NOT EXISTS idx_notification_settings_user_id ON notification_settings(user_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_notification_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_notification_settings_updated_at ON notification_settings;
CREATE TRIGGER trigger_update_notification_settings_updated_at
  BEFORE UPDATE ON notification_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_settings_updated_at();

-- Criar configurações padrão para usuário atual
INSERT INTO notification_settings (user_id)
SELECT auth.uid()
WHERE NOT EXISTS (
  SELECT 1 FROM notification_settings WHERE user_id = auth.uid()
);

-- Comentários
COMMENT ON TABLE notification_settings IS 'Configurações de notificações e lembretes por usuário';
COMMENT ON COLUMN notification_settings.low_stock_threshold IS 'Quantidade mínima para gerar alerta de estoque baixo';
COMMENT ON COLUMN notification_settings.payment_overdue_days IS 'Dias após vencimento para notificar';
COMMENT ON COLUMN notification_settings.planned_procedure_days IS 'Dias sem realizar procedimento para notificar';
