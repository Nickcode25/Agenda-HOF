# 💳 Configuração do PagBank - Agenda+ HOF

## 📋 Visão Geral

O sistema Agenda+ HOF utiliza o **PagBank (antigo PagSeguro)** para processar assinaturas recorrentes de R$ 109,90/mês.

**Métodos de pagamento disponíveis:**
- 💳 Cartão de Crédito
- ⚡ PIX
- 📄 Boleto Bancário

---

## 🚀 Passo a Passo: Configuração

### **1️⃣ Criar/Acessar Conta no PagBank**

1. Acesse: https://pagseguro.uol.com.br
2. Clique em **"Criar conta"** ou faça login
3. Complete o cadastro:
   - Dados pessoais
   - Dados da empresa (se aplicável)
   - Documentos (CPF/CNPJ)
4. Confirme seu email

---

### **2️⃣ Ativar Ambiente Sandbox (Testes)**

1. Acesse: https://dev.pagseguro.uol.com.br/
2. Faça login com sua conta PagBank
3. Vá em **"Ambientes"** > **"Sandbox"**
4. Ative o ambiente de testes

---

### **3️⃣ Gerar Token de API**

⚠️ **IMPORTANTE:** Use o token de **SANDBOX** para desenvolvimento!

1. Acesse: https://pagseguro.uol.com.br/preferencias/integracoes.jhtml
2. Vá em **"Integrações"** > **"Tokens de Segurança"**
3. Clique em **"Gerar novo token"**
4. Escolha **"Sandbox"** para testes
5. Copie o token gerado (formato: `XXXXXXXXXXXXXXXX`)

---

### **4️⃣ Configurar no Projeto**

Edite o arquivo `.env` na raiz do projeto:

\`\`\`env
# PagBank - Credenciais de SANDBOX
VITE_PAGBANK_TOKEN=seu_token_sandbox_aqui
VITE_PAGBANK_EMAIL=seu_email@pagseguro.com
\`\`\`

**Exemplo:**
\`\`\`env
VITE_PAGBANK_TOKEN=1234567890ABCDEF1234567890ABCDEF
VITE_PAGBANK_EMAIL=vendedor@teste.com.br
\`\`\`

---

### **5️⃣ Reiniciar o Servidor**

\`\`\`bash
# Parar o servidor (Ctrl+C no terminal)
# Iniciar novamente
npm run dev
\`\`\`

---

## 🧪 Testar Pagamentos

### **Cartões de Teste do PagBank**

Use estes cartões para testar pagamentos em modo SANDBOX:

| Cartão | Número | CVV | Validade | CPF | Resultado |
|--------|--------|-----|----------|-----|-----------|
| Visa | `4111 1111 1111 1111` | 123 | 12/30 | 22222222222 | ✅ Aprovado |
| Mastercard | `5555 5555 5555 5557` | 123 | 12/30 | 22222222222 | ✅ Aprovado |
| Amex | `3782 822463 10005` | 1234 | 12/30 | 22222222222 | ✅ Aprovado |
| Recusado | `4111 1111 1111 1112` | 123 | 12/30 | 22222222222 | ❌ Recusado |

**CPF de Teste:** 22222222222
**Nome:** JOÃO DA SILVA

### **Testar PIX (Sandbox)**
1. Escolha "PIX" como método de pagamento
2. Sistema gera QR Code de teste
3. No ambiente sandbox, pagamento é aprovado automaticamente
4. Acesso liberado imediatamente

### **Testar Boleto (Sandbox)**
1. Escolha "Boleto" como método de pagamento
2. Sistema gera boleto de teste
3. No sandbox, pode simular pagamento no painel PagBank
4. Acesso liberado após "confirmação"

---

## 📊 Fluxo de Pagamento Implementado

1. **Usuário preenche cadastro** na landing page
2. **Redireciona para `/checkout`** com dados do usuário
3. **Escolhe método de pagamento:**
   - **Cartão:** Preenche dados e confirma
   - **PIX:** Gera QR Code
   - **Boleto:** Gera boleto para download
4. **Sistema processa:**
   - Cria conta no Supabase
   - Envia dados para PagBank (via backend)
   - Recebe confirmação
5. **Após pagamento aprovado:**
   - Ativa assinatura no banco de dados
   - Redireciona para `/app/dashboard`
   - Usuário acessa sistema completo

---

## 🔄 Assinaturas Recorrentes

### **Configurar Cobrança Automática Mensal**

Para implementar cobrança recorrente real via API do PagBank:

1. **Criar plano de assinatura** via API:
\`\`\`javascript
POST https://sandbox.api.pagseguro.com/pre-approvals/request

{
  "reference": "PLANO_PROFISSIONAL_HOF",
  "preApproval": {
    "name": "Agenda+ HOF - Plano Profissional",
    "charge": "AUTO",
    "period": "MONTHLY",
    "amount": {
      "value": "109.90",
      "currency": "BRL"
    }
  },
  "sender": {
    "name": "Nome do Cliente",
    "email": "cliente@email.com",
    "phone": {
      "areaCode": "11",
      "number": "999999999"
    }
  }
}
\`\`\`

2. **Webhook para notificações:**
   - Configurar URL: `https://seu-dominio.com/api/webhook/pagbank`
   - Receber notificações de: cobrança, cancelamento, vencimento

---

## 🔐 Modo Produção

### **Quando estiver pronto para produção:**

1. **Complete a ativação da conta:**
   - Envie documentação completa
   - Aguarde aprovação (1-3 dias úteis)
   - Ative recebimentos

2. **Obtenha token de PRODUÇÃO:**
   - Vá em **"Integrações"** > **"Tokens de Segurança"**
   - Gere um novo token em **"Produção"**
   - Copie o token

3. **Atualize o `.env`:**
\`\`\`env
# PagBank - PRODUÇÃO
VITE_PAGBANK_TOKEN=seu_token_de_producao_aqui
VITE_PAGBANK_EMAIL=seu_email_real@email.com
\`\`\`

4. **Configure webhook de produção:**
   - URL: `https://seu-dominio.com/api/webhook/pagbank`
   - Selecione eventos: TRANSACTION, PRE_APPROVAL, REFUND

---

## 💰 Taxas do PagBank

| Método | Taxa |
|--------|------|
| Cartão de Crédito | 4,99% + R$ 0,40 |
| PIX | 0,99% |
| Boleto | R$ 3,49 por boleto |

---

## 📚 Recursos Adicionais

- **Documentação Oficial:** https://dev.pagseguro.uol.com.br/reference/intro
- **API Reference:** https://dev.pagseguro.uol.com.br/reference/charge-credit-card
- **Assinaturas (Pre-Approval):** https://dev.pagseguro.uol.com.br/reference/create-plan
- **Suporte:** https://pagseguro.uol.com.br/atendimento

---

## ⚠️ Checklist antes de ir para Produção

- [ ] Conta PagBank verificada e aprovada
- [ ] Token de produção configurado no `.env`
- [ ] Webhook configurado e testado
- [ ] Política de reembolso definida
- [ ] Termos de uso e política de privacidade publicados
- [ ] Testes de pagamento em produção realizados
- [ ] Monitoramento de erros configurado
- [ ] Backup automático do banco de dados ativo
- [ ] SSL/HTTPS configurado no domínio

---

## 🆘 Problemas Comuns

### **Erro: "Token não configurado"**
- Verifique se adicionou o token no `.env`
- Reinicie o servidor com `npm run dev`

### **Erro: "Unauthorized"**
- Verifique se o token está correto
- Confirme que está usando o token correto (sandbox vs produção)

### **Pagamento não processa**
- Verifique se usou um cartão de teste válido
- Confirme que o CPF é o de teste: 22222222222
- Veja logs no painel do PagBank

### **Webhook não recebe notificações**
- URL deve ser HTTPS em produção
- URL deve estar acessível publicamente
- Verifique logs do servidor

---

## 💡 Dicas

✅ **Use sempre credenciais de SANDBOX em desenvolvimento**
✅ **Monitore o painel do PagBank para ver transações em tempo real**
✅ **Configure notificações por email para novos pagamentos**
✅ **Implemente retry logic para pagamentos falhados**
✅ **Salve todos os IDs de transação no banco de dados**

---

**Desenvolvido por:** Agenda+ HOF Team
**Última atualização:** 2025-10-13
