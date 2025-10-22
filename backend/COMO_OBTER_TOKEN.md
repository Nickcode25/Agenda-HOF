# 🔑 Como Obter Token do PagBank

O erro **"unauthorized"** significa que o token do PagBank está inválido ou expirado.

## 📋 Passo a Passo para Obter Novo Token

### 1️⃣ Acessar o Painel do PagBank

**Para SANDBOX (Testes):**
1. Acesse: https://devs.pagseguro.uol.com.br/
2. Faça login com sua conta PagBank
3. Vá em **"Credenciais"** ou **"Tokens"**

**Para PRODUÇÃO:**
1. Acesse: https://pagseguro.uol.com.br
2. Faça login
3. Vá em **Integrações** > **Credenciais de Integração**

### 2️⃣ Gerar Novo Token

1. Clique em **"Gerar novo token"** ou **"Criar credencial"**
2. **IMPORTANTE**: Escolha o ambiente correto:
   - **Sandbox** = Para testes (use este primeiro!)
   - **Produção** = Para pagamentos reais

3. Copie o token gerado (formato: `xxx-yyy-zzz...`)

### 3️⃣ Atualizar o Token no Backend

Edite o arquivo `.env` na pasta `backend`:

```env
PAGBANK_TOKEN=SEU_NOVO_TOKEN_AQUI
```

### 4️⃣ Reiniciar o Backend

```bash
# Se estiver rodando, pare com Ctrl+C
# Depois inicie novamente:
npm run dev
```

## 🧪 Testar se o Token Funciona

Após reiniciar o backend com o novo token, teste fazendo um cadastro no site.

Se continuar dando erro "unauthorized":
1. Verifique se copiou o token completo (geralmente é bem longo)
2. Certifique-se de estar usando o token do **Sandbox** (não o de produção)
3. Verifique se sua conta PagBank está ativa

## ⚠️ Problemas Comuns

**Erro: "unauthorized"**
- Token inválido ou expirado
- Solução: Gerar novo token

**Erro: "forbidden"**
- Conta não verificada
- Solução: Complete o cadastro no PagBank

**Erro: "invalid_request"**
- Falta algum dado obrigatório
- Solução: Veja os logs do backend

## 📞 Suporte

Se continuar com problemas:
- Documentação PagBank: https://dev.pagseguro.uol.com.br/reference/intro
- Suporte PagBank: https://pagseguro.uol.com.br/atendimento
