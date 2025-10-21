# 📱 Configuração de Notificações WhatsApp - Agenda HOF

Este guia explica como configurar o envio automático de lembretes via WhatsApp para seus pacientes.

## 📋 Pré-requisitos

1. Conta no Twilio (gratuita para testes)
2. Número WhatsApp Business aprovado no Twilio
3. Acesso ao Supabase Dashboard

---

## 🚀 Passo 1: Configurar Conta Twilio

### 1.1 Criar Conta Twilio

1. Acesse: https://www.twilio.com/try-twilio
2. Crie sua conta gratuita
3. Verifique seu email e telefone

### 1.2 Ativar WhatsApp Business

1. No Twilio Console, vá em **Messaging** → **Try it out** → **Send a WhatsApp message**
2. Siga as instruções para conectar seu WhatsApp Sandbox
3. Para produção, você precisa solicitar um número WhatsApp Business oficial (processo de aprovação do Facebook)

### 1.3 Obter Credenciais

No Twilio Console, copie:

- **Account SID**: `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
- **Auth Token**: Clique em "Show" e copie
- **WhatsApp From**: Formato `whatsapp:+14155238886` (número do Twilio)

---

## 🔧 Passo 2: Configurar no Supabase

### 2.1 Aplicar Migration SQL

1. Acesse o Supabase Dashboard
2. Vá em **SQL Editor**
3. Cole o conteúdo do arquivo: `supabase/migrations/20250120_whatsapp_notifications.sql`
4. Execute a migration

### 2.2 Habilitar pg_cron Extension

1. No Supabase Dashboard, vá em **Database** → **Extensions**
2. Procure por `pg_cron`
3. Clique em **Enable**

### 2.3 Criar Cron Job

No SQL Editor, execute:

```sql
SELECT cron.schedule(
  'send-whatsapp-reminders',
  '0 10 * * *', -- 10:00 UTC = 07:00 Brasília
  $$
  SELECT
    net.http_post(
      url := 'https://SEU-PROJECT-ID.supabase.co/functions/v1/send-whatsapp-reminders',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer SEU-ANON-KEY"}'::jsonb,
      body := '{}'::jsonb
    ) AS request_id;
  $$
);
```

**Substitua:**
- `SEU-PROJECT-ID`: ID do seu projeto Supabase
- `SEU-ANON-KEY`: Chave anon do Supabase (em Settings → API)

### 2.4 Deploy da Edge Function

1. Instale o Supabase CLI:
```bash
npm install -g supabase
```

2. Faça login:
```bash
supabase login
```

3. Link com seu projeto:
```bash
supabase link --project-ref SEU-PROJECT-ID
```

4. Deploy da function:
```bash
supabase functions deploy send-whatsapp-reminders
```

---

## ⚙️ Passo 3: Configurar no Sistema

1. Acesse seu painel: https://www.agendahof.com/app
2. No menu lateral, clique em **WhatsApp** (seção Financeiro & Gestão)
3. Preencha os campos:
   - **Account SID**: Cole o SID do Twilio
   - **Auth Token**: Cole o token do Twilio
   - **Número WhatsApp (From)**: Cole no formato `whatsapp:+14155238886`
4. Certifique-se que **"Envio automático ativo"** está marcado
5. Clique em **Salvar Configurações**

---

## 📅 Como Funciona

### Fluxo Automático

1. **Diariamente às 07:00** (horário de Brasília):
   - O Cron Job do Supabase dispara
   - Busca todos os agendamentos para o dia seguinte
   - Para cada agendamento com status "scheduled" ou "confirmed"

2. **Para cada paciente**:
   - Verifica se tem telefone cadastrado
   - Verifica se já foi enviado lembrete para este agendamento
   - Formata a mensagem personalizada
   - Envia via Twilio WhatsApp API
   - Registra o envio no banco de dados

3. **Mensagem enviada** (exemplo):

```
🏥 Lembrete de Consulta - Agenda HOF

Olá Maria Silva! 👋

Este é um lembrete do seu agendamento para amanhã:

📅 Data: quinta-feira, 23 de janeiro de 2025
⏰ Horário: 14:30
💉 Procedimento: Aplicação de Botox
👨‍⚕️ Profissional: Dr. João Santos
🚪 Sala: Sala 2

⚠️ Por favor, chegue com 10 minutos de antecedência.

Em caso de necessidade de reagendamento, entre em contato o quanto antes.

Aguardamos você! 😊
```

---

## 📊 Monitoramento

### Ver Notificações Enviadas

Execute no SQL Editor:

```sql
SELECT
  patient_name,
  patient_phone,
  appointment_date,
  message_sent,
  sent_at,
  error_message
FROM whatsapp_notifications
WHERE user_id = auth.uid()
ORDER BY created_at DESC
LIMIT 50;
```

### Ver Cron Jobs Ativos

```sql
SELECT * FROM cron.job;
```

### Ver Logs da Edge Function

No Supabase Dashboard:
1. Vá em **Edge Functions**
2. Selecione `send-whatsapp-reminders`
3. Clique em **Logs**

---

## 🔍 Troubleshooting

### Mensagens não estão sendo enviadas

1. **Verifique o Cron Job**:
```sql
SELECT * FROM cron.job WHERE jobname = 'send-whatsapp-reminders';
```

2. **Verifique erros**:
```sql
SELECT * FROM whatsapp_notifications
WHERE message_sent = false
ORDER BY created_at DESC;
```

3. **Teste manualmente**:
```bash
curl -X POST 'https://SEU-PROJECT-ID.supabase.co/functions/v1/send-whatsapp-reminders' \
  -H "Authorization: Bearer SEU-ANON-KEY" \
  -H "Content-Type: application/json"
```

### Paciente não recebeu

Verifique:
- ✅ Paciente tem telefone cadastrado
- ✅ Telefone está no formato correto: (11) 98765-4321
- ✅ Agendamento tem status "scheduled" ou "confirmed"
- ✅ Configurações do Twilio estão corretas
- ✅ Saldo do Twilio está positivo

---

## 💰 Custos

### Twilio Pricing

- **WhatsApp**: ~$0.005 por mensagem enviada
- **Exemplo**: 100 mensagens/mês = $0.50 (menos de R$ 3,00)

### Saldo Gratuito

Twilio oferece créditos gratuitos ao criar a conta para testes.

---

## 🔐 Segurança

- ✅ Credenciais armazenadas apenas no banco de dados (criptografadas)
- ✅ Row Level Security (RLS) ativo
- ✅ Apenas o dono da clínica pode configurar
- ✅ Tokens nunca são expostos no frontend

---

## 🆘 Suporte

### Documentação Oficial

- Twilio WhatsApp: https://www.twilio.com/docs/whatsapp
- Supabase Edge Functions: https://supabase.com/docs/guides/functions
- Supabase Cron: https://supabase.com/docs/guides/database/extensions/pg_cron

### Desativar Temporariamente

1. Acesse **WhatsApp** no menu
2. Desmarque **"Envio automático ativo"**
3. Salve

Ou remova o Cron Job:
```sql
SELECT cron.unschedule('send-whatsapp-reminders');
```

---

## ✅ Checklist de Configuração

- [ ] Conta Twilio criada
- [ ] WhatsApp Business ativado no Twilio
- [ ] Migration SQL aplicada no Supabase
- [ ] Extensão pg_cron habilitada
- [ ] Cron Job criado
- [ ] Edge Function deployed
- [ ] Configurações preenchidas no painel
- [ ] Teste enviado com sucesso

---

**Pronto! 🎉** Seus pacientes agora receberão lembretes automáticos via WhatsApp!
