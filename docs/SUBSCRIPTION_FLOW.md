# Fluxo de Assinatura Recorrente

## Visão Geral

Este documento descreve como o sistema de assinaturas recorrentes funciona, desde a criação até o gerenciamento automático de cobranças e falhas.

## Fluxo Completo

```
┌─────────────────────────────────────────────────────────────────┐
│                    1. CLIENTE CRIA ASSINATURA                   │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                     2. VERIFICA SE TEM TRIAL                    │
├─────────────────────────────────────────────────────────────────┤
│  has_trial = true                    │  has_trial = false       │
│  ├─ trial_days = 7 dias              │  └─ Cobrança imediata    │
│  └─ Primeira cobrança: start + 7d    │                          │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                  3. MERCADO PAGO COBRA AUTOMATICAMENTE          │
└─────────────────────────────────────────────────────────────────┘
                               │
                   ┌───────────┴───────────┐
                   │                       │
                   ▼                       ▼
        ┌──────────────────┐    ┌──────────────────┐
        │   PAGAMENTO OK   │    │ PAGAMENTO FALHOU │
        └──────────────────┘    └──────────────────┘
                   │                       │
                   ▼                       ▼
        ┌──────────────────┐    ┌──────────────────────────────┐
        │ Status: approved │    │  retry_failed_payments?     │
        │ Próxima: +30d    │    ├────────────────────────────┤
        └──────────────────┘    │ SIM: Tenta reprocessar     │
                                │ - max_retry_attempts = 3    │
                                │ - retry_interval_days = 3   │
                                │ - Total: 9 dias tentando    │
                                │                             │
                                │ NÃO: Cancela imediatamente  │
                                └─────────────────────────────┘
                                               │
                                               ▼
                                    ┌──────────────────┐
                                    │ Todas falharam?  │
                                    ├──────────────────┤
                                    │ SIM: Cancela     │
                                    │ NÃO: Continua OK │
                                    └──────────────────┘
```

## Configuração dos Planos

### Campos Disponíveis

| Campo | Tipo | Descrição | Exemplo |
|-------|------|-----------|---------|
| `has_trial` | boolean | Se o plano tem período de trial | `true` |
| `trial_days` | integer | Dias de trial gratuito (0-90) | `7` |
| `billing_day` | integer | Dia fixo do mês para cobrança (1-28, NULL = aniversário) | `5` ou `null` |
| `retry_failed_payments` | boolean | Se deve reprocessar falhas | `true` |
| `max_retry_attempts` | integer | Máximo de tentativas (1-10) | `3` |
| `retry_interval_days` | integer | Dias entre tentativas (1-30) | `3` |

### Exemplos de Configuração

#### Plano com Trial de 7 dias
```json
{
  "name": "Premium",
  "price": 99.90,
  "has_trial": true,
  "trial_days": 7,
  "billing_day": null,
  "retry_failed_payments": true,
  "max_retry_attempts": 3,
  "retry_interval_days": 3
}
```

**Comportamento:**
- Cliente assina em 01/03
- Trial até 08/03 (gratuito)
- Primeira cobrança em 08/03
- Se falhar: tenta novamente em 11/03, 14/03, 17/03
- Se todas falharem: cancela em 17/03

#### Plano sem Trial, cobrança no dia 5
```json
{
  "name": "Basic",
  "price": 49.90,
  "has_trial": false,
  "trial_days": 0,
  "billing_day": 5,
  "retry_failed_payments": true,
  "max_retry_attempts": 2,
  "retry_interval_days": 5
}
```

**Comportamento:**
- Cliente assina em 12/03
- Primeira cobrança imediata (12/03)
- Próximas cobranças: sempre no dia 5 de cada mês
- Se falhar: tenta novamente após 5 e 10 dias
- Se todas falharem: cancela após 10 dias

## Lógica de Cobrança

### 1. Primeira Cobrança

```javascript
if (has_trial) {
  first_charge_date = start_date + trial_days
} else {
  if (billing_day) {
    first_charge_date = próximo dia ${billing_day} do mês
  } else {
    first_charge_date = start_date (imediato)
  }
}
```

### 2. Cobranças Recorrentes

```javascript
if (billing_day) {
  // Cobra sempre no mesmo dia do mês
  next_charge = dia ${billing_day} do próximo mês
} else {
  // Cobra no aniversário da assinatura
  next_charge = current_charge + 30 dias
}
```

### 3. Gerenciamento de Falhas

```javascript
function handlePaymentFailure(subscription) {
  if (!retry_failed_payments) {
    cancelSubscription(subscription)
    notifyUser('Assinatura cancelada - pagamento falhou')
    return
  }

  if (retry_count >= max_retry_attempts) {
    cancelSubscription(subscription)
    notifyUser('Assinatura cancelada - máximo de tentativas excedido')
    return
  }

  scheduleRetry(
    subscription,
    retry_count + 1,
    retry_interval_days
  )

  notifyUser(`Tentativa ${retry_count + 1} de ${max_retry_attempts} em ${retry_interval_days} dias`)
}
```

## Notificações por Email

### Eventos que Geram Emails

1. **Assinatura Criada**
   - Assunto: "Bem-vindo ao [Plano]"
   - Conteúdo: Detalhes do plano, próxima cobrança

2. **Trial Ending Soon (2 dias antes)**
   - Assunto: "Seu trial termina em 2 dias"
   - Conteúdo: Lembrete da primeira cobrança

3. **Pagamento Aprovado**
   - Assunto: "Pagamento confirmado - R$ XX,XX"
   - Conteúdo: Recibo, próxima cobrança

4. **Pagamento Falhou**
   - Assunto: "Problema com seu pagamento"
   - Conteúdo: Motivo da falha, próxima tentativa

5. **Retry Scheduled**
   - Assunto: "Nova tentativa de cobrança agendada"
   - Conteúdo: Data da próxima tentativa

6. **Assinatura Cancelada**
   - Assunto: "Sua assinatura foi cancelada"
   - Conteúdo: Motivo, como reativar

## Webhooks do Mercado Pago

### Eventos a Escutar

```javascript
POST /api/webhooks/mercadopago
{
  "type": "payment",
  "action": "payment.created | payment.updated",
  "data": {
    "id": "payment_id"
  }
}
```

### Status de Pagamento

| Status MP | Status Sistema | Ação |
|-----------|----------------|------|
| `approved` | `active` | Atualiza next_billing_date |
| `rejected` | `payment_failed` | Agenda retry ou cancela |
| `pending` | `pending` | Aguarda webhook |
| `refunded` | `refunded` | Cancela assinatura |

## Banco de Dados

### Campos em `user_subscriptions`

```sql
ALTER TABLE user_subscriptions ADD COLUMN:
- retry_count INTEGER DEFAULT 0
- last_payment_attempt TIMESTAMPTZ
- next_retry_date TIMESTAMPTZ
- payment_failure_reason TEXT
- cancelled_reason TEXT
```

### Campos em `subscription_plans`

Já criados pelo script `ADD_TRIAL_FIELDS_TO_PLANS.sql`:
- `has_trial`
- `trial_days`
- `billing_day`
- `retry_failed_payments`
- `max_retry_attempts`
- `retry_interval_days`

## Próximos Passos

1. ✅ Criar campos na tabela `subscription_plans`
2. ✅ Atualizar PlansManager com configuração de trial/billing
3. ⏳ Criar worker/cron para processar retries
4. ⏳ Implementar webhooks do Mercado Pago
5. ⏳ Criar sistema de notificações por email
6. ⏳ Adicionar dashboard de retry status no AdminPanel

## Testes Recomendados

### Teste 1: Plano com Trial
1. Criar assinatura com trial de 1 dia
2. Aguardar 1 dia
3. Verificar se cobrança foi tentada
4. Verificar email enviado

### Teste 2: Falha de Pagamento
1. Usar cartão de teste que falha (Mercado Pago)
2. Verificar se retry foi agendado
3. Aguardar intervalo
4. Verificar se segunda tentativa ocorreu

### Teste 3: Cancelamento após Retries
1. Configurar max_retry_attempts = 2
2. Forçar falhas consecutivas
3. Verificar se cancelou após 2 tentativas
4. Verificar email de cancelamento
