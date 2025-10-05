# 🚀 Setup do Projeto - Agenda+ HOF

Guia rápido de configuração do projeto.

## 📋 Pré-requisitos

- [Node.js](https://nodejs.org/) 18 ou superior
- [npm](https://www.npmjs.com/) ou [yarn](https://yarnpkg.com/)
- Conta no [Supabase](https://supabase.com/) (gratuita)

## 🔧 Passo a Passo

### 1. Clone o Repositório

```bash
git clone https://github.com/seu-usuario/agenda-hof.git
cd agenda-hof
```

### 2. Instale as Dependências

```bash
npm install
```

### 3. Configure o Supabase

#### 3.1. Crie um Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com/)
2. Clique em "New Project"
3. Preencha os dados e crie o projeto
4. Anote a **URL** e a **anon key** do projeto

#### 3.2. Configure as Variáveis de Ambiente

```bash
# Copie o arquivo de exemplo
cp .env.example .env

# Edite o arquivo .env e adicione suas credenciais
nano .env
```

Preencha com suas credenciais do Supabase:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-aqui
```

#### 3.3. Execute as Migrations do Banco

1. Acesse o **SQL Editor** do Supabase
2. Execute os arquivos SQL **nesta ordem**:

```
database/migrations/000_initial_schema.sql      ← Schema inicial
database/migrations/001_admin_setup.sql         ← Setup admin
database/migrations/002_courtesy_users.sql      ← Usuários cortesia
database/migrations/003_courtesy_functions.sql  ← Funções SQL
database/migrations/004_activity_logs.sql       ← Activity logs
```

**Como executar:**
- Abra cada arquivo
- Copie todo o conteúdo
- Cole no SQL Editor do Supabase
- Clique em "Run" (ou pressione Ctrl+Enter)

#### 3.4. Crie um Usuário Admin

No SQL Editor do Supabase, execute:

```sql
INSERT INTO admin_users (email, full_name, role)
VALUES ('seu-email@exemplo.com', 'Seu Nome', 'super_admin');
```

Anote o email para fazer login no painel admin.

### 4. Inicie o Servidor de Desenvolvimento

```bash
npm run dev
```

Acesse: **http://localhost:5173**

## ✅ Verificar se Está Funcionando

### Testar o Sistema Principal

1. Acesse: `http://localhost:5173`
2. Você deve ver a landing page
3. Navegue para `/app` para acessar o sistema

### Testar o Painel Admin

1. Acesse: `http://localhost:5173/admin/login`
2. Faça login com o email cadastrado no passo 3.4
3. Você deve ver o dashboard admin com métricas

## 🐛 Problemas Comuns

### Erro: "Missing Supabase environment variables"

**Solução:** Verifique se o arquivo `.env` existe e contém as variáveis corretas.

### Erro: "relation does not exist"

**Solução:** Execute as migrations SQL no Supabase na ordem correta.

### Erro 403 no login admin

**Solução:** Verifique se executou a migration `001_admin_setup.sql` que configura as permissões.

## 📚 Próximos Passos

- Leia o [README.md](README.md) completo
- Veja a documentação do banco em [database/README.md](database/README.md)
- Explore o código em `src/`

## 🆘 Precisa de Ajuda?

Abra uma [issue](https://github.com/seu-usuario/agenda-hof/issues) no GitHub.
