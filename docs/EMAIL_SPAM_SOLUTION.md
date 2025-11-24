# 🚨 Solução para Email ir para Spam

## Problema Atual

Os emails estão indo para a pasta de spam e sendo marcados como perigosos pelo Gmail por causa do domínio `onboarding@resend.dev` (domínio genérico do Resend em modo de teste).

## Solução Temporária Aplicada

✅ Alteramos o remetente para: `Agenda HOF <onboarding@resend.dev>`

Isso faz com que o nome "Agenda HOF" apareça no email, mas **NÃO resolve o problema de spam**.

---

## 🎯 Solução Definitiva: Verificar Domínio Próprio

Você possui o domínio: **agendahof.com** ✅

Agora precisa verificá-lo no Resend para que os emails cheguem na caixa de entrada (não spam) e sem alertas de segurança.

---

## 📋 Passo a Passo Completo

### PASSO 1: Adicionar Domínio no Resend

1. Acesse o painel do Resend: **https://resend.com/domains**
2. Faça login com sua conta (email: `nicolasngc99@gmail.com`)
3. Clique no botão **"Add Domain"**
4. Digite: `agendahof.com` (sem www)
5. Clique em **"Add"**

O Resend vai mostrar 3 registros DNS que você precisa adicionar:

---

### PASSO 2: Copiar os Registros DNS

Após adicionar o domínio, o Resend vai exibir algo assim:

**Registro 1 - DKIM (Autenticação de Email):**
```
Type: TXT
Name: resend._domainkey
Value: p=MIGfMA0GCSqGSIb3DQEBAQUAA4... (valor longo)
```

**Registro 2 - SPF (Anti-Spam):**
```
Type: TXT
Name: @ (ou deixe em branco)
Value: v=spf1 include:amazonses.com ~all
```

**Registro 3 - MX (Feedback de Bounces):**
```
Type: MX
Name: @ (ou deixe em branco)
Value: feedback-smtp.us-east-1.amazonses.com
Priority: 10
```

⚠️ **IMPORTANTE:** Anote esses valores exatamente como aparecem no Resend!

---

### PASSO 3: Adicionar Registros DNS no seu Provedor

Agora você precisa acessar o painel onde registrou o domínio `agendahof.com` e adicionar esses 3 registros DNS.

#### **Se registrou no Registro.br:**

1. Acesse: https://registro.br
2. Faça login
3. Vá em **"Meus Domínios"** → Selecione `agendahof.com`
4. Clique em **"Editar Zona"** ou **"DNS"**
5. Adicione os 3 registros:

   **Registro TXT (DKIM):**
   - Tipo: `TXT`
   - Nome: `resend._domainkey`
   - Valor: Cole o valor do DKIM do Resend

   **Registro TXT (SPF):**
   - Tipo: `TXT`
   - Nome: `@` (ou deixe em branco)
   - Valor: `v=spf1 include:amazonses.com ~all`

   **Registro MX:**
   - Tipo: `MX`
   - Nome: `@` (ou deixe em branco)
   - Prioridade: `10`
   - Valor: `feedback-smtp.us-east-1.amazonses.com`

6. Clique em **"Salvar"**

#### **Se registrou no GoDaddy:**

1. Acesse: https://godaddy.com
2. Faça login
3. Vá em **"My Products"** → **"DNS"**
4. Encontre `agendahof.com` e clique em **"Manage"**
5. Role até **"Records"**
6. Clique em **"Add"** para cada registro:

   **Registro TXT (DKIM):**
   - Type: `TXT`
   - Name: `resend._domainkey`
   - Value: Cole o valor do DKIM do Resend
   - TTL: `1 Hour`

   **Registro TXT (SPF):**
   - Type: `TXT`
   - Name: `@`
   - Value: `v=spf1 include:amazonses.com ~all`
   - TTL: `1 Hour`

   **Registro MX:**
   - Type: `MX`
   - Name: `@`
   - Priority: `10`
   - Value: `feedback-smtp.us-east-1.amazonses.com`
   - TTL: `1 Hour`

7. Clique em **"Save"**

#### **Se registrou na Hostinger:**

1. Acesse: https://hostinger.com.br
2. Faça login
3. Vá em **"Domínios"** → Selecione `agendahof.com`
4. Clique em **"Gerenciar DNS"** ou **"DNS Zone"**
5. Adicione os 3 registros seguindo o mesmo formato acima

#### **Se registrou em outro provedor:**

O processo é similar:
1. Acesse o painel do provedor
2. Encontre a seção de **DNS Management** / **Gerenciar DNS**
3. Adicione os 3 registros DNS fornecidos pelo Resend

---

### PASSO 4: Aguardar Propagação DNS

⏱️ Após adicionar os registros DNS:

- Aguarde de **2 a 48 horas** para propagação
- Geralmente leva de **2 a 4 horas**
- Você pode verificar a propagação em: https://dnschecker.org

---

### PASSO 5: Verificar Domínio no Resend

1. Volte para: https://resend.com/domains
2. Encontre `agendahof.com` na lista
3. Clique em **"Verify"** ou **"Check DNS Records"**
4. Se tudo estiver correto, aparecerá: ✅ **"Domain Verified"**

Se ainda não verificou, aguarde mais tempo e tente novamente.

### PASSO 6: Atualizar Variáveis de Ambiente

Após o domínio ser verificado com sucesso no Resend, você precisa atualizar os arquivos de configuração:

#### 6.1 - Atualizar Backend (.env)

Abra o arquivo `backend/.env` e altere a linha `EMAIL_FROM`:

**ANTES:**
```env
EMAIL_FROM=Agenda HOF <onboarding@resend.dev>
```

**DEPOIS:**
```env
EMAIL_FROM=Agenda HOF <noreply@agendahof.com>
```

#### 6.2 - Atualizar Frontend (.env)

Abra o arquivo `.env` (na raiz do projeto) e altere a linha `VITE_EMAIL_FROM`:

**ANTES:**
```env
VITE_EMAIL_FROM=Agenda HOF <onboarding@resend.dev>
```

**DEPOIS:**
```env
VITE_EMAIL_FROM=Agenda HOF <noreply@agendahof.com>
```

#### 6.3 - Reiniciar Backend

No terminal, pare o servidor (Ctrl+C) e inicie novamente:

```bash
cd backend
node server.js
```

---

### PASSO 7: Testar os Emails

Após configurar tudo, teste o sistema:

1. **Cadastro de novo usuário:**
   - Crie uma nova conta com qualquer email
   - Verifique se o código de verificação chega na **caixa de entrada** (não spam)
   - Verifique se aparece "Agenda HOF" como remetente

2. **Recuperação de senha:**
   - Clique em "Esqueceu a senha?"
   - Digite um email e solicite o link
   - Verifique se o email chega na **caixa de entrada**
   - Clique no botão e verifique se funciona

3. **Assinatura de plano:**
   - Faça uma assinatura de teste
   - Verifique se o email de confirmação chega na **caixa de entrada**

---

## ✅ Checklist Final

Marque cada item conforme for completando:

- [ ] Adicionei o domínio `agendahof.com` no Resend
- [ ] Copiei os 3 registros DNS fornecidos pelo Resend
- [ ] Adicionei os registros DNS no provedor do domínio
- [ ] Aguardei a propagação DNS (2-4 horas)
- [ ] Verifiquei o domínio no Resend com sucesso ✅
- [ ] Atualizei `backend/.env` com `noreply@agendahof.com`
- [ ] Atualizei `.env` (frontend) com `noreply@agendahof.com`
- [ ] Reiniciei o backend
- [ ] Testei email de cadastro (chegou na inbox?)
- [ ] Testei email de recuperação de senha (chegou na inbox?)
- [ ] Testei email de assinatura (chegou na inbox?)

---

## 🔍 Por que isso resolve?

### Problemas com `onboarding@resend.dev`:
- ❌ Domínio genérico usado por milhares de desenvolvedores
- ❌ Pode ser usado para spam/phishing
- ❌ Gmail e outros provedores desconfiam
- ❌ Vai direto para spam
- ❌ Marcado como "perigoso"
- ❌ Botões de link podem ser bloqueados

### Vantagens com domínio próprio verificado:
- ✅ Domínio único e autêntico
- ✅ SPF, DKIM e DMARC configurados automaticamente
- ✅ Alta taxa de entrega (inbox, não spam)
- ✅ Sem alertas de segurança
- ✅ Profissional e confiável
- ✅ Links funcionam normalmente

---

## 📊 Alternativas Gratuitas (Sem Domínio)

Se você não tem domínio próprio, considere estas alternativas:

### Opção 1: Mailgun Sandbox
- 5.000 emails/mês grátis
- Domínio sandbox (mas ainda melhor que Resend test mode)
- https://mailgun.com

### Opção 2: SendGrid Free
- 100 emails/dia grátis
- Melhor reputação de entrega
- https://sendgrid.com

### Opção 3: AWS SES
- Muito barato (US$ 0.10 por 1000 emails)
- Excelente deliverability
- Precisa verificar domínio também
- https://aws.amazon.com/ses

---

## ⚡ Teste Rápido (Enquanto Não Verifica Domínio)

Para testar se o email funciona tecnicamente (ignorando spam):

1. Use o email cadastrado no Resend: `nicolasngc99@gmail.com`
2. Vá em **Spam** e marque o email como **"Não é spam"**
3. O Gmail vai aprender e próximos emails podem ir para inbox
4. Copie o link manualmente se o botão não funcionar

**Mas lembre-se:** Isso só funciona para você. Outros usuários ainda vão receber no spam.

---

## 📝 Resumo

| Situação | Solução |
|----------|---------|
| **Teste (agora)** | Use `nicolasngc99@gmail.com` e marque como "Não é spam" |
| **Temporário** | Altere nome do remetente (já feito) |
| **Definitivo** | Verifique domínio próprio no Resend |
| **Sem domínio** | Use Mailgun ou SendGrid |

---

## 🎉 Status Atual

✅ Nome do remetente alterado para "Agenda HOF"
⏳ Aguardando verificação de domínio para resolver spam definitivamente

