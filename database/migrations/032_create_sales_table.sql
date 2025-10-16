-- Criar tabela de vendas
DO $$
BEGIN
    -- Remover tabela se existir
    DROP TABLE IF EXISTS sales CASCADE;

    -- Criar tabela de vendas
    CREATE TABLE sales (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        professional_id UUID NOT NULL,
        professional_name TEXT NOT NULL,
        patient_id UUID,
        patient_name TEXT,
        items JSONB NOT NULL,
        subtotal DECIMAL(10, 2) NOT NULL,
        discount DECIMAL(10, 2) DEFAULT 0,
        total_amount DECIMAL(10, 2) NOT NULL,
        total_profit DECIMAL(10, 2) NOT NULL,
        payment_method TEXT NOT NULL,
        payment_status TEXT NOT NULL,
        due_date DATE,
        paid_at TIMESTAMPTZ,
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Habilitar RLS
    ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

    -- Políticas RLS
    CREATE POLICY "Users can view their own sales"
        ON sales FOR SELECT
        USING (auth.uid() = user_id);

    CREATE POLICY "Users can insert their own sales"
        ON sales FOR INSERT
        WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Users can update their own sales"
        ON sales FOR UPDATE
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Users can delete their own sales"
        ON sales FOR DELETE
        USING (auth.uid() = user_id);

    -- Conceder permissões
    GRANT ALL ON sales TO authenticated;
    GRANT ALL ON sales TO service_role;

    -- Criar índices para melhor performance
    CREATE INDEX idx_sales_user_id ON sales(user_id);
    CREATE INDEX idx_sales_professional_id ON sales(professional_id);
    CREATE INDEX idx_sales_created_at ON sales(created_at);
    CREATE INDEX idx_sales_payment_status ON sales(payment_status);

END $$;

-- Recarregar schema do PostgREST
NOTIFY pgrst, 'reload schema';
