# Configurar Emails Customizados no Supabase

## Problema

O Supabase envia emails automáticos (feios) que sobrescrevem nossos emails customizados do Resend.

## Solução

### 1. Desabilitar Emails do Supabase

1. Acesse https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **Authentication** > **Email Templates**
4. Desabilite o template "Reset Password"
5. Ou customize o template para usar seu domínio

### 2. Configurar SMTP Customizado (Recomendado)

Para usar seus próprios emails:

1. Vá em **Project Settings** > **Auth** > **SMTP Settings**
2. Habilite "Enable Custom SMTP"
3. Configure com Resend:
   - **Host:** smtp.resend.com
   - **Port:** 587 ou 465
   - **Username:** resend
   - **Password:** [sua chave API do Resend]
   - **Sender email:** noreply@agendahof.com (após verificar domínio)

### 3. Usar Auth via Backend (Nossa Solução Atual)

Como estamos usando backend próprio, vamos interceptar o reset de senha antes do Supabase enviar o email.

## Implementação Correta

Vamos modificar o fluxo para:
1. Frontend chama backend
2. Backend gera token de reset no Supabase **sem enviar email**
3. Backend envia nosso email customizado via Resend
4. Link aponta para nossa página de reset

Veja implementação em: `backend/server.js`
