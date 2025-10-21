# 🚀 Guia de Configuração - Evolution API WhatsApp

## 📋 Índice
1. [Visão Geral](#visão-geral)
2. [Vantagens da Evolution API](#vantagens)
3. [Pré-requisitos](#pré-requisitos)
4. [Instalação Passo a Passo](#instalação)
5. [Configuração no Agenda HOF](#configuração-no-sistema)
6. [Teste de Envio](#teste)
7. [Troubleshooting](#troubleshooting)
8. [Perguntas Frequentes](#faq)

---

## 🎯 Visão Geral {#visão-geral}

A **Evolution API** é uma solução open-source brasileira que permite integrar o WhatsApp ao Agenda HOF para enviar **lembretes automáticos** de consultas.

### Como funciona?
- 📱 Usa **seu próprio número WhatsApp** (+55 31 99723-5435)
- 🕐 Envia lembretes **1 dia antes** da consulta às **07h da manhã** (horário de Brasília)
- 🆓 **100% Gratuito** - sem custos por mensagem
- 🔄 Totalmente automático após configuração

---

## ✅ Vantagens da Evolution API {#vantagens}

| Vantagem | Descrição |
|----------|-----------|
| ✅ **100% Gratuito** | Sem custos por mensagem, sem limite de envios |
| ✅ **Seu Próprio Número** | Mensagens enviadas do seu WhatsApp (+55 31 99723-5435) |
| ✅ **Open Source** | Código aberto, mantido pela comunidade brasileira |
| ✅ **Mais Estável** | Mais confiável que Baileys |
| ✅ **Fácil Gerenciamento** | Interface web para gerenciar conexões |
| ✅ **Mensagens Ilimitadas** | Envie quantas mensagens quiser |

---

## 🛠️ Pré-requisitos {#pré-requisitos}

Antes de começar, você precisa ter instalado:

- **Docker** (versão 20.10 ou superior)
- **Docker Compose** (versão 2.0 ou superior)
- **Celular com WhatsApp** (+55 31 99723-5435)

### Verificar se o Docker está instalado:

```bash
docker --version
docker-compose --version
```

### Instalar Docker (se necessário):

**Ubuntu/Debian:**
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

**Depois, faça logout e login novamente.**

---

## 📦 Instalação Passo a Passo {#instalação}

### Passo 1: Navegar para a pasta do projeto

```bash
cd /home/nicolas/Agenda-HOF/evolution-api
```

### Passo 2: Configurar a API Key

Edite o arquivo `.env`:

```bash
nano .env
```

**Altere a linha:**
```env
EVOLUTION_API_KEY=SUA_API_KEY_AQUI_MUDE_ISSO
```

**Para uma chave forte e única** (exemplo):
```env
EVOLUTION_API_KEY=hof2025_w3bh00k_s3cur3_k3y_xyz789
```

> ⚠️ **IMPORTANTE**: Guarde essa API Key em local seguro! Você precisará dela para configurar no painel do Agenda HOF.

### Passo 3: Iniciar a Evolution API

```bash
chmod +x start.sh
./start.sh
```

Você verá algo como:

```
🚀 Iniciando Evolution API para Agenda HOF...
✅ Evolution API iniciada com sucesso!
📍 Acessos:
   - Evolution API: http://localhost:8080
   - pgAdmin: http://localhost:5050
```

### Passo 4: Verificar se está rodando

```bash
docker ps
```

Você deve ver 4 containers rodando:
- `evolution_api`
- `evolution_postgres`
- `evolution_redis`
- `evolution_pgadmin`

### Passo 5: Acessar o painel da Evolution API

Abra no navegador: **http://localhost:8080**

---

## 🔗 Conectar seu WhatsApp {#conectar-whatsapp}

### Passo 1: Criar uma instância

No painel da Evolution API (**http://localhost:8080**):

1. Clique em **"Create Instance"**
2. Preencha os campos:
   - **Instance Name**: `agendahof`
   - **Webhook**: (deixe em branco por enquanto)
   - **API Key**: Cole a mesma API Key do arquivo `.env`

3. Clique em **"Create"**

### Passo 2: Gerar QR Code

1. Clique na instância **agendahof** que acabou de criar
2. Clique em **"Connect"** ou **"QR Code"**
3. Um QR Code aparecerá na tela

### Passo 3: Escanear com seu WhatsApp

1. Abra o **WhatsApp** no celular (+55 31 99723-5435)
2. Vá em **Configurações** > **Aparelhos conectados**
3. Clique em **"Conectar um aparelho"**
4. Escaneie o **QR Code** da tela

✅ **Pronto!** Seu WhatsApp está conectado.

---

## ⚙️ Configuração no Agenda HOF {#configuração-no-sistema}

### Passo 1: Acessar configurações no painel

1. Acesse: **https://www.agendahof.com/app/configuracoes/whatsapp**
2. Faça login como administrador/proprietário

### Passo 2: Preencher os campos

| Campo | Valor | Descrição |
|-------|-------|-----------|
| **URL da Evolution API** | `http://localhost:8080` | Se rodando localmente |
| **API Key** | `hof2025_w3bh00k_s3cur3_k3y_xyz789` | A mesma do arquivo `.env` |
| **Nome da Instância** | `agendahof` | Nome criado no passo anterior |
| **Envio automático ativo** | ✅ Ativado | Liga/desliga os lembretes |

### Passo 3: Salvar

Clique em **"Salvar Configurações"**

✅ **Configuração completa!**

---

## 🧪 Teste de Envio {#teste}

### Criar um agendamento de teste:

1. Acesse **Agenda** no Agenda HOF
2. Crie um agendamento para **amanhã** às 10h
3. Selecione um paciente com número de WhatsApp válido
4. Salve o agendamento

### Aguardar o envio automático:

O sistema enviará automaticamente às **07h da manhã (horário de Brasília)** a seguinte mensagem:

```
🏥 *Lembrete de Consulta - Agenda HOF*

Olá *[Nome do Paciente]*! 👋

Este é um lembrete do seu agendamento para amanhã:

📅 *Data:* segunda-feira, 20 de janeiro de 2025
⏰ *Horário:* 10:00
💉 *Procedimento:* Botox Full Face
👨‍⚕️ *Profissional:* Dr. João Silva
🚪 *Sala:* 1

⚠️ Por favor, chegue com 10 minutos de antecedência.

Em caso de necessidade de reagendamento, entre em contato o quanto antes.

Aguardamos você! 😊
```

### Teste manual (opcional):

Se quiser testar imediatamente sem esperar, você pode chamar a Edge Function manualmente:

```bash
curl -X POST https://YOUR_SUPABASE_PROJECT.supabase.co/functions/v1/send-whatsapp-reminders-evolution \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY"
```

---

## 🔧 Troubleshooting {#troubleshooting}

### Problema 1: Evolution API não inicia

**Sintoma**: Erro ao rodar `./start.sh`

**Solução**:
```bash
# Parar containers
docker-compose down

# Limpar volumes (CUIDADO: apaga dados)
docker-compose down -v

# Reconstruir
docker-compose up -d --build
```

---

### Problema 2: QR Code não aparece

**Sintoma**: Página da instância não mostra QR Code

**Solução**:
1. Recarregue a página
2. Verifique se a instância foi criada com sucesso
3. Clique em **"Disconnect"** e depois **"Connect"** novamente

---

### Problema 3: WhatsApp desconecta sozinho

**Sintoma**: Conexão cai após algumas horas

**Solução**:
1. Mantenha o celular com internet estável
2. Não use o WhatsApp Web em outros lugares
3. Verifique logs do Docker:
```bash
docker logs evolution_api -f
```

---

### Problema 4: Mensagens não estão sendo enviadas

**Sintoma**: Agendamentos criados mas sem envio

**Possíveis causas**:

**a) Evolution API não está rodando:**
```bash
docker ps
# Deve mostrar evolution_api como "Up"
```

**b) Configurações incorretas no painel:**
- Verifique se API Key está correta
- Verifique se Nome da Instância está correto
- Verifique se toggle "Envio automático ativo" está ligado

**c) Paciente sem telefone:**
- Verifique se o paciente tem telefone cadastrado
- Número deve estar no formato: `(31) 99723-5435` ou `31997235435`

**d) Cron job não está rodando:**
Verifique no Supabase SQL Editor:
```sql
SELECT * FROM cron.job WHERE jobname = 'send-whatsapp-reminders-evolution';
```

---

### Problema 5: Erro de API Key inválida

**Sintoma**: Mensagem "API Key inválida" no painel

**Solução**:
1. Verifique se a API Key no painel é **exatamente igual** à do arquivo `.env`
2. Não deve ter espaços extras
3. Restart a Evolution API após mudar `.env`:
```bash
cd evolution-api
./start.sh
```

---

## ❓ Perguntas Frequentes {#faq}

### 1. A Evolution API precisa ficar rodando sempre?

**Sim.** Para que as mensagens sejam enviadas automaticamente, a Evolution API deve estar rodando 24/7.

**Opções:**
- **Servidor local**: Deixe rodando no computador da clínica
- **VPS na nuvem**: DigitalOcean, Linode, AWS, etc.

---

### 2. Posso usar mais de um número WhatsApp?

Sim! Crie múltiplas instâncias na Evolution API, cada uma com um número diferente.

---

### 3. Qual o limite de mensagens por dia?

**Não há limite** técnico, mas o WhatsApp pode bloquear se enviar muitas mensagens em pouco tempo.

**Recomendações:**
- Máximo 100 mensagens por hora
- Evite envios massivos instantâneos

---

### 4. As mensagens ficam registradas?

Sim! Todas as mensagens enviadas são registradas na tabela `whatsapp_notifications` do banco de dados.

Para ver histórico:
```sql
SELECT * FROM whatsapp_notifications ORDER BY sent_at DESC LIMIT 20;
```

---

### 5. Posso personalizar a mensagem?

Sim! Edite o arquivo:
`/home/nicolas/Agenda-HOF/supabase/functions/send-whatsapp-reminders-evolution/index.ts`

Procure pela variável `message` (linha ~174) e customize.

---

### 6. Como mudar o horário de envio?

Atualmente está configurado para **07h (Brasília)**.

Para mudar, edite o cron job no Supabase SQL Editor:

```sql
-- Alterar para 08h (11h UTC):
SELECT cron.schedule(
  'send-whatsapp-reminders-evolution',
  '0 11 * * *',  -- 11:00 UTC = 08:00 Brasília
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT.supabase.co/functions/v1/send-whatsapp-reminders-evolution',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
  )
  $$
);
```

---

### 7. Posso rodar em servidor remoto em vez de localhost?

**Sim!** Basta:

1. Fazer deploy da Evolution API em um servidor (VPS)
2. Configurar domínio/IP público (ex: `https://whatsapp.agendahof.com`)
3. Atualizar URL no painel: **Configurações > WhatsApp**
4. Usar HTTPS (recomendado para segurança)

---

### 8. O que acontece se o WhatsApp desconectar?

- ❌ As mensagens **não serão enviadas**
- 📝 Serão registradas como **erro** no banco de dados
- 🔔 Reconecte escaneando o QR Code novamente

**Dica**: Configure um alerta para ser notificado se a conexão cair.

---

## 📞 Suporte

Se precisar de ajuda adicional:

1. Verifique os logs do Docker:
```bash
docker logs evolution_api -f
```

2. Consulte a documentação oficial:
- Evolution API: https://doc.evolution-api.com/
- Supabase Edge Functions: https://supabase.com/docs/guides/functions

3. Comunidade Evolution API:
- GitHub: https://github.com/EvolutionAPI/evolution-api
- Discord: https://evolution-api.com/discord

---

## 🎉 Conclusão

Agora você tem um sistema completo de **lembretes automáticos via WhatsApp** configurado!

**Resumo do que foi feito:**
✅ Evolution API rodando com Docker
✅ WhatsApp conectado (+55 31 99723-5435)
✅ Configurações salvas no Agenda HOF
✅ Lembretes automáticos às 07h
✅ 100% gratuito e sem limites

**Próximos passos:**
1. Monitorar os primeiros envios
2. Ajustar mensagem se necessário
3. Considerar deploy em servidor remoto para maior confiabilidade

Boa sorte! 🚀
