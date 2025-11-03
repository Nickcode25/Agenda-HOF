# 🚀 Instruções para Push - Correções do Mercado Pago

## ✅ Status Atual

Você tem **3 commits prontos** para serem enviados ao GitHub:

```
89cbab4 - Corrige bug crítico: assinatura ativa com pagamento recusado
caec225 - Corrige bug crítico: cupom de desconto não aplicado no Mercado Pago
713e491 - Corrige erros de segurança no Mercado Pago
```

---

## 📋 Como Fazer o Push

### Opção 1: Via VS Code (Mais Fácil) ⭐

1. **Abra o VS Code** (se já não estiver aberto)
2. **Clique no ícone do Source Control** na barra lateral esquerda (ou pressione `Ctrl+Shift+G`)
3. Você verá a mensagem: **"3 commits ahead"**
4. **Clique no botão "Sync Changes"** (ou ícone de nuvem com seta para cima ↑)
5. O VS Code pedirá suas credenciais do GitHub
6. Pronto! ✅

### Opção 2: Via Terminal

Abra um terminal e execute:

```bash
cd "/home/nicolas/Área de trabalho/Agenda-HOF"
git push origin main
```

Quando pedir credenciais:
- **Username:** Nickcode25
- **Password:** Use seu Personal Access Token (não a senha do GitHub)

#### 🔑 Não tem Token? Crie um:
1. Acesse: https://github.com/settings/tokens
2. Clique em "Generate new token (classic)"
3. Nome: "Agenda HOF Deploy"
4. Marque: `repo` (acesso completo)
5. Clique em "Generate token"
6. **Copie o token** (aparece só uma vez!)
7. Use esse token como senha

---

## ⏱️ Após o Push

1. ✅ GitHub recebe os commits
2. 🚀 Railway detecta automaticamente
3. ⚙️ Faz redeploy do backend (~2-3 minutos)
4. 🎉 Correções em produção!

---

## 🔍 Verificar Deploy

Acesse: https://railway.app/

Ou via terminal:
```bash
railway logs --follow
```

---

## 📝 Próximos Passos Após Push

1. **Aguardar deploy do Railway** (~2-3 min)

2. **Corrigir assinatura da Natália:**
   - Acessar: https://supabase.com/dashboard
   - SQL Editor > Executar o script: `database/FIX_REJECTED_SUBSCRIPTIONS.sql`

3. **Testar nova assinatura:**
   - Usar cartão real
   - Aplicar cupom de teste
   - Verificar se valor correto é cobrado
   - Verificar logs no Railway

---

## 🎯 Resumo das Correções

### Bug #1: Cupom não aplicado
- Mercado Pago sempre cobrava valor integral
- **Corrigido:** Envia valor com desconto

### Bug #2: Assinatura ativa sem pagamento
- Sistema ativava mesmo com pagamento recusado
- **Corrigido:** Valida status antes de ativar

### Bug #3: payment_method_id hardcoded
- Enviava bandeira fixa ('master')
- **Corrigido:** Detecção automática

---

**Data:** 03/11/2025
**Status:** ✅ Commits prontos para push
