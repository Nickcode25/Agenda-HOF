# 🔑 GERAR NOVO TOKEN DO PAGBANK - URGENTE

## ⚠️ Problema Identificado

O token atual do PagBank está **inválido, expirado ou sem permissões corretas**.

Erro: `ACCESS_DENIED - whitelist access required`

## ✅ Como Gerar um Novo Token

### 1. Acesse o Portal do PagBank
```
https://minhaconta.pagseguro.uol.com.br/credenciais
```

### 2. Revogue o Token Antigo (se existir)
- Procure por tokens existentes
- Revogue/exclua o token antigo com final `...cb45399df273`

### 3. Gere um Novo Token
- Clique em **"Gerar Nova Credencial"** ou **"Criar Token"**
- Nome sugerido: `Agenda HOF - Produção`
- **IMPORTANTE**: Marque TODAS as permissões necessárias:
  - ✅ Criar cobranças
  - ✅ Criar pedidos
  - ✅ Consultar transações
  - ✅ Criar assinaturas/planos
  - ✅ Receber notificações (webhook)
  - ✅ Gerenciar assinaturas

### 4. Copie o Token Completo
- O token terá formato: `XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX`
- **ATENÇÃO**: Você só pode copiar o token UMA VEZ na hora da criação!
- Guarde em local seguro

## 🔧 Configurar o Novo Token

### No Railway (BACKEND)

1. Acesse: https://railway.app/project/agenda-hof-production
2. Vá em **Variables** ou **Environment**
3. Edite a variável `PAGBANK_TOKEN`
4. Cole o novo token completo
5. Salve - O Railway vai reiniciar automaticamente

### No Vercel (FRONTEND) - Se necessário

Se o frontend também usar o token:
1. Acesse: https://vercel.com/seu-projeto/settings/environment-variables
2. Edite `VITE_PAGBANK_TOKEN`
3. Cole o novo token
4. **Importante**: Faça um novo deploy para aplicar

## ⚠️ Depois de Gerar o Novo Token

### 1. Configure o Whitelist NOVAMENTE
Com o novo token, você DEVE adicionar novamente as URLs autorizadas:

Acesse: https://pagseguro.uol.com.br/preferencias/integracoes.jhtml

Adicione (UMA POR UMA):
```
https://agenda-hof-production.up.railway.app
https://agendahof.com
https://www.agendahof.com
```

### 2. Aguarde 5-10 minutos
O PagBank pode demorar para propagar as alterações

### 3. Teste Novamente
```
https://www.agendahof.com/checkout
```

## 📋 Checklist

- [ ] Revoguei o token antigo no PagBank
- [ ] Gerei novo token com TODAS as permissões
- [ ] Copiei o token completo
- [ ] Atualizei `PAGBANK_TOKEN` no Railway
- [ ] Railway reiniciou (aguardar 2-3 minutos)
- [ ] Adicionei URLs no whitelist do PagBank
- [ ] Aguardei 5-10 minutos para propagar
- [ ] Testei pagamento em produção

## 🆘 Se Ainda Não Funcionar

1. **Verifique se o token está correto no Railway**
   - Deve ter exatamente 100 caracteres
   - Não deve ter espaços no início/fim

2. **Verifique se é conta de produção**
   - Token de sandbox NÃO funciona em produção
   - Certifique-se de que gerou token da conta de PRODUÇÃO

3. **Contate o Suporte do PagBank**
   - Telefone: 0800 744 0444
   - Email: atendimento@pagseguro.com.br
   - Informe que está tendo erro de ACCESS_DENIED mesmo com whitelist configurado

## 📝 Informações Técnicas

**Backend URL**: `https://agenda-hof-production.up.railway.app`
**Frontend URLs**:
- `https://agendahof.com`
- `https://www.agendahof.com`

**Token atual (INVÁLIDO)**:
- Primeiros 20 chars: `58fb3202-f17c-4f20-b`
- Length: 100 caracteres
- Status: ❌ EXPIRADO/INVÁLIDO

**Token novo (a ser gerado)**:
- Deve ter ~100 caracteres
- Deve ter TODAS as permissões marcadas
- Deve ser de conta de PRODUÇÃO (não sandbox)
