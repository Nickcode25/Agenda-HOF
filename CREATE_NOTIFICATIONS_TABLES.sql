-- =====================================================
-- SISTEMA DE NOTIFICAÇÕES E LEMBRETES AUTOMÁTICOS
-- =====================================================

-- 1. Tabela de Notificações
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('low_stock', 'payment_overdue', 'planned_procedure', 'appointment_reminder', 'monthly_subscription_due')),
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  action_url TEXT,
  reference_id TEXT, -- ID do item relacionado
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ,

  -- Índices para performance
  CONSTRAINT notifications_check_read CHECK (
    (read = FALSE AND read_at IS NULL) OR
    (read = TRUE AND read_at IS NOT NULL)
  )
);

-- Índices para otimização
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_reference_id ON notifications(reference_id);

-- 2. Tabela de Configurações de Notificações
CREATE TABLE IF NOT EXISTS notification_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Estoque
  low_stock_enabled BOOLEAN DEFAULT TRUE,
  low_stock_threshold INTEGER DEFAULT 5,

  -- Pagamentos
  payment_overdue_enabled BOOLEAN DEFAULT TRUE,
  payment_overdue_days INTEGER DEFAULT 3, -- Notificar após X dias de atraso

  -- Procedimentos Planejados
  planned_procedure_enabled BOOLEAN DEFAULT TRUE,
  planned_procedure_days INTEGER DEFAULT 7, -- Notificar procedimentos planejados há mais de X dias

  -- Mensalidades
  monthly_subscription_enabled BOOLEAN DEFAULT TRUE,
  monthly_subscription_days_before INTEGER DEFAULT 5, -- Notificar X dias antes do vencimento

  -- WhatsApp/SMS (para implementação futura)
  whatsapp_enabled BOOLEAN DEFAULT FALSE,
  sms_enabled BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice
CREATE INDEX IF NOT EXISTS idx_notification_settings_user_id ON notification_settings(user_id);

-- 3. Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_notification_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_notification_settings_updated_at
  BEFORE UPDATE ON notification_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_settings_updated_at();

-- 4. Função para criar configurações padrão ao criar usuário
CREATE OR REPLACE FUNCTION create_default_notification_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notification_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para criar configurações automaticamente
DROP TRIGGER IF EXISTS trigger_create_default_notification_settings ON auth.users;
CREATE TRIGGER trigger_create_default_notification_settings
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_notification_settings();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

-- Políticas para notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own notifications" ON notifications;
CREATE POLICY "Users can insert own notifications"
  ON notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;
CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);

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

-- =====================================================
-- FUNÇÕES AUXILIARES
-- =====================================================

-- Função para marcar notificação como lida
CREATE OR REPLACE FUNCTION mark_notification_as_read(notification_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE notifications
  SET read = TRUE, read_at = NOW()
  WHERE id = notification_id AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para marcar todas como lidas
CREATE OR REPLACE FUNCTION mark_all_notifications_as_read()
RETURNS void AS $$
BEGIN
  UPDATE notifications
  SET read = TRUE, read_at = NOW()
  WHERE user_id = auth.uid() AND read = FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para contar notificações não lidas
CREATE OR REPLACE FUNCTION count_unread_notifications()
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM notifications
  WHERE user_id = auth.uid() AND read = FALSE;
$$ LANGUAGE sql SECURITY DEFINER;

-- =====================================================
-- COMENTÁRIOS
-- =====================================================

COMMENT ON TABLE notifications IS 'Armazena todas as notificações do sistema';
COMMENT ON TABLE notification_settings IS 'Configurações de notificações por usuário';
COMMENT ON COLUMN notifications.type IS 'Tipo de notificação: low_stock, payment_overdue, planned_procedure, etc';
COMMENT ON COLUMN notifications.priority IS 'Prioridade: low, medium, high, urgent';
COMMENT ON COLUMN notifications.reference_id IS 'ID do item relacionado (produto, venda, procedimento)';
