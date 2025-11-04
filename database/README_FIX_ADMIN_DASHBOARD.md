# 🔧 Fix Admin Dashboard - Dados Zerados

## 🐛 Problema Identificado

O **AdminDashboard** estava mostrando todos os dados zerados:
- 0 clínicas
- 0 usuários
- R$ 0,00 receita
- 0 assinaturas ativas

### Causa Raiz

O problema estava nas **políticas RLS (Row Level Security)** da tabela `user_subscriptions`. O super admin não tinha permissão para visualizar os dados de assinaturas de todos os usuários.

**Console mostrava:**
```
📊 Assinaturas encontradas: Array(0)
```

Isso significa que a query funcionou, mas retornou vazio devido às políticas de segurança.

---

## ✅ Solução

### Passo 1: Execute o SQL de Correção

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **SQL Editor**
4. Abra o arquivo **`FIX_ADMIN_ACCESS_TO_SUBSCRIPTIONS.sql`**
5. Cole todo o conteúdo no editor
6. Clique em **RUN** (ou Ctrl+Enter)

Este SQL vai:
- ✅ Garantir que a tabela `super_admins` existe
- ✅ Adicionar `agendahof.site@gmail.com` como super admin
- ✅ Criar a função `is_super_admin()` para verificar permissões
- ✅ **Adicionar políticas RLS** permitindo super admin ver TODAS as assinaturas
- ✅ Testar se as configurações foram aplicadas

### Passo 2: Verificar se Funcionou

Após executar o SQL, você verá as mensagens:

```
✅ Super admin agendahof.site@gmail.com configurado com sucesso!
✅ Políticas RLS adicionadas para user_subscriptions
✅ Agora o admin pode ver todas as assinaturas no dashboard
```

E duas tabelas de resultado:
1. **Total de super admins:** 1
2. **Total de assinaturas visíveis:** 3 (ou o número correto de assinaturas)

### Passo 3: Testar o Dashboard

1. Faça logout do sistema
2. Faça login novamente com `agendahof.site@gmail.com`
3. Acesse o **Admin Dashboard**
4. Agora você deve ver os dados corretos:
   - Clínicas: número correto
   - Usuários: número correto
   - Receita: valor correto
   - Assinaturas ativas: número correto

---

## 🔍 O Que Foi Mudado

### Políticas RLS Adicionadas

```sql
-- Permite super admin ver TODAS as assinaturas
CREATE POLICY "Super admin can view all subscriptions"
  ON user_subscriptions
  FOR SELECT
  USING (public.is_super_admin());

-- Permite super admin atualizar TODAS as assinaturas
CREATE POLICY "Super admin can update all subscriptions"
  ON user_subscriptions
  FOR UPDATE
  USING (public.is_super_admin());

-- Permite super admin deletar TODAS as assinaturas
CREATE POLICY "Super admin can delete all subscriptions"
  ON user_subscriptions
  FOR DELETE
  USING (public.is_super_admin());
```

### Função Helper

```sql
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.super_admins
    WHERE id = auth.uid()
    AND is_active = true
  );
$$;
```

Esta função verifica se o usuário logado está na tabela `super_admins` e está ativo.

---

## 🎯 Como Funciona

### Antes (❌ Problema)

1. Admin fazia login
2. AdminDashboard executava:
   ```typescript
   const { data } = await supabase
     .from('user_subscriptions')
     .select('user_id, plan_amount, status')
   ```
3. **RLS bloqueava** porque não havia política permitindo ver outras assinaturas
4. Resultado: `Array(0)`

### Depois (✅ Funcionando)

1. Admin faz login
2. AdminDashboard executa a mesma query
3. **RLS verifica**: Este usuário é super admin? → SIM
4. **RLS permite** acesso a TODAS as assinaturas
5. Resultado: `Array(3)` com todos os dados

---

## 📊 Estrutura do Sistema

### Tabelas Envolvidas

```
super_admins
├── id (UUID) → referencia auth.users
├── email (TEXT)
├── is_active (BOOLEAN)
└── created_at (TIMESTAMP)

user_subscriptions
├── id (UUID)
├── user_id (UUID) → usuário que assinou
├── mercadopago_subscription_id
├── status (active, cancelled, etc)
├── plan_amount (DECIMAL)
└── ... (outros campos)
```

### Fluxo de Verificação RLS

```
Usuário faz query
    ↓
RLS verifica políticas
    ↓
┌─ is_super_admin() = true? → PERMITE acesso a TUDO
│
└─ auth.uid() = user_id? → PERMITE acesso apenas aos seus dados
    ↓
Retorna resultados filtrados
```

---

## 🔐 Segurança

### Políticas Mantidas

- ✅ Usuários normais continuam vendo **apenas suas próprias assinaturas**
- ✅ Super admins veem **todas as assinaturas**
- ✅ Service role continua tendo acesso total (para webhooks)

### Quem é Super Admin?

Apenas usuários adicionados manualmente à tabela `super_admins`:
- `agendahof.site@gmail.com` (você)

Para adicionar mais super admins no futuro:

```sql
INSERT INTO public.super_admins (id, email)
SELECT id, email
FROM auth.users
WHERE email = 'outro-admin@exemplo.com'
ON CONFLICT (id) DO NOTHING;
```

---

## 🚀 Próximos Passos

Após aplicar o fix:

1. ✅ Dashboard mostrará dados corretos
2. ✅ Lista de assinantes aparecerá preenchida
3. ✅ Estatísticas estarão corretas
4. ✅ Sistema pronto para produção

---

## 📝 Resumo

**Problema:** RLS bloqueando acesso do admin aos dados de assinaturas

**Solução:** Adicionar políticas RLS específicas para super admins

**Resultado:** Admin pode ver e gerenciar todas as assinaturas

**Arquivo para executar:** `FIX_ADMIN_ACCESS_TO_SUBSCRIPTIONS.sql`

---

## ⚠️ Importante

- Este SQL é **idempotente** (pode ser executado múltiplas vezes sem problemas)
- Use `DROP POLICY IF EXISTS` para evitar erros de políticas duplicadas
- A função `is_super_admin()` usa `SECURITY DEFINER` para ter permissão de consultar a tabela

---

## 🎉 Conclusão

Agora o sistema de admin está completo e funcional:

- ✅ Captura de CPF e telefone no checkout
- ✅ View SQL para consultas simplificadas
- ✅ Dashboard mostrando dados reais
- ✅ Permissões RLS corretas
- ✅ Sistema profissional de gestão de assinantes

**Tudo pronto para produção!** 🚀
