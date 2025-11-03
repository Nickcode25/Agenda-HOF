# 🔧 Solução de Problemas - Mercado Pago

## 🚨 Problema: Pagamento Recusado por Segurança

### Descrição do Problema
Quando um pagamento é aprovado inicialmente mas depois é recusado com a mensagem:
> "Este pagamento foi recusado porque não passou pelos controles de segurança do Mercado Pago"

### ⚠️ Causas Comuns

#### 1. **payment_method_id Hardcoded**
**Problema:** O código estava usando `payment_method_id: 'master'` fixo no backend.

**Solução Aplicada:**
- ✅ Removido o campo `payment_method_id` do payload
- ✅ O Mercado Pago agora detecta automaticamente a bandeira do cartão através do `cardToken`

**Arquivo corrigido:** [backend/server.js:128-140](../backend/server.js#L128-L140)

```javascript
// ❌ ANTES (ERRADO)
const paymentData = {
  transaction_amount: amount,
  token: cardToken,
  payment_method_id: 'master', // ⚠️ Hardcoded!
  payer: { ... }
}

// ✅ AGORA (CORRETO)
const paymentData = {
  transaction_amount: amount,
  token: cardToken,
  // payment_method_id removido - detectado automaticamente
  payer: { ... }
}
```

#### 2. **Falta de Validação de CPF**
**Problema:** CPF não era obrigatório e não tinha validação adequada.

**Solução Aplicada:**
- ✅ Validação obrigatória de CPF com 11 dígitos
- ✅ Mensagem de erro clara quando CPF é inválido

**Arquivo corrigido:** [backend/server.js:119-125](../backend/server.js#L119-L125)

```javascript
// Validar CPF (obrigatório para produção)
if (!customerCpf || customerCpf.replace(/\D/g, '').length !== 11) {
  return res.status(400).json({
    error: 'CPF inválido ou não fornecido',
    details: 'O CPF deve conter 11 dígitos'
  })
}
```

#### 3. **Tratamento de Erros Inadequado**
**Problema:** Erros de segurança não eram tratados com mensagens amigáveis.

**Solução Aplicada:**
- ✅ Mensagens de erro específicas para cada tipo de problema
- ✅ Logs detalhados para debug
- ✅ Tratamento especial para erros de segurança e fraude

**Arquivo corrigido:** [backend/server.js:216-227](../backend/server.js#L216-L227)

```javascript
// Tratar erros específicos de segurança do Mercado Pago
if (errorMessage.includes('security') || errorMessage.includes('fraud')) {
  errorMessage = 'Pagamento recusado por medidas de segurança. Verifique os dados ou entre em contato com seu banco.'
} else if (errorMessage.includes('invalid') && errorMessage.includes('card')) {
  errorMessage = 'Dados do cartão inválidos. Verifique o número, validade e CVV.'
} else if (errorMessage.includes('CPF') || errorMessage.includes('identification')) {
  errorMessage = 'CPF inválido. Verifique os dados e tente novamente.'
}
```

#### 4. **Logs Insuficientes**
**Problema:** Difícil diagnosticar problemas sem logs detalhados.

**Solução Aplicada:**
- ✅ Logs detalhados em cada etapa do processo
- ✅ Informações sensíveis mascaradas (CPF, token)
- ✅ Logs específicos para erros de PreApproval

**Arquivo corrigido:** [backend/server.js:167-230](../backend/server.js#L167-L230)

---

## 🛡️ Medidas de Segurança do Mercado Pago

O Mercado Pago usa vários controles de segurança:

### 1. **Validação de Dados**
- CPF deve ser válido e corresponder ao titular do cartão
- Email deve ser válido
- Dados do cartão devem estar corretos

### 2. **Análise Anti-Fraude**
- Padrões de comportamento suspeitos
- Múltiplas tentativas de pagamento
- Dispositivos bloqueados
- Localização geográfica

### 3. **3D Secure**
- Autenticação adicional para alguns cartões
- SMS ou app do banco
- Pode ser exigido pelo emissor do cartão

### 4. **Limites e Restrições**
- Limites de valor por transação
- Limites diários/mensais
- Restrições por tipo de cartão

---

## ✅ Checklist de Verificação

Antes de fazer um pagamento em produção:

- [ ] CPF válido e com 11 dígitos
- [ ] Email válido e acessível
- [ ] Dados do cartão corretos (número, validade, CVV)
- [ ] Nome do titular exatamente como no cartão
- [ ] Usar cartão real (não de teste) em produção
- [ ] Token de acesso de PRODUÇÃO (APP_USR-...)
- [ ] Limite de crédito disponível no cartão
- [ ] Cartão não bloqueado ou vencido

---

## 🔍 Como Diagnosticar Problemas

### 1. Verificar Logs do Backend
```bash
# Ver logs em tempo real
railway logs --follow

# Ou no console do Railway
# Procure por linhas com ❌ ou 🚨
```

### 2. Verificar Painel do Mercado Pago
- Acesse: https://www.mercadopago.com.br/activities
- Verifique a seção "Recusados"
- Veja o motivo detalhado da recusa

### 3. Verificar Webhook
- Acesse: https://www.mercadopago.com.br/developers/panel/notifications/webhooks
- Veja os últimos eventos recebidos
- Verifique se os webhooks foram entregues

### 4. Testar com Cartão de Teste
**Apenas em modo TEST (credenciais TEST-...):**
- Aprovado: `5031 4332 1540 6351`
- CVV: `123`
- Validade: `11/25`
- Nome: Qualquer nome
- CPF: `12345678909`

---

## 🆘 Códigos de Erro Comuns

| Código | Descrição | Solução |
|--------|-----------|---------|
| `cc_rejected_high_risk` | Cartão recusado por risco alto | Usar outro cartão ou entrar em contato com o banco |
| `cc_rejected_insufficient_amount` | Saldo/limite insuficiente | Verificar limite disponível no cartão |
| `cc_rejected_bad_filled_security_code` | CVV incorreto | Verificar e corrigir o CVV |
| `cc_rejected_bad_filled_card_number` | Número do cartão incorreto | Verificar e corrigir o número |
| `cc_rejected_bad_filled_date` | Data de validade incorreta | Verificar mês e ano de validade |
| `cc_rejected_call_for_authorize` | Banco requer autorização | Cliente deve ligar para o banco |

---

## 📞 Suporte

### Mercado Pago
- Documentação: https://www.mercadopago.com.br/developers/pt/docs
- Suporte: https://www.mercadopago.com.br/developers/pt/support
- Status: https://status.mercadopago.com

### Verificar Status da Conta
```bash
# Fazer uma chamada de teste para verificar credenciais
curl -H "Authorization: Bearer SEU_ACCESS_TOKEN" \
  https://api.mercadopago.com/v1/account/settings
```

---

## 🔄 Próximos Passos Recomendados

1. **Testar com cartão real** (pequeno valor)
2. **Verificar email de confirmação** do Mercado Pago
3. **Monitorar logs** durante a transação
4. **Verificar webhook** se foi recebido
5. **Confirmar assinatura** salva no banco de dados

---

**Última atualização:** 03/11/2025
**Status:** ✅ Correções aplicadas
