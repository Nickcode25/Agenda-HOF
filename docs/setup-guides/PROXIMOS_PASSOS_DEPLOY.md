# ✅ Backend Deploy Concluído!

🎉 **Backend está rodando com sucesso no Railway!**

URL: https://agenda-hof-production.up.railway.app

---

## 📋 Próximos 2 Passos (IMPORTANTE!)

### 1️⃣ Atualizar Webhook no PagBank

Acesse: https://pagseguro.uol.com.br/preferencias/integracoes.jhtml

Mude a **URL de notificação** para:
```
https://agenda-hof-production.up.railway.app/api/pagbank/webhook
```

---

### 2️⃣ Configurar Variável na Vercel

1. Acesse: https://vercel.com/dashboard
2. Clique no seu projeto **Agenda-HOF**
3. Vá em **Settings** → **Environment Variables**
4. Clique em **Add New**
5. Preencha:
   - **Name:** `VITE_BACKEND_URL`
   - **Value:** `https://agenda-hof-production.up.railway.app`
   - **Environments:** ✅ Production, ✅ Preview, ✅ Development
6. Clique em **Save**
7. Volte para a aba **Deployments**
8. Clique nos 3 pontinhos do último deployment
9. Clique em **Redeploy**

---

## 🎉 Depois Disso Seu Sistema Estará 100% Funcional!

✅ Frontend na Vercel: https://agendahof.com
✅ Backend no Railway: https://agenda-hof-production.up.railway.app
✅ Integração com PagBank configurada
✅ Sistema de cupons funcionando
✅ Assinaturas recorrentes ativas

---

## 🧪 Para Testar:

1. Acesse https://agendahof.com
2. Faça um cadastro de teste
3. Aplique um cupom (se tiver criado)
4. Complete o pagamento com cartão de teste
5. Verifique se a assinatura foi criada no banco

---

**Me avise quando terminar os 2 passos acima para testarmos juntos!**
