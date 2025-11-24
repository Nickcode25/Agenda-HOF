# Sistema de Notificações por Email

Este documento descreve como o sistema de notificações por email foi implementado usando o [Resend](https://resend.com).

## Índice

1. [Visão Geral](#visão-geral)
2. [Configuração](#configuração)
3. [Serviços Implementados](#serviços-implementados)
4. [Tipos de Email](#tipos-de-email)
5. [Como Usar](#como-usar)
6. [Troubleshooting](#troubleshooting)

---

## Visão Geral

O sistema de email utiliza o **Resend** como provedor de serviço de email transacional. Todos os emails são enviados de forma **assíncrona** e **não bloqueante**, garantindo que falhas no envio de email não afetem as operações principais do sistema.

### Características

- ✅ Emails transacionais profissionais e responsivos
- ✅ Templates HTML customizados com tema laranja
- ✅ Código de verificação de 6 dígitos para cadastro
- ✅ Confirmação de assinatura de planos
- ✅ Reset de senha com link seguro
- ✅ Envio assíncrono (não bloqueia operações)
- ✅ Fallback gracioso em caso de erro

---

## Configuração

### 1. Obter Chave API do Resend

1. Acesse [resend.com](https://resend.com) e crie uma conta
2. Vá em **API Keys** no painel
3. Clique em **Create API Key**
4. Copie a chave gerada (formato: `re_xxxxxxxxxx`)

### 2. Configurar Variáveis de Ambiente

Adicione as seguintes variáveis no arquivo `.env`:

```env
# Resend Configuration
VITE_RESEND_API_KEY=re_sua_chave_api_aqui
VITE_EMAIL_FROM=noreply@agendahof.com
VITE_APP_URL=http://localhost:5173
```

**Importante:**
- `VITE_RESEND_API_KEY`: Chave API do Resend (obrigatório)
- `VITE_EMAIL_FROM`: Email remetente (deve estar verificado no Resend)
- `VITE_APP_URL`: URL da aplicação (usado em links nos emails)

### 3. Verificar Domínio no Resend (Produção)

Para usar em produção, você precisa verificar seu domínio no Resend:

1. Acesse **Domains** no painel do Resend
2. Clique em **Add Domain**
3. Digite seu domínio (ex: `agendahof.com`)
4. Configure os registros DNS conforme instruído
5. Aguarde a verificação (pode levar até 48h)

Em desenvolvimento, você pode usar o domínio de teste do Resend.

---

## Serviços Implementados

### Estrutura de Arquivos

```
src/
└── services/
    └── email/
        ├── resend.service.ts       # Serviço principal de envio
        ├── verification.service.ts  # Gerenciamento de códigos
        └── templates/               # (futuro) Templates reutilizáveis
```

### 1. Serviço de Email (`resend.service.ts`)

Contém todas as funções de envio de email:

- `sendEmail()` - Função genérica de envio
- `sendVerificationCode()` - Envia código de verificação de cadastro
- `sendSubscriptionConfirmation()` - Confirma assinatura de plano
- `sendPasswordReset()` - Envia link de reset de senha

### 2. Serviço de Verificação (`verification.service.ts`)

Gerencia códigos de verificação:

- `generateVerificationCode()` - Gera código de 6 dígitos
- `saveVerificationCode()` - Salva código em memória com expiração
- `verifyCode()` - Verifica se código é válido
- `deleteVerificationCode()` - Remove código
- `getVerificationInfo()` - Obtém informações sobre código

**⚠️ Nota:** Atualmente os códigos são armazenados em memória. Em produção, recomenda-se usar banco de dados (Redis, Supabase, etc.).

---

## Tipos de Email

### 1. Verificação de Cadastro

**Quando é enviado:** Após usuário preencher formulário de cadastro

**Conteúdo:**
- Código de 6 dígitos
- Nome do usuário
- Validade de 15 minutos
- Instruções de uso

**Implementação:**
```typescript
import { sendVerificationCode } from '@/services/email/resend.service'
import { saveVerificationCode } from '@/services/email/verification.service'

const code = saveVerificationCode(email)
await sendVerificationCode({
  to: email,
  code: code,
  userName: name
})
```

### 2. Confirmação de Assinatura

**Quando é enviado:** Após paciente assinar um plano de mensalidade

**Conteúdo:**
- Nome do plano
- Valor da assinatura
- Data de início
- Link para acessar plataforma

**Implementação:**
```typescript
import { sendSubscriptionConfirmation } from '@/services/email/resend.service'
import { formatCurrency } from '@/utils/currency'

await sendSubscriptionConfirmation({
  to: patientEmail,
  userName: patientName,
  planName: 'Plano Premium',
  planPrice: formatCurrency(299.90),
  startDate: '01/01/2024'
})
```

### 3. Reset de Senha

**Quando é enviado:** Após usuário solicitar redefinição de senha

**Conteúdo:**
- Nome do usuário
- Link seguro para reset
- Validade de 1 hora
- Dicas de segurança

**Implementação:**
```typescript
import { sendPasswordReset } from '@/services/email/resend.service'

await sendPasswordReset({
  to: userEmail,
  userName: userName,
  resetLink: 'https://agendahof.com/reset-password?token=xxx'
})
```

---

## Como Usar

### Adicionar Novo Tipo de Email

1. **Criar função no `resend.service.ts`:**

```typescript
export interface SendNewEmailParams {
  to: string
  customField: string
}

export async function sendNewEmail({ to, customField }: SendNewEmailParams) {
  const subject = `${APP_NAME} - Título do Email`

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Título do Email</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
        <!-- Seu template HTML aqui -->
      </body>
    </html>
  `

  return sendEmail({ to, subject, html })
}
```

2. **Usar no código:**

```typescript
import { sendNewEmail } from '@/services/email/resend.service'

try {
  await sendNewEmail({
    to: 'usuario@email.com',
    customField: 'valor'
  })
  console.log('Email enviado com sucesso')
} catch (error) {
  console.error('Erro ao enviar email:', error)
  // Não propagar erro se não for crítico
}
```

### Boas Práticas

1. **Sempre use try-catch:** Emails não devem bloquear operações principais
2. **Não propague erros:** Se o email falhar, registre no console mas não lance exceção
3. **Valide emails:** Use `validateEmail()` antes de enviar
4. **Use templates responsivos:** Suporte mobile e desktop
5. **Teste em múltiplos clientes:** Gmail, Outlook, Apple Mail, etc.

---

## Troubleshooting

### Emails não estão sendo enviados

**Problema:** Nenhum email está sendo recebido

**Soluções:**
1. Verifique se `VITE_RESEND_API_KEY` está configurada
2. Verifique se a chave API é válida no painel do Resend
3. Confira os logs do console para erros
4. Verifique se o domínio está verificado (produção)

### Emails vão para spam

**Problema:** Emails caem na caixa de spam

**Soluções:**
1. Verifique o domínio no Resend (SPF, DKIM, DMARC)
2. Use um domínio verificado (não use `@gmail.com` ou similar)
3. Evite palavras spam no assunto
4. Mantenha HTML limpo e profissional

### Código de verificação expirou

**Problema:** Usuário recebe erro "código expirado"

**Soluções:**
1. Verifique se o tempo de expiração (15 min) é adequado
2. Implemente botão "reenviar código"
3. Aumente tempo de expiração se necessário

### Erros em produção

**Problema:** Funciona em desenvolvimento mas não em produção

**Soluções:**
1. Verifique se variáveis de ambiente estão definidas no servidor
2. Confira se `VITE_APP_URL` aponta para URL de produção
3. Verifique logs do servidor
4. Teste API do Resend manualmente

---

## Próximos Passos

### Melhorias Sugeridas

1. **Migrar códigos para banco de dados**
   - Atualmente em memória (perdem ao reiniciar)
   - Usar Redis ou Supabase para persistência

2. **Fila de emails**
   - Implementar sistema de filas (Bull, BullMQ)
   - Processar emails em background
   - Retry automático em caso de falha

3. **Mais tipos de email**
   - Lembrete de agendamento
   - Confirmação de pagamento
   - Aniversário de paciente
   - Relatórios mensais

4. **Analytics**
   - Taxa de abertura
   - Taxa de clique
   - Emails rejeitados
   - Feedback loop

5. **Templates visuais**
   - Editor WYSIWYG para templates
   - Variáveis dinâmicas
   - Pré-visualização antes de enviar

6. **Testes automatizados**
   - Testes unitários para serviços
   - Testes de integração com Resend
   - Mock de envio de email em testes

---

## Suporte

Para dúvidas ou problemas:
- Documentação Resend: https://resend.com/docs
- Issues do projeto: [GitHub](https://github.com/seu-repo/issues)
- Email: suporte@agendahof.com
