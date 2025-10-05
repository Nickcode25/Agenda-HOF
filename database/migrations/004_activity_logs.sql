-- ========================================
-- SISTEMA DE ACTIVITY LOGS
-- ========================================
-- Registra todas as ações importantes dos clientes no sistema

CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  action_description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_activity_logs_customer ON activity_logs(customer_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action_type ON activity_logs(action_type);

-- View para activity logs com informações do cliente
CREATE OR REPLACE VIEW activity_logs_with_customer AS
SELECT
  al.*,
  c.name as customer_name,
  c.email as customer_email
FROM activity_logs al
LEFT JOIN customers c ON al.customer_id = c.id;

-- Função para criar log de atividade
CREATE OR REPLACE FUNCTION create_activity_log(
  p_customer_id UUID,
  p_action_type TEXT,
  p_action_description TEXT,
  p_metadata JSONB DEFAULT '{}',
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO activity_logs (
    customer_id,
    action_type,
    action_description,
    metadata,
    ip_address,
    user_agent
  ) VALUES (
    p_customer_id,
    p_action_type,
    p_action_description,
    p_metadata,
    p_ip_address,
    p_user_agent
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

-- Trigger para logar compras automaticamente
CREATE OR REPLACE FUNCTION log_purchase_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    PERFORM create_activity_log(
      NEW.customer_id,
      'purchase_created',
      format('Nova compra: %s - %s', NEW.product_name, NEW.amount::TEXT),
      jsonb_build_object(
        'purchase_id', NEW.id,
        'product_name', NEW.product_name,
        'amount', NEW.amount,
        'payment_status', NEW.payment_status
      )
    );
  ELSIF (TG_OP = 'UPDATE' AND OLD.payment_status != NEW.payment_status) THEN
    PERFORM create_activity_log(
      NEW.customer_id,
      'purchase_status_changed',
      format('Status de compra alterado: %s -> %s', OLD.payment_status, NEW.payment_status),
      jsonb_build_object(
        'purchase_id', NEW.id,
        'old_status', OLD.payment_status,
        'new_status', NEW.payment_status
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Criar trigger para purchases
DROP TRIGGER IF EXISTS trigger_log_purchase ON purchases;
CREATE TRIGGER trigger_log_purchase
  AFTER INSERT OR UPDATE ON purchases
  FOR EACH ROW
  EXECUTE FUNCTION log_purchase_activity();

-- Trigger para logar criação de clientes
CREATE OR REPLACE FUNCTION log_customer_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    PERFORM create_activity_log(
      NEW.id,
      'customer_registered',
      format('Novo cliente cadastrado: %s', NEW.name),
      jsonb_build_object(
        'customer_id', NEW.id,
        'email', NEW.email
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Criar trigger para customers
DROP TRIGGER IF EXISTS trigger_log_customer ON customers;
CREATE TRIGGER trigger_log_customer
  AFTER INSERT ON customers
  FOR EACH ROW
  EXECUTE FUNCTION log_customer_activity();

-- Permissões
GRANT SELECT ON activity_logs TO authenticated;
GRANT SELECT ON activity_logs_with_customer TO authenticated;
GRANT EXECUTE ON FUNCTION create_activity_log TO authenticated;

-- Função para buscar logs recentes
CREATE OR REPLACE FUNCTION get_recent_activity_logs(p_limit INT DEFAULT 50)
RETURNS TABLE (
  id UUID,
  customer_id UUID,
  customer_name TEXT,
  customer_email TEXT,
  action_type TEXT,
  action_description TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    al.id,
    al.customer_id,
    al.customer_name,
    al.customer_email,
    al.action_type,
    al.action_description,
    al.metadata,
    al.created_at
  FROM activity_logs_with_customer al
  ORDER BY al.created_at DESC
  LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION get_recent_activity_logs TO authenticated;

-- ========================================
-- EXEMPLOS DE USO
-- ========================================

-- Criar um log manualmente
-- SELECT create_activity_log(
--   'uuid-do-cliente',
--   'login',
--   'Cliente fez login no sistema',
--   '{"ip": "192.168.1.1"}'::jsonb
-- );

-- Buscar logs recentes
-- SELECT * FROM get_recent_activity_logs(100);

-- Buscar logs de um cliente específico
-- SELECT * FROM activity_logs_with_customer
-- WHERE customer_id = 'uuid-do-cliente'
-- ORDER BY created_at DESC;
