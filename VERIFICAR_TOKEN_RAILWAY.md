# 🚨 VERIFICAR E ATUALIZAR TOKEN NO RAILWAY - BACKEND

## ⚠️ PROBLEMA IDENTIFICADO

O erro **403 Forbidden** do PagBank indica que:

1. ✅ Frontend está acessando o backend correto
2. ✅ VITE_BACKEND_URL está funcionando
3. ❌ Token do PagBank no Railway (backend) está **desatualizado ou inválido**
4. ❌ OU a whitelist do PagBank não está configurada

---

## 📋 PASSO A PASSO - ATUALIZAR TOKEN

### **1. Acessar Railway Backend**

1. Acesse: https://railway.app/dashboard
2. Localize o projeto **Backend** (não o frontend!)
   - Nome deve ser algo como: `backend`, `agenda-hof-backend`, ou similar
   - **NÃO** é o projeto `Agenda-HOF` (esse é o frontend)

### **2. Verificar Token Atual**

1. Clique no projeto **Backend**
2. Clique em **Variables** (menu lateral)
3. Procure por `PAGBANK_TOKEN`
4. Verifique os primeiros caracteres do token

**Token CORRETO deve começar com:**
```
71a0c98d-7f03-4432-a41a...
```

**Se começar com outro valor, está ERRADO!**

### **3. Atualizar Token (se necessário)**

1. Clique no ícone de **editar** ao lado de `PAGBANK_TOKEN`
2. Cole o token completo:
   ```
   71a0c98d-7f03-4432-a41a-e8a2b18cebc5f695497941f0bc5930589cbe6384f14696fd-dc62-4799-a0dd-eb917bace476
   ```
3. Clique em **Save**
4. Railway vai fazer deploy automaticamente
5. Aguarde 2-3 minutos

### **4. Adicionar Variável se Não Existir**

Se `PAGBANK_TOKEN` não existir:

1. Clique em **+ New Variable**
2. **Variable Name:** `PAGBANK_TOKEN`
3. **Value:**
   ```
   71a0c98d-7f03-4432-a41a-e8a2b18cebc5f695497941f0bc5930589cbe6384f14696fd-dc62-4799-a0dd-eb917bace476
   ```
4. Clique em **Add**
5. Aguarde deploy (2-3 min)

---

## 🔐 VERIFICAR WHITELIST PAGBANK

### **URL que DEVE estar na whitelist:**

```
https://agenda-hof-backend-production.up.railway.app
```

### **Como verificar:**

1. Acesse: https://pagseguro.uol.com.br
2. Faça login
3. Vá em **Integrações** > **Configurações** (ou similar)
4. Procure por "URL de Notificação" ou "Whitelist" ou "URLs Autorizadas"
5. Verifique se a URL do Railway está lá

### **Se NÃO estiver:**

1. Adicione a URL: `https://agenda-hof-backend-production.up.railway.app`
2. Salve
3. **⏰ AGUARDE 15-20 MINUTOS** para propagar

---

## ✅ CHECKLIST

- [ ] Acessei Railway Dashboard
- [ ] Selecionei projeto **BACKEND** (não frontend)
- [ ] Verifiquei variável `PAGBANK_TOKEN`
- [ ] Token começa com `71a0c98d-7f03-4432-a41a...`
- [ ] Se diferente, atualizei o token
- [ ] Aguardei deploy completar (2-3 min)
- [ ] Verifiquei whitelist do PagBank
- [ ] URL do Railway está na whitelist
- [ ] Se adicionei whitelist, aguardei 15-20 min
- [ ] Testei pagamento novamente

---

## 🔍 COMO SABER QUAL É O PROJETO BACKEND?

**Características do projeto BACKEND:**

- Nome geralmente contém: `backend`, `api`, `server`
- Tem variáveis: `PAGBANK_TOKEN`, `PAGBANK_EMAIL`, `PORT`
- **NÃO** tem variáveis começando com `VITE_`

**Características do projeto FRONTEND:**

- Nome geralmente: `Agenda-HOF`, `frontend`, `web`
- Tem variáveis começando com `VITE_` (como `VITE_BACKEND_URL`, `VITE_SUPABASE_URL`)
- **NÃO** tem `PAGBANK_TOKEN` sem VITE_

---

## 🆘 SE AINDA NÃO FUNCIONAR

### **Verificar logs do Backend Railway:**

1. No projeto Backend, clique em **Deployments**
2. Clique no último deployment
3. Clique em **View Logs**
4. Procure por erros do PagBank
5. Verifique se mostra:
   ```
   ❌ Erro do PagBank: ACCESS_DENIED - whitelist access required
   ```

### **Possíveis problemas:**

1. **Token expirado**: Gere um novo token no PagBank
2. **Whitelist não configurada**: Adicione URL e aguarde 20 min
3. **Token de Sandbox em produção**: Certifique-se que está usando token de PRODUÇÃO
4. **URL errada na whitelist**: Verifique se a URL está exatamente como:
   ```
   https://agenda-hof-backend-production.up.railway.app
   ```

---

## ⏰ TEMPO ESTIMADO

- Atualizar token: **5 minutos**
- Deploy Railway: **2-3 minutos**
- Propagação whitelist: **15-20 minutos**
- **Total: ~25 minutos**

---

## 📞 PRÓXIMOS PASSOS

Após seguir todos os passos:

1. Aguarde o tempo necessário
2. Limpe cache do navegador (Ctrl+Shift+Delete)
3. Acesse: https://www.agendahof.com
4. Tente fazer pagamento
5. Se funcionar: **🎉 SUCESSO!**
6. Se não funcionar: Verifique os logs do backend no Railway

---

**IMPORTANTE:** Sem o token correto no backend do Railway E a whitelist configurada, os pagamentos NUNCA vão funcionar em produção!
