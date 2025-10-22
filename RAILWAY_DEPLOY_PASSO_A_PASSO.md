# 🚂 Railway Deploy - Passo a Passo Completo

## ✅ Pré-requisito:
- Seu código precisa estar no **GitHub**
- Se não estiver, vou te ajudar a subir depois

---

## 📋 Passo 1: Criar conta no Railway

1. Acesse: **https://railway.app/**
2. Clique em: **"Start a New Project"**
3. Clique em: **"Login with GitHub"**
4. Autorize o Railway a acessar seu GitHub

---

## 📋 Passo 2: Criar novo projeto

1. Depois de logar, clique em: **"+ New Project"**
2. Selecione: **"Deploy from GitHub repo"**
3. Escolha o repositório: **"Agenda-HOF"** (ou o nome que você deu)
4. Se não aparecer:
   - Clique em **"Configure GitHub App"**
   - Autorize o repositório específico
   - Volte e selecione o repo

---

## 📋 Passo 3: Configurar o deploy

**IMPORTANTE**: O Railway vai tentar fazer deploy da raiz do projeto, mas queremos apenas a pasta `backend`!

### No Railway, vá em:
1. **Settings** (engrenagem no canto)
2. Role até **"Root Directory"**
3. Digite: `backend`
4. Clique em **"Update"**

---

## 📋 Passo 4: Adicionar variáveis de ambiente

1. Clique na aba: **"Variables"**
2. Clique em: **"+ New Variable"**
3. Adicione **UMA POR UMA** estas variáveis:

```
PAGBANK_TOKEN
58fb3202-f17c-4f20-bc08-6c5f198d88acb5bcd4f14b7c92d3acc1a2b202ec8dc661c7-72a1-42bb-829d-cb45399df273

PAGBANK_EMAIL
nicolasngc99@gmail.com

PORT
3001

FRONTEND_URL
https://agendahof.com

NODE_ENV
production
```

**Como adicionar**:
- Nome da variável (ex: `PAGBANK_TOKEN`)
- Valor (ex: `58fb3202...`)
- Clique em **"Add"**
- Repita para todas as 5 variáveis

---

## 📋 Passo 5: Aguardar deploy

O Railway vai:
1. Detectar que é um projeto Node.js
2. Rodar `npm install`
3. Rodar `npm start`
4. Fazer deploy automaticamente

**Aguarde 2-3 minutos** até aparecer:
✅ **"Success"** ou **"Deployed"**

---

## 📋 Passo 6: Gerar domínio público

1. Vá em: **"Settings"**
2. Role até: **"Networking"**
3. Clique em: **"Generate Domain"**
4. Railway vai gerar algo como: `agendahof-backend.up.railway.app`

**COPIE ESSA URL!** Você vai precisar dela!

---

## 📋 Passo 7: Testar se está funcionando

Abra no navegador ou teste com curl:

```
https://SUA_URL_RAILWAY.up.railway.app/health
```

Deve retornar:
```json
{"status":"OK","environment":"production","timestamp":"2025-10-22..."}
```

---

## 📋 Passo 8: Atualizar PagBank

1. Acesse: https://pagseguro.uol.com.br/preferencias/integracoes.jhtml
2. Edite sua aplicação: **"Agenda+ HOF"**
3. Atualize a **URL de notificação** para:
   ```
   https://SUA_URL_RAILWAY.up.railway.app/api/pagbank/webhook
   ```
4. Salve

---

## 📋 Passo 9: Atualizar Frontend (Vercel)

1. Acesse: https://vercel.com/dashboard
2. Clique no seu projeto: **"agendahof"**
3. Vá em: **"Settings"** → **"Environment Variables"**
4. Adicione ou edite:
   ```
   Nome: VITE_BACKEND_URL
   Valor: https://SUA_URL_RAILWAY.up.railway.app
   ```
5. Salve
6. Vá em: **"Deployments"** → **"Redeploy"**

---

## 📋 Passo 10: Testar tudo!

1. Acesse: **https://agendahof.com**
2. Clique em: **"Começar Agora"**
3. Preencha o cadastro
4. Teste o pagamento

---

## 🎉 PRONTO!

Seu sistema está 100% no ar e funcionando!

- ✅ Frontend: https://agendahof.com (Vercel)
- ✅ Backend: https://SUA_URL.up.railway.app (Railway)
- ✅ Banco: Supabase
- ✅ Pagamentos: PagBank

---

## 💰 Custos:

**Railway**: Grátis até $5/mês de uso (~500 horas)
**Vercel**: Grátis para projetos pessoais
**Supabase**: Grátis até 500MB

**Total: R$ 0,00/mês** 🎉

---

## ❓ Problemas Comuns:

### "Build Failed"
- Verifique se `Root Directory = backend`
- Verifique se as variáveis de ambiente foram adicionadas

### "Application Error"
- Veja os logs: Railway → View Logs
- Geralmente é falta de variável de ambiente

### "502 Bad Gateway"
- Backend demorou muito para iniciar
- Aguarde mais 1-2 minutos
- Ou verifique os logs

---

## 📞 Precisa de Ajuda?

Me avise em qual passo você travou que eu te ajudo! 🚀
