-- Corrigir categorias de despesas
-- Remove as categorias antigas e insere as novas em ordem alfabética

-- IMPORTANTE: Este script usa uma variável para o user_id
-- Ele vai buscar automaticamente o último usuário criado

DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Buscar o ID do último usuário criado (ou você pode especificar um email)
  SELECT id INTO v_user_id
  FROM auth.users
  ORDER BY created_at DESC
  LIMIT 1;

  -- Mostrar qual usuário será afetado
  RAISE NOTICE 'User ID: %', v_user_id;

  -- Deletar categorias existentes
  DELETE FROM expense_categories WHERE user_id = v_user_id;
  RAISE NOTICE 'Categorias antigas deletadas';

  -- Inserir novas categorias em ordem alfabética (13 categorias)
  INSERT INTO expense_categories (user_id, name, description, color, icon, is_active)
  VALUES
    -- Água/Luz/Internet
    (v_user_id, 'Água/Luz/Internet', 'Contas de consumo', '#3B82F6', 'Zap', true),

    -- Aluguel
    (v_user_id, 'Aluguel', 'Aluguel do imóvel', '#EF4444', 'Home', true),

    -- Descarte de Resíduos
    (v_user_id, 'Descarte de Resíduos', 'Coleta de lixo hospitalar', '#DC2626', 'Trash2', true),

    -- Descartáveis e EPIs
    (v_user_id, 'Descartáveis e EPIs', 'Luvas, máscaras, toucas, jalecos', '#059669', 'Shield', true),

    -- Equipamentos e Aparelhos
    (v_user_id, 'Equipamentos e Aparelhos', 'Compra e aluguel', '#7C3AED', 'Monitor', true),

    -- Fornecedores
    (v_user_id, 'Fornecedores', 'Compra de produtos e insumos', '#10B981', 'ShoppingCart', true),

    -- Impostos
    (v_user_id, 'Impostos', 'Tributos e impostos', '#6B7280', 'FileText', true),

    -- Manutenção
    (v_user_id, 'Manutenção', 'Reparos e manutenções', '#8B5CF6', 'Wrench', true),

    -- Marketing
    (v_user_id, 'Marketing', 'Publicidade e marketing', '#EC4899', 'Megaphone', true),

    -- Materiais de Procedimento
    (v_user_id, 'Materiais de Procedimento', 'Seringas, agulhas, cânulas, anestésicos, fios, gazes', '#0891B2', 'Syringe', true),

    -- Mercado
    (v_user_id, 'Mercado', 'Alimentos e produtos de limpeza', '#16A34A', 'ShoppingBag', true),

    -- Outros
    (v_user_id, 'Outros', 'Outras despesas', '#94A3B8', 'MoreHorizontal', true),

    -- Salários
    (v_user_id, 'Salários', 'Folha de pagamento', '#F59E0B', 'Users', true);

  RAISE NOTICE 'Novas categorias inseridas com sucesso!';
END $$;

-- Verificar as categorias inseridas
SELECT id, name, description, color, icon, created_at
FROM expense_categories
ORDER BY name;
