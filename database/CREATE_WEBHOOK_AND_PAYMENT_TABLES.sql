-- =====================================================
-- CRIAR TABELAS PARA WEBHOOKS E HISTÓRICO DE PAGAMENTOS
-- =====================================================
-- Execute este SQL no Supabase SQL Editor
-- =====================================================

-- 1. Tabela para armazenar todos os webhooks recebidos do Mercado Pago
CREATE TABLE IF NOT EXISTS mercadopago_webhooks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  event_action TEXT,
  resource_id TEXT,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhorar performance
CREATE INDEX idx_webhooks_resource_id ON mercadopago_webhooks(resource_id);
CREATE INDEX idx_webhooks_processed ON mercadopago_webhooks(processed);
CREATE INDEX idx_webhooks_created_at ON mercadopago_webhooks(created_at DESC);

-- 2. Tabela para histórico de pagamentos
CREATE TABLE IF NOT EXISTS payment_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_id TEXT UNIQUE NOT NULL,
  subscription_id TEXT,
  amount NUMERIC(10, 2) NOT NULL,
  status TEXT NOT NULL,
  status_detail TEXT,
  payment_method TEXT,
  payer_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para payment_history
CREATE INDEX idx_payment_history_subscription_id ON payment_history(subscription_id);
CREATE INDEX idx_payment_history_payment_id ON payment_history(payment_id);
CREATE INDEX idx_payment_history_status ON payment_history(status);
CREATE INDEX idx_payment_history_payer_email ON payment_history(payer_email);
CREATE INDEX idx_payment_history_created_at ON payment_history(created_at DESC);

-- 3. Adicionar campos adicionais na tabela user_subscriptions (se não existirem)
ALTER TABLE user_subscriptions
ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE;

-- =====================================================
-- RLS (Row Level Security) POLICIES
-- =====================================================

-- Habilitar RLS
ALTER TABLE mercadopago_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;

-- Políticas para mercadopago_webhooks
-- Apenas o backend (service role) pode inserir/ler webhooks
CREATE POLICY "Backend pode inserir webhooks"
ON mercadopago_webhooks
FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Backend pode ler webhooks"
ON mercadopago_webhooks
FOR SELECT
TO service_role
USING (true);

CREATE POLICY "Backend pode atualizar webhooks"
ON mercadopago_webhooks
FOR UPDATE
TO service_role
USING (true);

-- Políticas para payment_history
-- Backend pode inserir/ler histórico
CREATE POLICY "Backend pode inserir histórico"
ON payment_history
FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Backend pode ler histórico"
ON payment_history
FOR SELECT
TO service_role
USING (true);

-- Usuários podem ver apenas seu próprio histórico de pagamentos
CREATE POLICY "Usuários podem ver próprio histórico"
ON payment_history
FOR SELECT
TO authenticated
USING (
  payer_email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- =====================================================
-- COMENTÁRIOS
-- =====================================================

COMMENT ON TABLE mercadopago_webhooks IS 'Armazena todos os webhooks recebidos do Mercado Pago para auditoria e processamento';
COMMENT ON TABLE payment_history IS 'Histórico completo de todos os pagamentos processados';
COMMENT ON COLUMN user_subscriptions.last_payment_date IS 'Data do último pagamento aprovado';
COMMENT ON COLUMN user_subscriptions.cancelled_at IS 'Data em que a assinatura foi cancelada';

-- =====================================================
-- VERIFICAR SE AS TABELAS FORAM CRIADAS
-- =====================================================

SELECT
  'mercadopago_webhooks' as tabela,
  COUNT(*) as total_registros
FROM mercadopago_webhooks
UNION ALL
SELECT
  'payment_history',
  COUNT(*)
FROM payment_history;
