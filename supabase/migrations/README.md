# Migrações do Banco de Dados

Este diretório contém os scripts SQL para criar e gerenciar as tabelas do banco de dados.

## ⚠️ ATENÇÃO: Escolha o SQL correto!

### Para produção (COM dados existentes):

**USE ESTE:** `ensure_monthly_subscription_tables.sql`
- ✅ **Seguro para produção**
- ✅ Cria tabelas somente se não existirem
- ✅ **NÃO apaga dados existentes**
- ✅ Pode ser executado múltiplas vezes sem problemas

### Para desenvolvimento (APAGA tudo e recria):

**USE COM CUIDADO:** `create_monthly_subscription_tables_safe.sql`
- ⚠️ **APAGA TODOS OS DADOS**
- ⚠️ Usa `DROP TABLE IF EXISTS CASCADE`
- ⚠️ Recria tudo do zero
- ⚠️ Use apenas em ambiente de desenvolvimento ou quando quiser limpar tudo

### Histórico (não usar):

- `create_monthly_subscription_tables.sql` - Versão antiga, não usar

## Como usar

1. **Produção:** Execute `ensure_monthly_subscription_tables.sql` no SQL Editor do Supabase
2. **Desenvolvimento:** Se precisar limpar tudo, use `create_monthly_subscription_tables_safe.sql`

## Tabelas criadas

- `user_monthly_plans` - Planos de mensalidade criados pelos usuários
- `patient_subscriptions` - Assinaturas de pacientes nos planos
- `subscription_payments` - Pagamentos das mensalidades

## Políticas de segurança (RLS)

Todas as tabelas têm Row Level Security habilitado, permitindo que usuários vejam apenas seus próprios dados.
