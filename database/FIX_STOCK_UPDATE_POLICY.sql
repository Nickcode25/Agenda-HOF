-- Fix: Adicionar policy de UPDATE para tabela stock
-- Execute este SQL no Supabase SQL Editor

-- Verificar se existe policy de UPDATE
DO $$
BEGIN
    -- Remover policy antiga se existir
    DROP POLICY IF EXISTS "Users can update their own stock items" ON stock;

    -- Criar nova policy de UPDATE
    CREATE POLICY "Users can update their own stock items"
        ON stock FOR UPDATE
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);

    RAISE NOTICE 'Policy de UPDATE criada com sucesso!';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Erro ao criar policy: %', SQLERRM;
END $$;
