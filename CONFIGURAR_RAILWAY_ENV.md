# Configurar Variáveis de Ambiente no Railway

## Problema Atual
O erro "Token do PagBank inválido ou expirado" ocorre porque o frontend está tentando acessar `http://localhost:3001` que não funciona em produção.

## Solução

### 1. Configurar Backend URL no Frontend (Railway)

Acesse o projeto do **FRONTEND** no Railway e adicione a variável de ambiente:

```
VITE_BACKEND_URL=https://agenda-hof-backend-production.up.railway.app
```

**Passos:**
1. Acesse: https://railway.app/dashboard
2. Selecione o projeto **Agenda-HOF** (frontend)
3. Clique em **Variables**
4. Clique em **+ New Variable**
5. Adicione:
   - **Name:** `VITE_BACKEND_URL`
   - **Value:** `https://agenda-hof-backend-production.up.railway.app`
6. Clique em **Add**
7. Clique em **Deploy** para aplicar as mudanças

### 2. Verificar Variáveis do Backend

Certifique-se que o **BACKEND** no Railway tem estas variáveis:

```
PAGBANK_TOKEN=71a0c98d-7f03-4432-a41a-e8a2b18cebc5f695497941f0bc5930589cbe6384f14696fd-dc62-4799-a0dd-eb917bace476
PAGBANK_EMAIL=nicolasngc99@gmail.com
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://www.agendahof.com
```

### 3. Whitelist PagBank

O PagBank precisa ter estas URLs na whitelist:

**URLs para adicionar no PagBank:**
- `https://www.agendahof.com`
- `https://agendahof.com`
- `https://agenda-hof-backend-production.up.railway.app`

**Como adicionar no PagBank:**
1. Acesse: https://pagseguro.uol.com.br
2. Vá em **Integrações** > **Configurações**
3. Adicione as URLs acima na whitelist
4. Aguarde 15-20 minutos para propagar

### 4. Testar

Após configurar:
1. Aguarde o deploy do Railway completar (2-3 minutos)
2. Acesse: https://www.agendahof.com
3. Tente fazer um pagamento
4. Verifique se o erro de token desapareceu

## URLs Importantes

- Frontend: https://www.agendahof.com
- Backend: https://agenda-hof-backend-production.up.railway.app
- Railway Dashboard: https://railway.app/dashboard
- PagBank: https://pagseguro.uol.com.br

## Debug

Para verificar se as variáveis estão corretas:

1. Abra o console do navegador (F12)
2. Digite: `console.log(import.meta.env)`
3. Verifique se `VITE_BACKEND_URL` está correto

## Notas

- ⚠️ O `.env` local NÃO é commitado no Git (por segurança)
- ⚠️ Cada mudança de variável no Railway requer um novo deploy
- ⚠️ O PagBank leva 15-20 minutos para atualizar a whitelist
