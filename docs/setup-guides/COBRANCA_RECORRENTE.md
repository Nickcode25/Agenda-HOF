# 💳 Cobrança Recorrente - Como Funciona

## 📋 Visão Geral

O sistema atual do Agenda+ HOF está configurado para fazer **cobranças únicas** no momento do cadastro. Para implementar **cobranças mensais recorrentes** (assinaturas), você precisa decidir entre duas abordagens:

---

## 🎯 Opção 1: Assinatura Nativa do PagBank (Recomendado)

### Como Funciona
O PagBank possui um sistema de **assinaturas** que cobra automaticamente todo mês:

- Cliente paga R$ 109,90 no cadastro
- Todo dia do mês (mesmo dia do cadastro) o PagBank **cobra automaticamente**
- Se o cartão for recusado, o PagBank tenta novamente nos próximos dias
- Você recebe notificações de pagamentos bem-sucedidos ou falhos via **webhook**

### Vantagens
✅ **Automático**: Você não precisa fazer nada mensalmente
✅ **Seguro**: PagBank guarda os dados do cartão de forma segura
✅ **Gestão de Falhas**: PagBank tenta cobrar automaticamente se falhar
✅ **Menos trabalho**: Toda a lógica de cobrança fica no PagBank

### Desvantagens
❌ Requer mudanças no código backend
❌ Precisa configurar webhooks para receber notificações
❌ Cliente precisa manter cartão válido

### O Que Precisa Fazer

1. **Modificar o Backend** (`/backend/server.js`):
   - Trocar endpoint `/charges` por `/subscriptions`
   - Configurar plano mensal de R$ 109,90

2. **Criar Endpoint de Webhook**:
   - PagBank envia notificações quando o pagamento é processado
   - Atualizar status da assinatura no banco de dados

3. **Gerenciar Status**:
   - Se pagamento falhar por 3 tentativas → bloquear acesso
   - Se pagamento for bem-sucedido → manter acesso ativo

### Documentação Oficial
📚 https://dev.pagseguro.uol.com.br/reference/criar-assinatura

---

## 🎯 Opção 2: Cobrança Manual Mensal (Simples)

### Como Funciona
Você controla manualmente quando cobrar os clientes:

- Cliente paga R$ 109,90 no cadastro (válido por 30 dias)
- Após 30 dias, o sistema **bloqueia o acesso automaticamente**
- Cliente recebe email/WhatsApp para pagar novamente
- Cliente acessa uma página de renovação e paga R$ 109,90
- Sistema libera acesso por mais 30 dias

### Vantagens
✅ **Mais simples de implementar**
✅ **Não precisa de webhook**
✅ **Cliente pode escolher quando renovar**
✅ **Menos dependência do PagBank**

### Desvantagens
❌ Cliente pode esquecer de pagar
❌ Você precisa enviar lembretes manualmente
❌ Mais trabalho administrativo
❌ Taxa de renovação pode ser menor

### O Que Precisa Fazer

1. **Adicionar Campo de Expiração** na tabela `users`:
   ```sql
   ALTER TABLE users ADD COLUMN subscription_expires_at TIMESTAMP;
   ```

2. **Criar Job Diário** que:
   - Verifica assinaturas expirando em 7 dias → envia lembrete
   - Verifica assinaturas expirando em 1 dia → envia alerta urgente
   - Verifica assinaturas expiradas → bloqueia acesso

3. **Criar Página de Renovação**:
   - Cliente logado acessa `/renovar`
   - Paga R$ 109,90 via PagBank
   - Sistema adiciona +30 dias na expiração

4. **Middleware de Verificação**:
   - Toda requisição verifica se assinatura está ativa
   - Se expirada → redireciona para página de renovação

---

## 🔄 Opção 3: Híbrida (Recomendado para Escala)

### Como Funciona
Combina as duas abordagens anteriores:

1. **No cadastro**: Cliente pode escolher:
   - ✅ Assinatura automática (R$ 109,90/mês)
   - ✅ Renovação manual (R$ 109,90 a cada 30 dias)

2. **Assinatura Automática**:
   - PagBank cobra automaticamente todo mês
   - Usa webhooks para atualizar status

3. **Renovação Manual**:
   - Cliente renova quando quiser
   - Sistema bloqueia após vencimento
   - Recebe lembretes por email/WhatsApp

### Vantagens
✅ **Flexibilidade**: Cliente escolhe o que prefere
✅ **Maior conversão**: Alguns clientes preferem controle manual
✅ **Escalável**: Funciona para qualquer volume

### Desvantagens
❌ Mais complexo de implementar
❌ Precisa gerenciar dois fluxos diferentes

---

## 🚀 Recomendação Imediata

Para começar **AGORA** com menos trabalho:

### **Use a Opção 2 (Manual) primeiro:**

1. Execute a migração para adicionar o campo de expiração
2. No checkout, ao criar conta do usuário, defina:
   ```typescript
   subscription_expires_at = Data Atual + 30 dias
   ```
3. Crie um componente que verifica na sidebar se a assinatura vai expirar em 7 dias ou menos e mostra um aviso
4. Crie middleware que bloqueia acesso se `subscription_expires_at < Data Atual`
5. Crie página `/renovar` onde cliente pode pagar novamente

### **Depois implemente a Opção 1 (Automática):**

- Quando tiver mais tempo, migre para assinaturas nativas do PagBank
- Mantenha a opção manual como alternativa

---

## 📊 Comparação

| Critério | Assinatura PagBank | Manual | Híbrida |
|----------|-------------------|---------|---------|
| **Complexidade** | Média | Baixa | Alta |
| **Automação** | Total | Nenhuma | Parcial |
| **Taxa de Renovação** | Alta (90-95%) | Média (60-70%) | Alta (85-90%) |
| **Trabalho Admin** | Baixo | Alto | Médio |
| **Tempo Implementação** | 2-3 dias | 1 dia | 4-5 dias |

---

## 💡 Próximos Passos

**Se escolher Opção 2 (Manual - Recomendado para começar):**

1. Vou criar a migração SQL
2. Vou modificar o Checkout para salvar data de expiração
3. Vou criar o middleware de verificação
4. Vou criar a página de renovação
5. Vou criar sistema de lembretes (email/WhatsApp)

**Se escolher Opção 1 (Automática - Recomendado para escala):**

1. Vou modificar o backend para usar `/subscriptions`
2. Vou criar endpoint de webhook
3. Vou atualizar frontend para usar novo fluxo
4. Vou criar dashboard de gestão de assinaturas

---

## ❓ Dúvidas Frequentes

### Como o cliente cancela a assinatura?
- **Opção 1**: Precisa de função no painel para cancelar via PagBank API
- **Opção 2**: Cliente simplesmente não renova

### O que acontece se o pagamento falhar?
- **Opção 1**: PagBank tenta novamente por 3 dias, depois cancela
- **Opção 2**: Cliente perde acesso até pagar novamente

### Como fazer upgrade/downgrade de plano?
- **Opção 1**: Cancelar assinatura atual e criar nova
- **Opção 2**: Ajustar data de expiração proporcionalmente

### Posso ter período de teste grátis?
- **Ambas**: Sim! No checkout, não cobre nos primeiros 7/14/30 dias

---

## 📞 Contato

**Qual opção você prefere?**
- [ ] Opção 1 - Assinatura Automática PagBank
- [ ] Opção 2 - Renovação Manual Simples ⭐ (Recomendado para começar)
- [ ] Opção 3 - Híbrida (Melhor a longo prazo)

Me avise qual escolher e eu implemento agora! 🚀
