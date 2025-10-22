# 🔑 Configurar Novo Token do PagBank

## ✅ Token Gerado

```
71a0c98d-7f03-4432-a41a-e8a2b18cebc5f695497941f0bc5930589cbe6384f14696fd-dc62-4799-a0dd-eb917bace476
```

## 📋 Checklist - Siga na Ordem

### ✅ 1. Token Local Atualizado
- [x] Arquivo `backend/.env` atualizado com novo token
- [x] Token testado localmente

### ⏳ 2. Configurar Whitelist no PagBank (URGENTE)

**Acesse**: https://pagseguro.uol.com.br/preferencias/integracoes.jhtml

**Adicione estas 3 URLs** (uma por vez):

1. `https://agenda-hof-production.up.railway.app`
2. `https://agendahof.com`
3. `https://www.agendahof.com`

**⏰ IMPORTANTE**: Depois de adicionar, **aguarde 15-20 minutos** para o PagBank propagar o whitelist em todos os servidores.

---

### 🚂 3. Configurar Token no Railway

#### Opção A: Via Dashboard (RECOMENDADO)

1. Acesse: https://railway.app
2. Faça login na sua conta
3. Clique no projeto **agenda-hof-production**
4. Clique na aba **Variables** (ou **Environment**)
5. Procure a variável `PAGBANK_TOKEN`
6. Clique em **Edit** ou no ícone de lápis
7. **Cole o novo token**:
   ```
   71a0c98d-7f03-4432-a41a-e8a2b18cebc5f695497941f0bc5930589cbe6384f14696fd-dc62-4799-a0dd-eb917bace476
   ```
8. Clique em **Save** ou **Update**
9. O Railway vai **reiniciar automaticamente** (aguarde 2-3 minutos)

#### Opção B: Via Railway CLI (Se preferir)

```bash
# Instalar Railway CLI (se não tiver)
npm install -g @railway/cli

# Fazer login
railway login

# Configurar variável
railway variables set PAGBANK_TOKEN=71a0c98d-7f03-4432-a41a-e8a2b18cebc5f695497941f0bc5930589cbe6384f14696fd-dc62-4799-a0dd-eb917bace476

# Deploy automático
```

---

### 🗄️ 4. Executar SQL no Supabase (RLS Subscriptions)

**Problema**: A tabela `user_subscriptions` não tem permissão de leitura para usuários autenticados.

**Solução**:

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto **Agenda HOF**
3. Vá em **SQL Editor** (no menu lateral)
4. Cole este SQL:

```sql
-- Permitir que usuários autenticados leiam suas próprias subscriptions
CREATE POLICY "allow_users_read_own_subscriptions"
ON user_subscriptions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
```

5. Clique em **Run** ou **Execute**
6. Deve aparecer: "Success. No rows returned"

#### Verificar se funcionou:

```sql
-- Ver todas as policies da tabela user_subscriptions
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'user_subscriptions';
```

Deve aparecer a policy `allow_users_read_own_subscriptions`.

---

## ⏱️ Tempo Estimado Total

- Configurar whitelist: **2 minutos**
- Aguardar propagação whitelist: **15-20 minutos** ⏳
- Configurar token no Railway: **2 minutos**
- Railway reiniciar: **2-3 minutos**
- Executar SQL no Supabase: **1 minuto**

**Total: ~25-30 minutos**

---

## 🧪 Como Testar Depois

### Teste 1: Verificar se Railway pegou o novo token

1. Acesse os **Logs do Railway**:
   - Dashboard → Seu projeto → Aba **Logs**
2. Procure por: `PAGBANK_TOKEN primeiros 20 chars: 71a0c98d-7f03-4432-a`
3. Se aparecer o novo token → ✅ Configurado corretamente

### Teste 2: Testar pagamento

1. Acesse: https://www.agendahof.com/checkout
2. Aplique cupom `PROMO95`
3. Tente fazer um pagamento PIX
4. **Se funcionar** → ✅ Whitelist propagado e token OK
5. **Se erro 403** → ⏳ Aguarde mais alguns minutos

### Teste 3: Verificar subscription (após executar SQL)

1. Faça login no site: https://www.agendahof.com/login
2. Tente acessar: https://www.agendahof.com/app/agenda
3. **Se redirecionar para `/pricing`** → ✅ Sistema funcionando (você não tem subscription)
4. **Se erro 403** → ❌ SQL não foi executado no Supabase

---

## 🆘 Se Ainda Não Funcionar

### Erro: "Token do PagBank inválido"

**Causa**: Whitelist ainda não propagou

**Solução**:
1. Aguarde mais 10-15 minutos
2. Verifique se as 3 URLs estão no whitelist do PagBank
3. Tente deslogar e logar novamente no PagBank
4. Contate suporte: 0800 744 0444

### Erro: "403 - user_subscriptions"

**Causa**: SQL do RLS não foi executado

**Solução**:
1. Execute o SQL novamente no Supabase
2. Verifique se tem permissão de admin no Supabase
3. Recarregue a página depois de executar SQL

### Erro: Railway não reiniciou

**Causa**: Deploy travado

**Solução**:
1. Dashboard Railway → **Deployments**
2. Clique em **Redeploy** no último deploy
3. Aguarde 2-3 minutos

---

## 📝 Resumo das Ações

**Você precisa fazer 3 coisas:**

1. ✅ **Whitelist no PagBank** (15-20 min para propagar)
2. ✅ **Token no Railway** (2-3 min para reiniciar)
3. ✅ **SQL no Supabase** (instantâneo)

**Depois disso tudo vai funcionar!** 🚀

---

## 📞 Suporte

- **PagBank**: 0800 744 0444
- **Railway**: https://railway.app/help
- **Supabase**: https://supabase.com/support
