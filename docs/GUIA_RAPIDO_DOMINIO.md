# ⚡ Guia Rápido: Configurar agendahof.com no Resend

## 📌 O que você vai fazer:

Configurar o domínio **agendahof.com** no Resend para que os emails:
- ✅ Cheguem na **caixa de entrada** (não spam)
- ✅ Não tenham alertas de segurança
- ✅ Mostrem "Agenda HOF" como remetente profissional

---

## 🚀 Passo a Passo (5 etapas simples)

### 1️⃣ Adicionar Domínio no Resend

1. Acesse: **https://resend.com/domains**
2. Login: `nicolasngc99@gmail.com`
3. Clique: **"Add Domain"**
4. Digite: `agendahof.com` (sem www)
5. Clique: **"Add"**

✅ O Resend vai mostrar 3 registros DNS

---

### 2️⃣ Copiar os 3 Registros DNS

Na tela do Resend, você verá algo assim:

```
📋 Registro 1 (DKIM):
   Type: TXT
   Name: resend._domainkey
   Value: p=MIGfMA0GCS... (valor longo)

📋 Registro 2 (SPF):
   Type: TXT
   Name: @
   Value: v=spf1 include:amazonses.com ~all

📋 Registro 3 (MX):
   Type: MX
   Name: @
   Priority: 10
   Value: feedback-smtp.us-east-1.amazonses.com
```

⚠️ **Copie esses valores!** Você vai precisar deles no próximo passo.

---

### 3️⃣ Adicionar os Registros no Provedor do Domínio

Acesse o painel onde você registrou `agendahof.com` e encontre a área de **DNS** ou **Gerenciar Zona DNS**.

**Os provedores mais comuns:**

| Provedor | Como Acessar DNS |
|----------|------------------|
| **Registro.br** | Login → Meus Domínios → Editar Zona DNS |
| **GoDaddy** | My Products → DNS → Manage |
| **Hostinger** | Domínios → Gerenciar DNS |
| **Namecheap** | Domain List → Manage → Advanced DNS |

Adicione os 3 registros DNS que você copiou do Resend.

---

### 4️⃣ Aguardar Propagação (2-4 horas)

⏱️ Após adicionar os registros DNS:
- Aguarde de **2 a 4 horas** (pode levar até 48h)
- Verifique propagação em: https://dnschecker.org

---

### 5️⃣ Verificar no Resend

1. Volte para: **https://resend.com/domains**
2. Encontre `agendahof.com`
3. Clique em **"Verify"**
4. Se aparecer ✅ **"Verified"**, está pronto!

---

## 🔧 Após Verificar: Atualizar o Sistema

### Alterar Backend

Edite `backend/.env`:

```env
# ANTES:
EMAIL_FROM=Agenda HOF <onboarding@resend.dev>

# DEPOIS:
EMAIL_FROM=Agenda HOF <noreply@agendahof.com>
```

### Alterar Frontend

Edite `.env` (raiz do projeto):

```env
# ANTES:
VITE_EMAIL_FROM=Agenda HOF <onboarding@resend.dev>

# DEPOIS:
VITE_EMAIL_FROM=Agenda HOF <noreply@agendahof.com>
```

### Reiniciar Backend

```bash
cd backend
node server.js
```

---

## ✅ Pronto!

Agora todos os emails vão:
- ✅ Chegar na **caixa de entrada**
- ✅ Mostrar "Agenda HOF" como remetente
- ✅ Sem alertas de segurança
- ✅ Com todos os botões funcionando

---

## 🆘 Precisa de Ajuda?

**Problema comum:** "Não consigo encontrar onde adicionar DNS"

**Solução:** Me diga onde você registrou o domínio `agendahof.com` (Registro.br, GoDaddy, Hostinger, etc.) que eu te ajudo com instruções específicas!

---

## 📞 Suporte Resend

Se precisar de ajuda técnica do Resend:
- 📧 Email: support@resend.com
- 📖 Docs: https://resend.com/docs/dashboard/domains/introduction
