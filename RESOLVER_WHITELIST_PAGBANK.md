# 🔐 Resolver Erro de Whitelist do PagBank

## ❌ Erro Atual:
```
whitelist_unauthorized
User is not authorized to access this resource with an explicit deny
```

Este erro significa que o PagBank está **bloqueando seu acesso** por questões de segurança.

---

## 🎯 Soluções Possíveis (tente na ordem):

### Solução 1: Configurar Whitelist de IPs ⭐ (Mais provável)

1. **Acesse**: https://pagseguro.uol.com.br/
2. **Faça login**
3. **Procure por uma destas opções no menu**:
   - Integrações → Segurança
   - Integrações → Configurações de API
   - Configurações → Segurança
   - Perfil → Segurança
4. **Procure por**:
   - "Whitelist de IPs"
   - "IPs Autorizados"
   - "Controle de Acesso"
   - "Restrição de IP"
5. **Adicione seu IP**:
   ```
   179.152.167.197
   ```
6. **Ou libere todos os IPs (desenvolvimento)**:
   ```
   0.0.0.0/0
   ```
7. **Salve** e aguarde 5-10 minutos para propagar

---

### Solução 2: Ativar API na Conta

Algumas contas do PagBank precisam **ativar manualmente** o acesso à API:

1. **Acesse**: https://pagseguro.uol.com.br/
2. **Vá em**: Integrações → Ativar API
3. **Ou procure**: "Solicitar acesso à API"
4. **Preencha o formulário** (se houver)
5. **Aguarde aprovação** (pode levar algumas horas)

---

### Solução 3: Verificar Status da Conta

O PagBank pode bloquear APIs se:
- ✅ Conta não está verificada
- ✅ Documentos pendentes
- ✅ Conta nova (menos de 30 dias)

**Como verificar**:
1. Vá em: Perfil → Meus Dados
2. Verifique se há algum aviso de "Conta pendente"
3. Verifique se todos os documentos foram enviados
4. Verifique se a conta está ativa

---

### Solução 4: Usar Ambiente Sandbox (Temporário)

Se você só quer **testar** o sistema, use o ambiente Sandbox:

1. **Acesse**: https://sandbox.pagseguro.uol.com.br/
2. **Crie uma conta de testes**
3. **Gere um token de Sandbox**
4. **Atualize o backend**:

```bash
nano /home/nicolas/Agenda-HOF/backend/.env
```

Troque para:
```env
NODE_ENV=development
PAGBANK_TOKEN=SEU_TOKEN_DE_SANDBOX_AQUI
```

5. **Reinicie o backend**

**⚠️ IMPORTANTE**: Sandbox não cobra dinheiro real! Use apenas para testes.

---

### Solução 5: Entrar em Contato com Suporte

Se nada funcionar, entre em contato:

**Suporte PagBank**:
- 📞 Telefone: 0800 762 7877
- 💬 Chat: https://pagseguro.uol.com.br/atendimento
- 📧 Email: atendimento@pagseguro.com.br

**Informações para fornecer**:
```
Problema: Erro "whitelist_unauthorized" ao usar API
Token: 58fb3202-... (mostre só os primeiros caracteres)
Erro completo: "User is not authorized to access this resource with an explicit deny for client_id: app_220327711"
IP do servidor: 179.152.167.197
Endpoint testado: POST /charges
```

Pergunte especificamente:
- ❓ "Como configurar whitelist de IPs?"
- ❓ "Minha conta tem acesso à API habilitado?"
- ❓ "Preciso solicitar permissões especiais?"

---

## 🧪 Testar Depois de Resolver

Depois de fazer as alterações, teste novamente:

```bash
cd /home/nicolas/Agenda-HOF/backend
node test-token-v2.js
```

**Se funcionar, você verá**:
```
✅ TOKEN VÁLIDO!
✅ Cobrança de teste criada (não capturada)
🎉 Seu token está funcionando corretamente!
```

---

## 📊 Status Atual

- ✅ Backend configurado e rodando
- ✅ Tabelas do Supabase criadas
- ✅ Frontend pronto
- ✅ Sistema de cupons funcionando
- ✅ Sistema de assinaturas implementado
- ❌ **Token do PagBank bloqueado por whitelist**

**Falta apenas**: Resolver whitelist do PagBank! 🚀

---

## 💡 Enquanto Isso...

Você pode:

1. **Testar o resto do sistema**:
   - Sistema de cupons no painel admin
   - Interface do checkout
   - Formulários de cadastro

2. **Preparar para produção**:
   - Configurar domínio
   - Configurar SSL
   - Fazer backup do banco

3. **Explorar o painel admin**:
   - http://localhost:5175/admin/login
   - Gerenciar cupons
   - Ver métricas (quando tiver dados)

---

## 📞 Precisa de Ajuda?

Se não conseguir resolver, me avise e podemos:
- Implementar modo de simulação para você testar sem PagBank
- Criar um sistema alternativo de pagamento
- Te ajudar a falar com o suporte do PagBank

🎯 **Você está a 1 passo de finalizar!**
