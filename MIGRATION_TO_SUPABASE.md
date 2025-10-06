# 🔄 Migração para Supabase - Guia Completo

## 📋 O que mudou?

Antes os dados eram salvos no **localStorage do navegador** (dados locais).
Agora os dados são salvos no **Supabase** (banco de dados na nuvem).

### ✅ Vantagens:
- ✨ Dados salvos na nuvem
- 🔐 Dados separados por usuário (multi-tenancy)
- 💾 Dados persistentes (não se perdem ao limpar o navegador)
- 📱 Acesso de qualquer dispositivo
- 🔄 Backup automático

---

## 🚀 Passo a Passo

### 1. Execute o SQL no Supabase

Acesse o **SQL Editor** do Supabase e execute:

**Arquivo:** `database/migrations/005_app_schema_multitenancy.sql`

Este SQL cria todas as tabelas necessárias:
- ✅ `patients` - Pacientes
- ✅ `procedures` - Procedimentos
- ✅ `professionals` - Profissionais
- ✅ `appointments` - Agendamentos
- ✅ `waitlist` - Lista de espera
- ✅ `stock` - Estoque
- ✅ `sales` - Vendas
- ✅ `subscription_plans` - Planos
- ✅ `subscriptions` - Assinaturas

**Importante:** Todas as tabelas têm `user_id` para separar os dados por usuário!

### 2. Faça login com a conta cortesia

1. Acesse: `http://localhost:5175/app`
2. Faça login com o email: **nataliaacristina@gmail.com** (ou o email da cortesia criada)
3. Use a senha que você configurou

### 3. Teste o sistema

Agora tudo que você criar será salvo no Supabase:

#### ✅ Teste 1: Criar um Paciente
1. Vá em `Pacientes` → `Novo Paciente`
2. Preencha os dados
3. Salve
4. **Verifique no Supabase:** Vá no Table Editor → `patients` → deve aparecer o paciente

#### ✅ Teste 2: Criar um Procedimento
1. Vá em `Procedimentos` → `Novo Procedimento`
2. Preencha os dados
3. Salve
4. **Verifique no Supabase:** Table Editor → `procedures`

#### ✅ Teste 3: Criar um Agendamento
1. Vá em `Agenda` → `Novo Agendamento`
2. Preencha os dados
3. Salve
4. **Verifique no Supabase:** Table Editor → `appointments`

---

## 🔧 Stores Migradas

### ✅ Já migradas:
- `patients.ts` - Pacientes
- `procedures.ts` - Procedimentos

### ⏳ Próximas (em desenvolvimento):
- `professionals.ts` - Profissionais
- `schedule.ts` - Agenda e lista de espera
- `stock.ts` - Estoque
- `sales.ts` - Vendas
- `subscriptions.ts` - Mensalidades

---

## 🔍 Como Verificar se Funcionou?

### No Navegador (DevTools):
1. Abra o DevTools (F12)
2. Aba **Network**
3. Crie um paciente
4. Você deve ver requisições para `supabase.co`

### No Supabase:
1. Acesse o **Table Editor**
2. Selecione a tabela (ex: `patients`)
3. Deve aparecer os registros criados
4. **Importante:** Todos terão o mesmo `user_id` (do usuário logado)

---

## 🐛 Problemas Comuns

### Erro: "Usuário não autenticado"
**Solução:** Faça login novamente no sistema

### Erro: "permission denied for table..."
**Solução:** Execute o SQL `005_app_schema_multitenancy.sql` que configura as permissões (RLS)

### Dados não aparecem
**Solução:**
1. Verifique se fez login com a conta cortesia
2. Abra o console (F12) e veja se há erros
3. Verifique se o `user_id` no banco coincide com o usuário logado

---

## 📊 Verificar user_id do usuário logado

Execute no SQL Editor do Supabase:

```sql
-- Ver todos os usuários
SELECT id, email, raw_user_meta_data->>'name' as name
FROM auth.users;

-- Ver pacientes de um usuário específico
SELECT * FROM patients
WHERE user_id = 'uuid-do-usuario-aqui';
```

---

## 🎯 Próximos Passos

Vou continuar migrando as outras stores:
1. ⏳ Professionals
2. ⏳ Schedule (Agenda + Waitlist)
3. ⏳ Stock
4. ⏳ Sales
5. ⏳ Subscriptions

Cada uma terá a mesma lógica:
- Buscar dados filtrando por `user_id`
- Inserir incluindo o `user_id`
- Atualizar/Deletar verificando o `user_id` (RLS faz isso automaticamente)
