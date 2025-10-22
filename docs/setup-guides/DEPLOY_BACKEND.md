# 🚀 Deploy do Backend - Guia Rápido

Seu frontend está em: **https://agendahof.com.br** ✅

Agora você precisa colocar o **backend** no ar também!

---

## 🎯 Onde fazer deploy do backend:

### Opção 1: Railway (Recomendado - Grátis) ⭐

**Vantagens**:
- ✅ Grátis (até $5/mês de crédito)
- ✅ Deploy automático via GitHub
- ✅ Muito fácil de usar
- ✅ HTTPS automático

**Como fazer**:

1. **Acesse**: https://railway.app/
2. **Clique em**: "Start a New Project"
3. **Conecte com GitHub**
4. **Selecione o repositório**: `Agenda-HOF`
5. **Configure variáveis de ambiente**:
   ```
   PAGBANK_TOKEN=58fb3202-f17c-4f20-bc08-6c5f198d88acb5bcd4f14b7c92d3acc1a2b202ec8dc661c7-72a1-42bb-829d-cb45399df273
   PAGBANK_EMAIL=nicolasngc99@gmail.com
   PORT=3001
   FRONTEND_URL=https://agendahof.com.br
   NODE_ENV=production
   ```
6. **Deploy!**
7. Railway vai te dar uma URL tipo: `https://seu-app.railway.app`

---

### Opção 2: Render (Também grátis)

**Como fazer**:

1. **Acesse**: https://render.com/
2. **New** → **Web Service**
3. **Conecte GitHub**
4. **Selecione**: `Agenda-HOF`
5. **Configure**:
   - Name: `agendahof-backend`
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`
6. **Variáveis de ambiente**: (mesmas do Railway)
7. **Create Web Service**

---

### Opção 3: Mesmo servidor do frontend

Se seu frontend está em um **VPS** (DigitalOcean, AWS, etc), você pode rodar o backend no mesmo servidor:

1. **SSH no servidor**:
   ```bash
   ssh user@agendahof.com.br
   ```

2. **Clone o repositório** (se ainda não tiver):
   ```bash
   git clone https://github.com/seu-usuario/Agenda-HOF.git
   cd Agenda-HOF/backend
   ```

3. **Instale dependências**:
   ```bash
   npm install
   ```

4. **Configure PM2** (para manter rodando):
   ```bash
   npm install -g pm2
   pm2 start server.js --name agendahof-backend
   pm2 save
   pm2 startup
   ```

5. **Configure Nginx** para proxy reverso:
   ```nginx
   # /etc/nginx/sites-available/agendahof

   location /api/ {
       proxy_pass http://localhost:3001;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host $host;
       proxy_cache_bypass $http_upgrade;
   }
   ```

6. **Reinicie Nginx**:
   ```bash
   sudo systemctl reload nginx
   ```

---

## 🔧 Depois do Deploy:

### 1. Pegue a URL do backend

Exemplo:
- Railway: `https://agendahof-backend.railway.app`
- Render: `https://agendahof-backend.onrender.com`
- VPS: `https://agendahof.com.br` (mesmo domínio)

### 2. Atualize no PagBank

Volte em: https://pagseguro.uol.com.br/preferencias/integracoes.jhtml

**Atualize a URL de notificação para**:
```
https://SUA_URL_DO_BACKEND/api/pagbank/webhook
```

Exemplos:
- `https://agendahof-backend.railway.app/api/pagbank/webhook`
- `https://agendahof.com.br/api/pagbank/webhook` (se estiver no mesmo servidor)

### 3. Atualize o Frontend

Se a URL do backend mudou, atualize o `.env` do frontend:

```env
VITE_BACKEND_URL=https://SUA_URL_DO_BACKEND
```

### 4. Teste

```bash
curl https://SUA_URL_DO_BACKEND/health
```

Deve retornar:
```json
{"status":"OK","environment":"production","timestamp":"..."}
```

---

## 📋 Checklist Final:

- [ ] Backend deployado e rodando
- [ ] URL do backend acessível (teste com /health)
- [ ] Variáveis de ambiente configuradas
- [ ] URL de webhook atualizada no PagBank
- [ ] Frontend atualizado com URL do backend
- [ ] Teste completo de cadastro funcionando

---

## 🎯 Qual opção você vai escolher?

**Me avise onde você quer fazer o deploy que eu te ajudo com os detalhes!**

Opções:
1. 🚂 Railway (mais fácil)
2. 🎨 Render (também fácil)
3. 🖥️ Mesmo servidor do frontend (mais controle)

Qual você prefere?
