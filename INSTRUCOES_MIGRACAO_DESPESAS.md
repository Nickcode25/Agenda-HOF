# Instruções para Aplicar Migração de Despesas e Controle de Caixa

## Passo 1: Acessar o Supabase Dashboard

1. Acesse: https://supabase.com/dashboard
2. Faça login com suas credenciais
3. Selecione o projeto: **zgdxszwjbbxepsvyjtrb**

## Passo 2: Abrir o SQL Editor

1. No menu lateral esquerdo, clique em **SQL Editor**
2. Clique em **New Query** (Nova Consulta)

## Passo 3: Copiar e Executar a Migração

1. Abra o arquivo: `supabase/migrations/20250121_cash_control_and_expenses.sql`
2. Copie TODO o conteúdo do arquivo
3. Cole no SQL Editor do Supabase
4. Clique em **Run** (Executar) no canto inferior direito

## Passo 4: Verificar se Funcionou

Após executar, você deverá ver a mensagem: **"Success. No rows returned"**

Isso significa que as seguintes tabelas foram criadas:

- ✅ `expense_categories` - Categorias de despesas
- ✅ `expenses` - Despesas da clínica
- ✅ `cash_registers` - Caixas disponíveis
- ✅ `cash_sessions` - Sessões de abertura/fechamento
- ✅ `cash_movements` - Movimentações do caixa

## Passo 5: Verificar as Tabelas

1. No menu lateral esquerdo, clique em **Table Editor**
2. Você deverá ver as novas tabelas listadas:
   - expense_categories
   - expenses
   - cash_registers
   - cash_sessions
   - cash_movements

## Possíveis Erros

### Erro: "relation already exists"
**Solução:** As tabelas já foram criadas anteriormente. Tudo está OK!

### Erro: "permission denied"
**Solução:** Verifique se você está logado com a conta correta e se tem permissões de admin no projeto.

### Erro: "syntax error"
**Solução:** Certifique-se de copiar TODO o conteúdo do arquivo SQL, desde o início até o fim.

## Após a Migração

Após executar a migração com sucesso, você poderá:

1. ✅ Acessar a página de Despesas em: http://localhost:5174/app/despesas
2. ✅ Criar categorias de despesas
3. ✅ Registrar despesas (únicas ou recorrentes)
4. ✅ Visualizar relatórios de despesas
5. ✅ Gerenciar controle de caixa (em breve)

## Precisa de Ajuda?

Se encontrar algum erro, me avise e eu te ajudarei a resolver!
