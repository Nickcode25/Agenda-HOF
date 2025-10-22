# 🚨 SOLUÇÃO URGENTE - PagBank Bloqueado

## ❌ Problema Confirmado

Teste realizado: Token atual retorna **403 - ACCESS_DENIED**

```
Token: 58fb3202-f17c-4f20-b...45399df273
Status: ❌ BLOQUEADO pelo PagBank
Erro: "whitelist access required. Contact PagSeguro"
```

## ✅ SOLUÇÃO: Gerar Novo Token

O token atual **NÃO VAI FUNCIONAR** mesmo com whitelist configurado.

### 🔑 Passo 1: Gerar Novo Token no PagBank

**URL**: https://minhaconta.pagseguro.uol.com.br/credenciais

1. Faça login com sua conta nicolasngc99@gmail.com
2. Vá em **"Credenciais"** ou **"Integrações"**
3. **REVOGUE** o token antigo (que termina com ...cb45399df273)
4. Clique em **"Gerar Nova Credencial"**
5. **CRÍTICO**: Marque TODAS as permissões:
   - ☑️ Criar transações/cobranças
   - ☑️ Consultar transações
   - ☑️ Gerenciar pedidos
   - ☑️ Criar assinaturas e planos
   - ☑️ Gerenciar assinaturas
   - ☑️ Receber notificações
   - ☑️ Criar QR Code/PIX
   - ☑️ Criar boletos
   - ☑️ **TODAS AS PERMISSÕES DISPONÍVEIS**

6. Dê um nome: "Agenda HOF - Produção Completa"
7. Copie o token completo (você só pode copiar UMA VEZ!)

### 🧪 Passo 2: Testar o Novo Token

Antes de configurar no Railway, teste se está funcionando:

```bash
cd /home/nicolas/Agenda-HOF/backend
node test-token-pagbank.js
```

Cole o novo token e veja se aparece: **✅ SUCESSO!**

Se aparecer erro de whitelist, vá para o Passo 3.

### 🔒 Passo 3: Configurar Whitelist (COM O NOVO TOKEN)

**URL**: https://pagseguro.uol.com.br/preferencias/integracoes.jhtml

**ADICIONE AS SEGUINTES URLs** (uma por vez):

```
https://agenda-hof-production.up.railway.app
https://agendahof.com
https://www.agendahof.com
```

**⏰ IMPORTANTE**: Aguarde 10-15 minutos após adicionar o whitelist.

### 🚂 Passo 4: Configurar Token no Railway

1. Acesse: https://railway.app
2. Entre no projeto **agenda-hof-production**
3. Vá em **Variables** ou **Environment Variables**
4. Edite a variável `PAGBANK_TOKEN`
5. Cole o NOVO token completo
6. Clique em **Save** ou **Deploy**
7. **Aguarde 2-3 minutos** para o Railway reiniciar

### ✅ Passo 5: Testar em Produção

Aguarde 2-3 minutos após configurar no Railway, depois teste:

```
https://www.agendahof.com/checkout
```

Aplique o cupom PROMO95 e tente fazer o pagamento.

## 🆘 Se AINDA não funcionar

### Verificação 1: Token está correto no Railway?

O token deve ter **exatamente 100 caracteres** e formato:
```
XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXX...XXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
```

### Verificação 2: Whitelist foi salvo?

Volte em https://pagseguro.uol.com.br/preferencias/integracoes.jhtml e confirme que as 3 URLs estão lá.

### Verificação 3: Aguardou tempo suficiente?

O PagBank pode demorar até **30 minutos** para propagar o whitelist.

### Verificação 4: Contatar Suporte do PagBank

Se após 30 minutos ainda não funcionar:

- 📞 Telefone: **0800 744 0444**
- 📧 Email: **atendimento@pagseguro.com.br**
- 💬 Chat: https://pagseguro.uol.com.br/atendimento/

**Informações para passar ao suporte**:

```
Problema: ACCESS_DENIED mesmo com whitelist configurado
Token gerado em: [data/hora que você gerou]
URLs no whitelist:
  - https://agenda-hof-production.up.railway.app
  - https://agendahof.com
  - https://www.agendahof.com

Erro completo:
{
  "error_messages": [{
    "code": "ACCESS_DENIED",
    "description": "whitelist access required. Contact PagSeguro"
  }]
}
```

## 📊 Resumo das Ações

- [ ] Gerei novo token no PagBank com TODAS as permissões
- [ ] Testei o novo token localmente (test-token-pagbank.js)
- [ ] Configurei whitelist com as 3 URLs
- [ ] Configurei novo token no Railway (variável PAGBANK_TOKEN)
- [ ] Railway reiniciou (aguardei 2-3 minutos)
- [ ] Aguardei 10-15 minutos para whitelist propagar
- [ ] Testei pagamento em https://www.agendahof.com/checkout
- [ ] ✅ FUNCIONOU!

OU

- [ ] ❌ Ainda não funcionou após 30 minutos
- [ ] Contatei suporte do PagBank

## 🔧 Arquivo de Teste

Use este script para testar qualquer token:
```bash
cd /home/nicolas/Agenda-HOF/backend
node test-token-pagbank.js
```

O script vai te dizer exatamente qual é o problema:
- ❌ Token inválido/expirado
- ❌ Token sem permissões
- ❌ Whitelist não configurado
- ✅ Token funcionando!
