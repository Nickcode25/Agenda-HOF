# 🔐 Como Obter Token do PagBank - Guia Definitivo

Você está com erro de **whitelist** no token. Aqui está a solução definitiva:

## 🎯 O Problema

O PagBank está bloqueando seu acesso com erro:
```
whitelist_unauthorized
User is not authorized to access this resource
```

---

## ✅ SOLUÇÃO: Use o Connect (OAuth)

O PagBank mudou! Agora usa **Connect** em vez de token direto.

### Passo 1: Criar Aplicação no PagBank

Você já está na página certa! Preencha:

**Informações da aplicação**:
- Nome: `Agenda+ HOF`
- ID: `agenda-hof`
- Descrição: `Sistema de agendamento`
- URL: `http://localhost:5175`

**Notificações** (SUPER IMPORTANTE):
```
URL: https://brave-wolves-win.loca.lt/api/pagbank/webhook
```
(Deixe usuário e senha em branco)

**Redirecionamento**:
```
URL: http://localhost:5175/app/agenda
```

### Passo 2: Salvar e Pegar Credenciais

Depois de criar a aplicação, o PagBank vai te dar:
- ✅ **Client ID**
- ✅ **Client Secret**

**GUARDE ESTES DADOS!**

---

## 🔧 ALTERNATIVA RÁPIDA: Modo Sandbox

Se você só quer **TESTAR** sem complicação:

### 1. Mude para Sandbox

Edite o arquivo `.env` do backend:
```bash
nano /home/nicolas/Agenda-HOF/backend/.env
```

Troque para:
```env
NODE_ENV=development
PAGBANK_TOKEN=seu_token_aqui
```

### 2. Gere Token de Sandbox

1. Acesse: https://sandbox.pagseguro.uol.com.br/
2. Crie uma conta de teste
3. Vá em Integrações → Gerar Token
4. Copie o token
5. Cole no `.env`

### 3. Reinicie o Backend

```bash
pkill -f "node.*server.js"
cd /home/nicolas/Agenda-HOF/backend
npm run dev
```

### 4. Teste

```bash
node backend/test-token-v2.js
```

Deve funcionar agora!

---

## 📞 Se Nada Funcionar

Entre em contato com o suporte do PagBank:

**Telefone**: 0800 762 7877

**Diga exatamente isso**:

> "Olá, estou tentando usar a API do PagBank para criar assinaturas recorrentes, mas estou recebendo erro 'whitelist_unauthorized' com código de erro 'app_220327711'. Como faço para liberar meu IP ou ativar a API na minha conta?"

**Informações para fornecer**:
- Seu email: nicolasngc99@gmail.com
- IP do servidor: 179.152.167.197
- Erro: whitelist_unauthorized
- Endpoint: POST /charges

---

## 🎯 Resumo

**Opção 1** (Produção): Criar aplicação Connect
**Opção 2** (Teste): Usar Sandbox
**Opção 3** (Ajuda): Ligar 0800 762 7877

**Recomendo Opção 2** para testar agora e depois migrar para Opção 1! 🚀
