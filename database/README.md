# 📊 Database - Agenda+ HOF

## 🗄️ Estrutura do Banco de Dados

Este projeto utiliza **Supabase (PostgreSQL)** como banco de dados.

## 📁 Migrations

Execute os arquivos SQL **nesta ordem** no Supabase SQL Editor:

### 1️⃣ **000_initial_schema.sql**
Schema inicial do sistema com todas as tabelas principais.

### 2️⃣ **001_admin_setup.sql**
Setup completo do sistema admin (tabelas, views, permissões).

### 3️⃣ **002_courtesy_users.sql**
Tabela e view de usuários cortesia (acesso gratuito).

### 4️⃣ **003_courtesy_functions.sql**
Funções SQL para criar/deletar usuários cortesia.

### 5️⃣ **004_activity_logs.sql**
Sistema de logs de atividades com triggers automáticos.

## 🔧 Setup Rápido

```bash
# 1. Acesse o SQL Editor do Supabase
# 2. Execute cada migration em ordem
# 3. Verifique se tudo funcionou:

SELECT * FROM admin_users;
SELECT * FROM get_recent_activity_logs(10);
```

## 🔐 Variáveis de Ambiente

Configure no arquivo `.env`:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## 📋 Tabelas Principais

- `customers` - Clientes do sistema
- `purchases` - Compras realizadas
- `admin_users` - Usuários administradores
- `courtesy_users` - Usuários com acesso cortesia
- `activity_logs` - Logs de atividades

## 🔍 Views

- `active_courtesy_users` - Usuários cortesia ativos
- `activity_logs_with_customer` - Logs com dados do cliente

## ⚡ Funções

- `create_courtesy_user()` - Criar usuário cortesia
- `delete_courtesy_user()` - Deletar usuário cortesia
- `get_recent_activity_logs()` - Buscar logs recentes
