# 🌐 Instalar e Configurar ngrok

O ngrok é necessário para expor seu backend local para a internet, permitindo que o PagBank envie webhooks.

## 📥 Instalação

### Opção 1: Via Terminal (Recomendado)

Execute estes comandos no terminal:

```bash
# Baixar ngrok
cd ~
wget https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz

# Extrair
tar -xvzf ngrok-v3-stable-linux-amd64.tgz

# Mover para /usr/local/bin
sudo mv ngrok /usr/local/bin/

# Verificar instalação
ngrok version
```

### Opção 2: Via Snap

```bash
sudo snap install ngrok
```

---

## 🔑 Autenticar ngrok (Opcional mas Recomendado)

1. **Crie uma conta grátis**: https://dashboard.ngrok.com/signup
2. **Pegue seu authtoken**: https://dashboard.ngrok.com/get-started/your-authtoken
3. **Configure**:
   ```bash
   ngrok config add-authtoken SEU_TOKEN_AQUI
   ```

**Vantagens de autenticar**:
- ✅ Túnel não expira
- ✅ URL permanece a mesma por mais tempo
- ✅ Mais estável

---

## 🚀 Usar ngrok

### 1. Expor porta 3001 (backend)

```bash
ngrok http 3001
```

### 2. Você verá algo assim:

```
ngrok

Session Status                online
Account                       seu-email@gmail.com
Version                       3.x.x
Region                        South America (sa)
Latency                       -
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123.ngrok-free.app -> http://localhost:3001

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```

### 3. Copie a URL de Forwarding

Exemplo: `https://abc123.ngrok-free.app`

---

## 🔔 Configurar Webhook no PagBank

1. **Acesse**: https://pagseguro.uol.com.br/preferencias/integracoes.jhtml
2. **No campo "Definir notificação de transações"**, cole:
   ```
   https://abc123.ngrok-free.app/api/pagbank/webhook
   ```
   (Substitua `abc123.ngrok-free.app` pela sua URL do ngrok)

3. **Clique em Salvar**

---

## 🧪 Testar Webhook

### 1. Deixe o ngrok rodando

Abra um terminal e deixe rodando:
```bash
ngrok http 3001
```

### 2. Verifique se está funcionando

Abra outro terminal e teste:
```bash
curl https://SUA_URL_NGROK.ngrok-free.app/health
```

Deve retornar:
```json
{"status":"OK","environment":"production","timestamp":"2025-10-22T..."}
```

### 3. Ver logs do ngrok

Acesse: http://127.0.0.1:4040

Você verá todas as requisições recebidas em tempo real!

---

## ⚠️ IMPORTANTE

### Problemas Comuns:

**1. "command not found: ngrok"**
- Solução: Reinstale ou verifique se está no PATH

**2. Túnel expira rapidamente (versão grátis)**
- Solução: Autentique com conta ngrok
- Ou use ngrok pago ($8/mês para túnel permanente)

**3. URL muda toda vez que reinicia**
- Normal na versão grátis
- Autentique para URL mais estável
- Ou use domínio customizado (ngrok pago)

### Para Produção (depois):

**NÃO use ngrok em produção!** Use um servidor real:

- ✅ **VPS** (DigitalOcean, AWS, Linode): $5-10/mês
- ✅ **PaaS** (Railway, Render, Heroku): Grátis ou $5-7/mês
- ✅ **Vercel/Netlify**: Grátis (apenas frontend)

---

## 🎯 Próximos Passos

Depois de instalar e rodar o ngrok:

1. ✅ Copie a URL do ngrok
2. ✅ Configure no PagBank
3. ✅ Teste o webhook
4. ✅ Teste cadastro completo no site
5. 🎉 Sistema funcionando!

---

## 📞 Precisa de Ajuda?

Se tiver dificuldade para instalar, me avise!

Posso ajudar com:
- Instalação manual do ngrok
- Alternativas ao ngrok (localtunnel, serveo)
- Deploy em servidor real
