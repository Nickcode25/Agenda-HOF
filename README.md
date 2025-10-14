# 🦷 Agenda+ HOF

> Sistema completo de gestão para consultório odontológico

[![React](https://img.shields.io/badge/React-18.3.1-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5.3-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4.1-purple.svg)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green.svg)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4.1-cyan.svg)](https://tailwindcss.com/)

## 📋 Sobre o Projeto

**Agenda+ HOF** é um sistema SaaS completo para gerenciamento de consultórios odontológicos, com funcionalidades para agendamento, controle de pacientes, procedimentos, estoque, vendas e sistema administrativo.

## ✨ Funcionalidades

### 👥 Para Clientes (Clínicas)

- **📅 Agenda Inteligente**: Calendário completo com visualização mensal/semanal
- **🦷 Gestão de Pacientes**: Cadastro completo com informações clínicas e endereço
- **💉 Procedimentos**: Catálogo de procedimentos estéticos
- **👨‍⚕️ Profissionais**: Gerenciamento de profissionais e especialidades
- **📦 Estoque**: Controle de insumos e produtos
- **💰 Vendas**: Gestão de vendas com comissionamento automático
- **💳 Mensalidades**: Sistema de planos e assinaturas recorrentes
- **📊 Dashboard**: Métricas e KPIs da clínica (apenas owner)
- **👤 Multi-Usuário**: Sistema de contas owner e staff com permissões diferenciadas

### 🔐 Para Administradores (SaaS)

- **📊 Dashboard Admin**: Visão geral do sistema SaaS
- **💹 Métricas SaaS**: MRR, Churn Rate, LTV, Growth Rate
- **👥 Gestão de Clientes**: Controle de clientes que usam o sistema
- **🛒 Gestão de Compras**: Controle de pagamentos e assinaturas
- **📝 Activity Logs**: Registro automático de todas as ações
- **🚨 Alertas Inteligentes**: Notificações sobre situações críticas
- **🎁 Usuários Cortesia**: Criar acessos gratuitos para testes

## 🚀 Tecnologias

- **Frontend**: React 18 + TypeScript + Vite
- **Estilização**: Tailwind CSS + Lucide Icons
- **Estado**: Zustand + Persist
- **Roteamento**: React Router DOM v6
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **Data**: React Hook Form + Date-fns

## 📦 Instalação

### Pré-requisitos

- Node.js 18+
- npm ou yarn
- Conta no Supabase

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/agenda-hof.git
cd agenda-hof
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima
```

### 4. Configure o banco de dados

Execute as migrations SQL no SQL Editor do Supabase (na ordem):

```sql
-- 1. Sistema de roles e multi-usuário
database/migrations/add_user_roles.sql

-- 2. Permissões da tabela user_profiles
database/migrations/grant_permissions.sql

-- 3. (Opcional) Campos de endereço para pacientes
database/migrations/add_address_fields_to_patients.sql
```

**Importante**: Desabilite a confirmação de email no Supabase:
- Authentication → Providers → Email → Desmarque "Confirm email"

### 5. Inicie o servidor de desenvolvimento

```bash
npm run dev
```

Acesse: `http://localhost:5173`

## 🏗️ Estrutura do Projeto

```
agenda-hof/
├── database/
│   └── SCHEMA.sql         # Schema completo do banco de dados
├── src/
│   ├── components/        # Componentes React reutilizáveis
│   │   ├── admin/        # Componentes do painel admin
│   │   └── ...
│   ├── pages/            # Páginas da aplicação
│   │   ├── admin/        # Painel administrativo
│   │   ├── dashboard/    # Dashboard principal
│   │   ├── landing/      # Landing page pública
│   │   ├── patients/     # Gestão de pacientes
│   │   ├── procedures/   # Procedimentos
│   │   ├── professionals/ # Profissionais
│   │   ├── schedule/     # Agenda e agendamentos
│   │   ├── stock/        # Controle de estoque
│   │   └── ...
│   ├── store/            # Zustand stores (gerenciamento de estado)
│   ├── contexts/         # React contexts
│   ├── types/            # TypeScript types e interfaces
│   ├── lib/              # Configurações (Supabase, etc)
│   └── utils/            # Funções utilitárias
├── .env                  # Variáveis de ambiente (não versionado)
└── package.json
```

## 🎯 Scripts Disponíveis

```bash
npm run dev          # Inicia servidor de desenvolvimento
npm run build        # Build para produção
npm run preview      # Preview do build
npm run lint         # Executa ESLint
```

## 🔐 Acesso Admin

Para acessar o painel administrativo:

1. Acesse: `/admin/login`
2. Use as credenciais de admin criadas no banco
3. Gerencie clientes, métricas e alertas

## 🌟 Funcionalidades Destacadas

### Sistema Multi-Usuário
- **Owner (Proprietário)**: Acesso completo + Dashboard + Gerenciamento de funcionários
- **Staff (Funcionário)**: Acesso operacional, sem Dashboard
- Criação fácil de contas via `/app/funcionarios`
- Dados compartilhados por clínica (`clinic_id`)

### Sistema de Activity Logs
Registro automático via triggers SQL de:
- Cadastro de clientes
- Criação de compras
- Mudanças de status

### Métricas SaaS Avançadas
- **MRR**: Monthly Recurring Revenue
- **Churn Rate**: Taxa de cancelamento
- **LTV**: Customer Lifetime Value
- **Growth Rate**: Taxa de crescimento

### Alertas Inteligentes
- Pagamentos atrasados (>7 dias)
- Alto volume de cancelamentos
- Clientes inativos (60 dias)
- Receita abaixo da média

## 📝 Roadmap

- [ ] Sistema de notificações por email
- [ ] Exportação de relatórios (CSV/PDF)
- [ ] Gráficos de tendência
- [ ] Integração com WhatsApp
- [ ] App mobile

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor:

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Add: Nova feature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👨‍💻 Autor

**Nicolas** - Agenda+ HOF Team

---

⭐ Se este projeto foi útil para você, considere dar uma estrela!
