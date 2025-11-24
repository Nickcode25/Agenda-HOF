# Guia Rápido - Sistema de Email

## Configuração em 3 Passos

### 1. Obter Chave API do Resend

1. Acesse [resend.com](https://resend.com) e crie uma conta gratuita
2. No painel, vá em **API Keys**
3. Clique em **Create API Key**
4. Dê um nome (ex: "Desenvolvimento") e copie a chave

### 2. Configurar Variáveis de Ambiente

Adicione no arquivo `.env`:

```env
VITE_RESEND_API_KEY=re_sua_chave_aqui
VITE_EMAIL_FROM=noreply@agendahof.com
VITE_APP_URL=http://localhost:5173
```

### 3. Testar o Sistema

Execute a aplicação e teste:

```bash
npm run dev
```

**Teste 1: Cadastro com Verificação**
1. Acesse `http://localhost:5173/signup`
2. Preencha o formulário de cadastro
3. Clique em "Criar Conta"
4. Verifique seu email para receber o código de 6 dígitos
5. Digite o código no modal que aparecerá

**Teste 2: Assinatura de Plano** (requer paciente com email)
1. Acesse "Mensalidades" > "Assinantes"
2. Adicione uma nova assinatura
3. Verifique o email do paciente para confirmação

**Teste 3: Reset de Senha**
1. Acesse `http://localhost:5173/login`
2. Clique em "Esqueceu a senha?"
3. Digite seu email
4. Verifique o email para receber o link de reset

---

## Funcionalidades Implementadas

### ✅ Cadastro com Verificação de Email
- Código de 6 dígitos enviado por email
- Validade de 15 minutos
- Modal interativo para digitação do código
- Botão de reenvio com cooldown de 60s

### ✅ Confirmação de Assinatura
- Email automático ao criar assinatura
- Detalhes do plano, valor e data de início
- Botão para acessar a plataforma

### ✅ Reset de Senha
- Link seguro enviado por email
- Validade de 1 hora
- Template profissional com instruções

---

## Arquivos Criados

```
src/
├── services/
│   └── email/
│       ├── resend.service.ts       # Serviço principal
│       └── verification.service.ts # Gerencia códigos
├── components/
│   └── VerificationCodeModal.tsx   # Modal de verificação
└── pages/
    └── SignupPage.tsx              # Atualizado com verificação

docs/
├── EMAIL_SYSTEM.md                 # Documentação completa
└── EMAIL_QUICK_START.md           # Este arquivo

.env.example                        # Variáveis atualizadas
```

---

## Próximos Passos

### Para Produção

1. **Verificar Domínio no Resend**
   - Adicione seu domínio no painel do Resend
   - Configure registros DNS (SPF, DKIM, DMARC)
   - Aguarde verificação

2. **Configurar Variáveis de Ambiente**
   ```env
   VITE_RESEND_API_KEY=re_producao_xxx
   VITE_EMAIL_FROM=noreply@seudominio.com
   VITE_APP_URL=https://seudominio.com
   ```

3. **Migrar Códigos para Banco**
   - Atualmente em memória (perdem ao reiniciar)
   - Usar Supabase ou Redis para persistência

### Melhorias Futuras

- [ ] Sistema de filas para emails
- [ ] Analytics (taxa de abertura, cliques)
- [ ] Mais tipos de email (lembrete, aniversário, etc.)
- [ ] Editor visual de templates
- [ ] Testes automatizados

---

## Troubleshooting

**Problema:** Emails não chegam
- ✅ Verifique se `VITE_RESEND_API_KEY` está configurada
- ✅ Confira o console do navegador para erros
- ✅ Verifique caixa de spam

**Problema:** Código inválido
- ✅ Código expira em 15 minutos
- ✅ Use o botão "Reenviar código"
- ✅ Verifique se digitou corretamente

**Problema:** Erro ao enviar
- ✅ Chave API válida?
- ✅ Domínio verificado (produção)?
- ✅ Limites da conta Resend

---

## Suporte

📧 Email: suporte@agendahof.com
📖 Documentação Completa: [EMAIL_SYSTEM.md](./EMAIL_SYSTEM.md)
🌐 Resend Docs: https://resend.com/docs
