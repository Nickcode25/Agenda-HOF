# 🚨 URGENTE: Configurar VITE_BACKEND_URL no Railway

## ❌ Problema Atual

O erro **"Token do PagBank inválido ou expirado"** ocorre porque:

1. O frontend está tentando acessar `http://localhost:3001`
2. Localhost não existe em produção
3. As requisições nunca chegam no backend do Railway

## ✅ Solução (5 minutos)

### **Passo 1: Acessar Railway**

1. Abra: https://railway.app/dashboard
2. Faça login

### **Passo 2: Selecionar o Projeto Frontend**

1. Clique no projeto **Agenda-HOF**
2. **IMPORTANTE:** Selecione o serviço do **FRONTEND** (não o backend)

### **Passo 3: Adicionar Variável**

1. Clique na aba **Variables** (no menu lateral)
2. Clique em **+ New Variable**
3. Preencha:
   - **Variable Name:** `VITE_BACKEND_URL`
   - **Value:** `https://agenda-hof-backend-production.up.railway.app`
4. Clique em **Add**

### **Passo 4: Deploy**

1. Railway vai perguntar se quer fazer deploy
2. Clique em **Deploy Now** (ou aguarde deploy automático)
3. Aguarde 2-3 minutos

### **Passo 5: Testar**

1. Acesse: https://www.agendahof.com
2. Tente fazer um pagamento
3. O erro deve desaparecer! ✨

---

## 🔍 Como Verificar se Funcionou

Abra o console do navegador (F12) e verifique:

**ANTES (Erro):**
```
VITE_BACKEND_URL: undefined
Tentando acessar: http://localhost:3001
❌ Erro: Token inválido
```

**DEPOIS (Funcionando):**
```
VITE_BACKEND_URL: https://agenda-hof-backend-production.up.railway.app
Tentando acessar: https://agenda-hof-backend-production.up.railway.app
✅ Sucesso!
```

---

## 📋 Checklist

- [ ] Acessei Railway: https://railway.app/dashboard
- [ ] Selecionei projeto Agenda-HOF (FRONTEND)
- [ ] Cliquei em Variables
- [ ] Adicionei `VITE_BACKEND_URL=https://agenda-hof-backend-production.up.railway.app`
- [ ] Fiz deploy
- [ ] Aguardei 2-3 minutos
- [ ] Testei o pagamento
- [ ] Funcionou! 🎉

---

## ❓ Dúvidas Comuns

**P: Em qual projeto adiciono a variável?**
R: No projeto do **FRONTEND** (Agenda-HOF), não no backend!

**P: Qual a URL exata do backend?**
R: `https://agenda-hof-backend-production.up.railway.app` (sem barra no final)

**P: Preciso fazer deploy manual?**
R: Não, Railway faz automaticamente ao adicionar variável

**P: Quanto tempo leva?**
R: 2-3 minutos para o deploy completar

**P: Como sei se funcionou?**
R: Tente fazer um pagamento. Se não der erro de token, funcionou!

---

## 🆘 Se Ainda Não Funcionar

1. Verifique se a whitelist do PagBank tem a URL:
   ```
   https://agenda-hof-backend-production.up.railway.app
   ```

2. Aguarde 15-20 minutos após adicionar na whitelist

3. Limpe o cache do navegador (Ctrl+Shift+Delete)

4. Tente novamente

---

## 📞 Suporte

Se após seguir todos os passos ainda não funcionar, verifique:

1. ✅ Variável foi adicionada no projeto **FRONTEND** (não backend)
2. ✅ Nome da variável está correto: `VITE_BACKEND_URL`
3. ✅ URL está correta (sem barra no final)
4. ✅ Deploy completou (aguarde status "Success")
5. ✅ Whitelist do PagBank está configurada (aguarde 20 min)

---

**Tempo total estimado: 5 minutos + 20 minutos (whitelist PagBank)**
