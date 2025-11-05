# Instruções para Corrigir Preços dos Planos

## Mudanças Implementadas

### 1. ✅ Badge de Assinatura Corrigido
- Atualizado `SubscriptionProtectedRoute.tsx` para fornecer dados da assinatura
- Agora o badge mostra corretamente:
  - "Trial Premium" (azul) - para usuários em período de teste
  - "Básico" (cinza) - para planos < R$ 60
  - "Premium" (laranja) - para planos ≥ R$ 60

### 2. ✅ Página de Planos Melhorada
- Corrigido display de preços (agora mostra centavos corretamente)
- Trial só aparece se: `plan.has_trial = true` E usuário NÃO está em trial
- Implementado navegação: Trial → /planos → /checkout

### 3. ✅ Integração com Checkout
- Checkout agora recebe o plano selecionado
- Usa o preço correto do plano selecionado

## O Que Você Precisa Fazer

### Passo 1: Corrigir Preços no Banco de Dados

Execute o SQL abaixo no painel do Supabase (SQL Editor):

```sql
-- Atualizar preços dos planos baseado nos valores atuais
-- Plano que está em ~50 → 49.90
-- Plano que está em ~100 → 99.90

-- Atualizar plano básico (preço atual próximo de 50)
UPDATE subscription_plans
SET price = 49.90
WHERE price >= 48 AND price <= 52;

-- Atualizar plano premium (preço atual próximo de 100)
UPDATE subscription_plans
SET price = 99.90
WHERE price >= 95 AND price <= 105;

-- Verificar resultados
SELECT
  id,
  name,
  price,
  has_trial,
  trial_days,
  is_active
FROM subscription_plans
ORDER BY price ASC;
```

### Passo 2: Remover Trial dos Planos (Opcional mas Recomendado)

Como os usuários já ganham 7 dias de trial no cadastro, não faz sentido os planos oferecerem trial também:

```sql
-- Remover trial de todos os planos
UPDATE subscription_plans
SET
  has_trial = false,
  trial_days = 0
WHERE has_trial = true;

-- Verificar
SELECT name, has_trial, trial_days FROM subscription_plans;
```

## Por Que Remover o Trial dos Planos?

**Situação Atual:**
- Usuário se cadastra → ganha 7 dias de trial automático
- Usuário clica em "Assinar Agora" → vê planos com "7 dias de teste grátis"
- **Problema:** Usuário já está EM trial, então mostrar "7 dias grátis" é confuso

**Solução:**
1. Remover `has_trial` e `trial_days` dos planos no banco
2. Trial é concedido automaticamente no cadastro (via `user_metadata.trial_end_date`)
3. Planos mostram apenas preço e recursos

## Arquivos Modificados

1. `/src/components/SubscriptionProtectedRoute.tsx`
   - Adicionado interface `Subscription`
   - Adicionado `subscription` ao contexto
   - Agora fornece dados completos da assinatura

2. `/src/components/SubscriptionBadge.tsx`
   - Usa `subscription.plan_amount` para determinar tipo de plano
   - Badge Basic: planos < R$ 60
   - Badge Premium: planos ≥ R$ 60

3. `/src/pages/PlansPage.tsx`
   - Corrigido cálculo de centavos no preço
   - Trial só aparece se usuário NÃO está em trial

4. `/src/pages/Checkout.tsx`
   - Aceita `selectedPlan` do location.state
   - Usa preço do plano selecionado

## Scripts SQL Criados

- `database/FIX_PRICES_BY_VALUE.sql` - Atualiza preços baseado em ranges
- `database/REMOVE_TRIAL_FROM_PLANS.sql` - Remove trial dos planos
- `database/CHECK_PLANS.sql` - Consulta dados dos planos

## Fluxo Esperado

### Para Usuário em Trial:
1. Usuário vê badge "Trial Premium" (azul) no header
2. Usuário vê banner "Restam X dias do seu período de teste"
3. Clica em "Assinar Agora" → vai para `/planos`
4. Vê planos SEM mensagem "7 dias de teste grátis" (porque já está em trial)
5. Seleciona plano → vai para `/checkout`
6. Finaliza pagamento → badge muda para "Básico" ou "Premium"

### Para Usuário Sem Assinatura (trial expirado):
1. Vê overlay de bloqueio
2. Clica em "Escolher Plano" → vai para `/planos`
3. Vê planos (pode ou não mostrar trial, dependendo da configuração)
4. Seleciona plano → vai para `/checkout`
5. Finaliza pagamento → ganha acesso

## Testando

Depois de executar os SQLs, teste:

1. ✅ Login com conta em trial → deve ver "Trial Premium"
2. ✅ Ir para /planos → preços devem aparecer como R$ 49,90 e R$ 99,90
3. ✅ Não deve aparecer "7 dias de teste grátis" se usuário está em trial
4. ✅ Selecionar plano → deve ir para checkout com preço correto
5. ✅ Badge deve mudar após pagamento

## Perguntas Frequentes

**Q: Por que o SQL de UPDATE não funcionou?**
A: Os nomes dos planos no banco podem ter espaços extras ou formatação diferente. Por isso criamos um script que atualiza baseado no PREÇO atual, não no nome.

**Q: E se eu quiser oferecer trial nos planos mesmo assim?**
A: Você pode manter, mas recomendamos remover para evitar confusão. Se manter, certifique-se que a lógica `!isInTrial` está funcionando corretamente.

**Q: Como verifico se os preços foram atualizados?**
A: Execute o SELECT no final do script SQL, ou acesse a página /planos no navegador.

## Próximos Passos

1. Execute os SQLs acima no Supabase
2. Acesse `/planos` e verifique se os preços estão corretos
3. Teste o fluxo completo: trial → planos → checkout
4. Verifique se o badge está mostrando corretamente após pagamento
