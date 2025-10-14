# Agenda+ HOF - Documentação Completa

Sistema completo de gestão para clínicas de Harmonização Orofacial.

## 📋 Índice

1. [Funcionalidades](#funcionalidades)
2. [Sistema Multi-Usuário](#sistema-multi-usuário)
3. [Configuração Inicial](#configuração-inicial)
4. [Estrutura do Banco de Dados](#estrutura-do-banco-de-dados)
5. [Integração PagBank](#integração-pagbank)

---

## 🎯 Funcionalidades

### Módulos Principais
- ✅ **Dashboard**: Visão geral e métricas (apenas owner)
- ✅ **Agenda**: Gerenciamento de agendamentos
- ✅ **Pacientes**: Cadastro completo com informações clínicas
- ✅ **Profissionais**: Gestão de profissionais da clínica
- ✅ **Procedimentos**: Catálogo de procedimentos estéticos
- ✅ **Estoque**: Controle de insumos e produtos
- ✅ **Vendas**: Gestão de vendas com comissionamento
- ✅ **Mensalidades**: Sistema de planos e assinaturas
- ✅ **Funcionários**: Criação e gerenciamento de contas de staff (apenas owner)

---

## 👥 Sistema Multi-Usuário

### Tipos de Usuário

#### Owner (Proprietário/Administrador)
- Quem compra/assina o sistema
- Acesso completo a todas funcionalidades
- Pode criar contas de funcionários
- Visualiza Dashboard e dados financeiros
- Badge: 👑 Administrador

#### Staff (Funcionário)
- Criado pelo owner
- Acesso a funções operacionais:
  - Agenda, Pacientes, Profissionais
  - Procedimentos, Estoque, Vendas, Mensalidades
- **SEM** acesso a:
  - Dashboard
  - Gerenciamento de Funcionários
- Badge: 👤 Funcionário

### Como Criar Funcionário

1. **Owner acessa**: `/app/funcionarios`
2. **Clica em**: "Novo Funcionário"
3. **Preenche**:
   - Nome Completo
   - Email
   - Senha (mínimo 6 caracteres)
4. **Funcionário pode fazer login** imediatamente na página inicial

### Login do Funcionário
1. Acessa página inicial (`/`)
2. Clica em "Entrar"
3. Insere email e senha criados pelo owner
4. Acessa sistema com restrições de funcionário

### Dados Compartilhados
- Todos os dados da clínica são compartilhados
- Owner e staff veem os mesmos pacientes, agendamentos, etc.
- Identificados pelo `clinic_id`

---

## ⚙️ Configuração Inicial

### 1. Supabase

#### Desabilitar Confirmação de Email
Para que funcionários possam fazer login imediatamente:

1. Acesse [Supabase Dashboard](https://supabase.com/dashboard)
2. **Authentication** → **Providers** → **Email**
3. **Desabilite**: "Confirm email"
4. Salve

#### Executar Migrations

Execute os arquivos SQL na ordem:

```sql
-- 1. Criar sistema de roles
database/migrations/add_user_roles.sql

-- 2. Conceder permissões
database/migrations/grant_permissions.sql

-- 3. (Opcional) Adicionar campos de endereço
database/migrations/add_address_fields_to_patients.sql
```

### 2. Variáveis de Ambiente

Crie `.env` na raiz do projeto:

```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima
VITE_PAGBANK_TOKEN=seu_token_pagbank (opcional)
```

### 3. Instalação

```bash
npm install
npm run dev
```

---

## 🗄️ Estrutura do Banco de Dados

### Tabelas Principais

#### `user_profiles`
Gerenciamento de usuários e roles

```sql
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  role TEXT CHECK (role IN ('owner', 'staff')),
  clinic_id UUID,
  parent_user_id UUID REFERENCES auth.users(id),
  display_name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `patients`
Dados dos pacientes

- Informações pessoais (nome, CPF, telefone)
- Endereço completo
- Informações clínicas
- Foto
- Procedimentos planejados

#### `professionals`
Profissionais da clínica

- Dados pessoais
- Especialidade
- Registro profissional (CRO, etc.)
- Status ativo/inativo

#### `appointments`
Agendamentos

- Paciente, Profissional, Procedimento
- Data e hora
- Status (agendado, confirmado, cancelado, concluído)

#### `procedures`
Catálogo de procedimentos

- Nome, descrição
- Preço, duração
- Status ativo/inativo

#### `stock_items`
Controle de estoque

- Produto/insumo
- Quantidade, unidade
- Preço de custo

#### `subscription_plans`
Planos de mensalidade

- Nome, descrição
- Valor mensal
- Duração em meses

---

## 💳 Integração PagBank

### Configuração

1. Obtenha token no [PagBank](https://pagseguro.uol.com.br/)
2. Adicione ao `.env`: `VITE_PAGBANK_TOKEN=seu_token`
3. Configure em `src/lib/pagbank.ts`

### Fluxo de Pagamento

1. Usuário escolhe plano na landing page
2. Preenche dados no checkout
3. Cria conta no Supabase
4. (Futuro) Processa pagamento via PagBank

---

## 🔒 Segurança

### Row Level Security (RLS)

**Status Atual**: RLS desabilitado na tabela `user_profiles` por questões de permissão.

```sql
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;
```

**Para Produção**: Re-habilitar com políticas corretas (ver `MULTI_USER_SETUP.md`)

### Isolamento de Dados

- Todos os dados são filtrados por `user_id`
- Funcionários veem apenas dados da sua clínica (`clinic_id`)
- Clínicas diferentes não compartilham dados

---

## 🐛 Troubleshooting

### Funcionário não consegue fazer login
1. Verificar se email está confirmado no Supabase
2. Verificar se perfil foi criado: `SELECT * FROM user_profiles WHERE role = 'staff';`
3. Verificar se "Confirm email" está desabilitado

### Dashboard não aparece para owner
1. Verificar role: `SELECT role FROM user_profiles WHERE id = auth.uid();`
2. Deve ser `'owner'`, não `'staff'`

### Erro "permission denied"
1. Verificar se RLS está desabilitado: `ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;`
2. Verificar permissões: `GRANT ALL ON user_profiles TO authenticated;`

---

## 📞 Suporte

Para dúvidas ou problemas, consulte a documentação adicional:
- `MULTI_USER_SETUP.md` - Detalhes do sistema multi-usuário
- `STAFF_CREATION_SETUP.md` - Criação e gestão de funcionários
- `PAGBANK_SETUP.md` - Integração de pagamentos

---

**Versão**: 1.0
**Última atualização**: 2025-10-14
