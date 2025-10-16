-- Garantir que a tabela existe no schema público
-- e está acessível pela API REST do Supabase

-- Verificar se a tabela existe e recriar se necessário
DO $$
BEGIN
    -- Drop e recria a tabela
    DROP TABLE IF EXISTS sales_professionals CASCADE;

    CREATE TABLE sales_professionals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        cpf TEXT,
        phone TEXT,
        email TEXT,
        birth_date DATE,
        specialty TEXT,
        registration_number TEXT,
        clinic TEXT,
        cep TEXT,
        street TEXT,
        number TEXT,
        complement TEXT,
        neighborhood TEXT,
        city TEXT,
        state TEXT,
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Habilitar RLS
    ALTER TABLE sales_professionals ENABLE ROW LEVEL SECURITY;

    -- Criar políticas
    CREATE POLICY "Users can view their own sales professionals"
        ON sales_professionals
        FOR SELECT
        USING (auth.uid() = user_id);

    CREATE POLICY "Users can insert their own sales professionals"
        ON sales_professionals
        FOR INSERT
        WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Users can update their own sales professionals"
        ON sales_professionals
        FOR UPDATE
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Users can delete their own sales professionals"
        ON sales_professionals
        FOR DELETE
        USING (auth.uid() = user_id);

    -- Criar índices
    CREATE INDEX idx_sales_professionals_user_id ON sales_professionals(user_id);
    CREATE INDEX idx_sales_professionals_created_at ON sales_professionals(created_at DESC);

    -- Garantir que a tabela está no schema public
    -- Isso é importante para que a API REST do Supabase possa acessá-la
    GRANT ALL ON sales_professionals TO authenticated;
    GRANT ALL ON sales_professionals TO service_role;

END $$;

-- Atualizar o schema cache do PostgREST
NOTIFY pgrst, 'reload schema';
