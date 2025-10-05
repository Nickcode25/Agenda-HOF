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

### 👥 Para Clientes (Dentistas)

- **📅 Agenda Inteligente**: Calendário completo com visualização mensal/semanal
- **🦷 Gestão de Pacientes**: Cadastro completo com histórico de procedimentos
- **💉 Procedimentos**: Catálogo de procedimentos com orçamentos e controle
- **👨‍⚕️ Profissionais**: Gerenciamento de dentistas e especialidades
- **📦 Estoque**: Controle de materiais e produtos odontológicos
- **💰 Vendas**: Gestão de vendas de produtos
- **💳 Mensalidades**: Sistema de planos e assinaturas recorrentes
- **📊 Dashboard**: Métricas e KPIs do consultório

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

Execute as migrations do Supabase em ordem:

```bash
# Acesse o SQL Editor do Supabase e execute os arquivos em:
database/migrations/

# Ordem de execução:
1. 000_initial_schema.sql
2. 001_admin_setup.sql
3. 002_courtesy_users.sql
4. 003_courtesy_functions.sql
5. 004_activity_logs.sql
```

📚 Veja mais detalhes em: [database/README.md](database/README.md)

### 5. Inicie o servidor de desenvolvimento

```bash
npm run dev
```

Acesse: `http://localhost:5173`

## 🏗️ Estrutura do Projeto

```
agenda-hof/
├── database/              # Migrations e docs do banco
│   ├── migrations/        # SQL migrations ordenados
│   └── README.md
├── src/
│   ├── components/        # Componentes React
│   │   ├── admin/        # Componentes do admin
│   │   └── ...
│   ├── pages/            # Páginas da aplicação
│   │   ├── admin/        # Páginas do painel admin
│   │   ├── dashboard/    # Dashboard principal
│   │   ├── patients/     # Gestão de pacientes
│   │   ├── procedures/   # Procedimentos
│   │   └── ...
│   ├── store/            # Zustand stores
│   ├── types/            # TypeScript types
│   ├── lib/              # Configurações (Supabase)
│   └── utils/            # Funções utilitárias
├── .env                  # Variáveis de ambiente
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
