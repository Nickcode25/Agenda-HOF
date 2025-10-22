# 🚀 Deploy Backend - Railway (5 minutos)

## Passo 1: Criar conta
1. Acesse: https://railway.app/
2. Clique em **"Login with GitHub"**
3. Autorize o Railway

## Passo 2: Criar projeto
1. Clique em **"+ New Project"**
2. Escolha **"Deploy from GitHub repo"**
3. Selecione: **"Agenda-HOF"**
4. Se não aparecer, clique em **"Configure GitHub App"** e autorize

## Passo 3: Configurar pasta backend
1. Clique em **"Settings"** (engrenagem)
2. Em **"Root Directory"**, digite: `backend`
3. Clique em **"Update"**

## Passo 4: Adicionar variáveis
1. Clique em **"Variables"**
2. Adicione estas 5 variáveis:

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

## Passo 5: Gerar domínio
1. Volte em **"Settings"**
2. Em **"Networking"**, clique **"Generate Domain"**
3. **COPIE a URL** gerada (algo como `agendahof-backend.up.railway.app`)

## Passo 6: Aguardar deploy
Aguarde 2-3 minutos até aparecer **"Success"**

## Passo 7: Testar
Abra no navegador:
```
https://SUA_URL_RAILWAY.up.railway.app/health
```

Deve retornar:
```json
{"status":"OK","environment":"production"}
```

---

## ✅ Depois que funcionar:

### 1. Atualizar PagBank
https://pagseguro.uol.com.br/preferencias/integracoes.jhtml

Mude a URL de notificação para:
```
https://SUA_URL_RAILWAY.up.railway.app/api/pagbank/webhook
```

### 2. Atualizar Vercel
https://vercel.com/dashboard

Vá em seu projeto → Settings → Environment Variables

Adicione:
```
Nome: VITE_BACKEND_URL
Valor: https://SUA_URL_RAILWAY.up.railway.app
```

Depois clique em **"Redeploy"**

---

## 🎉 PRONTO!
Seu sistema estará 100% funcional!

**Me avise quando terminar o Passo 5 e me mande a URL que o Railway gerou!**
