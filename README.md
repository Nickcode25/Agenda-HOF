# HOF Clinic

Sistema web moderno para consultório de Harmonização Orofacial (HOF), com interface dark mode e tema laranja.

## Stack
- React 18, TypeScript, Vite
- Tailwind CSS
- React Router DOM
- Zustand (estado global com persistência)
- date-fns (manipulação de datas)
- Lucide React (ícones)

## Scripts
```bash
# instalar dependências
npm install

# rodar em desenvolvimento
npm run dev

# build de produção
npm run build
npm run preview
```

## Funcionalidades

### ✅ Implementado

#### 📅 Agenda
- **Calendário visual mensal** com navegação entre meses
- Visualização de agendamentos por dia
- Modal com detalhes completos do agendamento
- Cores e status diferenciados (Agendado, Confirmado, Concluído, Cancelado)
- Botão "Hoje" para voltar ao mês atual
- Clique nos agendamentos para ver detalhes/remover

#### 👥 Pacientes
- cadastro completo com foto (upload local base64)
- Lista com busca por nome ou CPF
- Cards modernos com hover effects
- Ficha do paciente com dados clínicos

#### 📋 Agendamentos
- Formulário completo de agendamento
- Seleção de paciente, procedimento, profissional, sala
- Data/hora de início e término
- Campo de observações
- Validação de campos obrigatórios

#### ⏳ Fila de Espera
- Adicionar pacientes aguardando agendamento
- Informações: nome, telefone, procedimento desejado
- Remoção de pacientes da fila

### 🎨 Design
- **Sidebar fixa** com navegação por ícones
- Layout responsivo (desktop, tablet, mobile)
- Tema dark com destaque em laranja
- Gradientes e sombras modernas
- Efeitos de hover e transições suaves
- Cards com bordas arredondadas
- Estados vazios elegantes com ícones

## Estrutura de pastas
```
src/
  components/
    Calendar.tsx           # Calendário mensal visual
    AppointmentModal.tsx   # Modal de detalhes do agendamento
  pages/
    patients/
      PatientForm.tsx      # cadastro de pacientes
      PatientsList.tsx     # Lista com busca
      PatientDetail.tsx    # Ficha do paciente
    schedule/
      AppointmentForm.tsx  # Novo agendamento
      ScheduleCalendar.tsx # Página principal com calendário
      Waitlist.tsx         # Fila de espera
  store/
    patients.ts            # Estado global de pacientes
    schedule.ts            # Estado global de agenda
  types/
    patient.ts             # Tipos TypeScript
    schedule.ts            # Tipos TypeScript
  App.tsx                  # Layout com sidebar
  main.tsx                 # Rotas
```

## Rotas
- `/` - Agenda (calendário visual)
- `/agenda/nova` - Novo agendamento
- `/agenda/fila` - Fila de espera
- `/pacientes` - Lista de pacientes
- `/pacientes/novo` - Cadastrar paciente
- `/pacientes/:id` - Detalhes do paciente

## Como usar

1. **Instalar dependências:**
```bash
cd /home/nicolas/CascadeProjects/hof-clinic
npm install
```

2. **Iniciar servidor:**
```bash
npm run dev
```

3. **Acessar:** http://localhost:5173 (ou porta indicada)

## Próximos módulos planejados
- 💊 Procedimentos (calculadora, controle de sessões)
- 📦 Estoque (materiais, lotes, validade, alertas)
- 💰 Financeiro (entradas/saídas, dashboard, recibos PDF)
- 📱 Comunicação (WhatsApp/SMS/Email automático)
- 🔐 Área do paciente (login, histórico, documentos)
- 📊 Marketing (simulador, NPS)
- 🔗 Integrações (Google Agenda, App Mobile, IA)
