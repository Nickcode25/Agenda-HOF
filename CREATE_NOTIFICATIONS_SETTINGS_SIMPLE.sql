-- =====================================================
-- CRIAR TABELA DE CONFIGURAÇÕES DE NOTIFICAÇÕES
-- Execute este SQL no Supabase SQL Editor
-- =====================================================

-- 1. Atualizar constraint de tipos de notificação
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

-- 2. Criar tabela de configurações
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

-- 3. Habilitar RLS
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

-- 4. Políticas RLS
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

-- 5. Criar índice
CREATE INDEX IF NOT EXISTS idx_notification_settings_user_id ON notification_settings(user_id);

-- 6. Trigger para atualizar updated_at
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

-- 7. Função para criar configurações ao criar novo usuário
CREATE OR REPLACE FUNCTION create_default_notification_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notification_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Trigger para criar configurações automaticamente
DROP TRIGGER IF EXISTS trigger_create_default_notification_settings ON auth.users;
CREATE TRIGGER trigger_create_default_notification_settings
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_notification_settings();

-- =====================================================
-- IMPORTANTE: Execute este bloco DEPOIS de fazer login no app
-- Ou substitua 'SEU_USER_ID_AQUI' pelo seu user_id real
-- =====================================================

-- Para pegar seu user_id, execute:
-- SELECT auth.uid();

-- Depois execute (substituindo o ID):
-- INSERT INTO notification_settings (user_id)
-- VALUES ('SEU_USER_ID_AQUI')
-- ON CONFLICT (user_id) DO NOTHING;

-- OU execute esta query que cria automaticamente para TODOS os usuários existentes:
INSERT INTO notification_settings (user_id)
SELECT id FROM auth.users
WHERE id NOT IN (SELECT user_id FROM notification_settings)
ON CONFLICT (user_id) DO NOTHING;
