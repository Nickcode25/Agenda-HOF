-- Tabela de assinaturas
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  pagbank_subscription_id VARCHAR(255) UNIQUE, -- ID da assinatura no PagBank
  pagbank_order_id VARCHAR(255), -- ID do primeiro pedido
  status VARCHAR(50) NOT NULL DEFAULT 'active', -- active, suspended, cancelled, past_due
  plan_amount DECIMAL(10, 2) NOT NULL,
  billing_cycle VARCHAR(20) DEFAULT 'MONTHLY', -- MONTHLY, YEARLY
  next_billing_date TIMESTAMP WITH TIME ZONE,
  last_payment_date TIMESTAMP WITH TIME ZONE,
  payment_method VARCHAR(50), -- CREDIT_CARD, BOLETO, PIX
  card_last_digits VARCHAR(4),
  card_brand VARCHAR(50),

  -- Cupom aplicado
  coupon_id UUID REFERENCES discount_coupons(id),
  discount_percentage INTEGER DEFAULT 0,

  -- Datas
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  suspended_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de histórico de pagamentos
CREATE TABLE IF NOT EXISTS subscription_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES user_subscriptions(id) ON DELETE CASCADE,
  pagbank_charge_id VARCHAR(255), -- ID da cobrança no PagBank
  amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) NOT NULL, -- paid, pending, failed, refunded
  payment_method VARCHAR(50),
  paid_at TIMESTAMP WITH TIME ZONE,
  due_date TIMESTAMP WITH TIME ZONE,

  -- Detalhes de falha
  failure_reason TEXT,
  retry_count INTEGER DEFAULT 0,

  -- Dados do PagBank (JSON completo da resposta)
  pagbank_response JSONB,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de webhooks recebidos do PagBank
CREATE TABLE IF NOT EXISTS pagbank_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(100) NOT NULL, -- subscription.created, charge.paid, charge.failed, etc
  subscription_id VARCHAR(255),
  charge_id VARCHAR(255),
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX idx_user_subscriptions_pagbank_id ON user_subscriptions(pagbank_subscription_id);
CREATE INDEX idx_subscription_payments_subscription_id ON subscription_payments(subscription_id);
CREATE INDEX idx_subscription_payments_status ON subscription_payments(status);
CREATE INDEX idx_pagbank_webhooks_processed ON pagbank_webhooks(processed);
CREATE INDEX idx_pagbank_webhooks_event_type ON pagbank_webhooks(event_type);

-- RLS (Row Level Security)
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagbank_webhooks ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
-- Usuários podem ver suas próprias assinaturas
CREATE POLICY "Users can view own subscriptions" ON user_subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Admins podem ver tudo
CREATE POLICY "Admins can view all subscriptions" ON user_subscriptions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Usuários podem ver seus próprios pagamentos
CREATE POLICY "Users can view own payments" ON subscription_payments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_subscriptions
      WHERE user_subscriptions.id = subscription_payments.subscription_id
      AND user_subscriptions.user_id = auth.uid()
    )
  );

-- Admins podem ver todos os pagamentos
CREATE POLICY "Admins can view all payments" ON subscription_payments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Apenas sistema pode inserir webhooks (sem RLS para webhooks por segurança)
ALTER TABLE pagbank_webhooks DISABLE ROW LEVEL SECURITY;

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER trigger_update_user_subscriptions_updated_at
  BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_subscriptions_updated_at();

CREATE TRIGGER trigger_update_subscription_payments_updated_at
  BEFORE UPDATE ON subscription_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_subscriptions_updated_at();

-- Função para verificar se assinatura está ativa
CREATE OR REPLACE FUNCTION is_subscription_active(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_subscriptions
    WHERE user_id = user_uuid
    AND status = 'active'
    AND (next_billing_date IS NULL OR next_billing_date >= NOW())
  );
END;
$$ LANGUAGE plpgsql;

-- Comentários
COMMENT ON TABLE user_subscriptions IS 'Assinaturas de usuários no PagBank';
COMMENT ON TABLE subscription_payments IS 'Histórico de pagamentos das assinaturas';
COMMENT ON TABLE pagbank_webhooks IS 'Log de webhooks recebidos do PagBank';
COMMENT ON COLUMN user_subscriptions.status IS 'active: ativa, suspended: suspensa por falta de pagamento, cancelled: cancelada pelo usuário, past_due: pagamento atrasado';
