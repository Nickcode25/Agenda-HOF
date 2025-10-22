# 🎟️ Sistema de Cupons - Próximos Passos

## ✅ O que já foi feito:

1. ✅ Criado SQL para tabela de cupons (`/supabase-migrations/create-coupons-table.sql`)
2. ✅ Criada página de gerenciamento de cupons (`/src/pages/admin/CouponsManagement.tsx`)
3. ✅ Adicionado link no menu admin
4. ✅ Criadas funções de validação de cupom no Checkout
5. ✅ Criada documentação sobre cobrança recorrente (`/COBRANCA_RECORRENTE.md`)

---

## 🚀 O que você precisa fazer AGORA:

### 1. Executar migração SQL no Supabase

1. Acesse: https://supabase.com/dashboard/project/YOUR_PROJECT/editor
2. Copie todo o conteúdo do arquivo `/supabase-migrations/create-coupons-table.sql`
3. Cole no SQL Editor e clique em **RUN**

### 2. Criar função SQL para incrementar uso do cupom

Execute este SQL no Supabase:

```sql
CREATE OR REPLACE FUNCTION increment_coupon_usage(coupon_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE discount_coupons
  SET current_uses = current_uses + 1
  WHERE id = coupon_id;
END;
$$ LANGUAGE plpgsql;
```

### 3. Testar o sistema de cupons

1. Acesse o painel admin: http://localhost:5175/admin/login
2. Vá em **Cupons** no menu lateral
3. Crie um cupom de teste:
   - Código: `TESTE10`
   - Desconto: `10%`
   - Deixe os outros campos vazios (ilimitado)
   - Marque como ativo

### 4. Testar no checkout

1. Acesse: http://localhost:5175
2. Clique em "Começar Agora"
3. Preencha os dados de cadastro
4. Na página de checkout, digite `TESTE10` no campo de cupom
5. Clique em "Aplicar Cupom"
6. Verifique se o desconto foi aplicado

---

## 📋 Sistema de Cobrança Recorrente

Leia o arquivo `/COBRANCA_RECORRENTE.md` e escolha qual opção prefere:

- **Opção 1**: Assinatura Automática PagBank (mais complexo, mas automático)
- **Opção 2**: Renovação Manual (mais simples, recomendado para começar) ⭐
- **Opção 3**: Híbrida (melhor a longo prazo)

**Recomendação**: Comece com a **Opção 2** e depois migre para a **Opção 1**.

---

## 🐛 Resolver problema do token PagBank

O token atual ainda está retornando "unauthorized". Você precisa:

1. Acessar: https://pagseguro.uol.com.br/
2. Fazer login
3. Ir em **Integrações** > **Tokens**
4. Gerar um **novo token de produção**
5. Atualizar em `/backend/.env`:
   ```
   PAGBANK_TOKEN=SEU_NOVO_TOKEN_AQUI
   ```
6. Reiniciar o backend:
   ```bash
   cd /home/nicolas/Agenda-HOF/backend
   pkill -f "npm run dev"
   npm run dev
   ```

---

## 📊 Como funciona o sistema de cupons:

1. **Admin cria cupom** na página `/admin/coupons`
2. **Cliente insere código** no checkout
3. **Sistema valida cupom**:
   - Verifica se existe
   - Verifica se está ativo
   - Verifica data de validade
   - Verifica número de usos
4. **Aplica desconto** no valor final
5. **Registra uso** após pagamento bem-sucedido

---

## 🎨 Interface do campo de cupom (precisa ser adicionada)

O campo de cupom precisa ser adicionado no Checkout.tsx, logo antes do resumo de preço:

```tsx
{/* Campo de Cupom */}
<div className="bg-gray-700/30 rounded-lg p-4 mb-4">
  <div className="flex items-center gap-2 mb-3">
    <Tag className="w-4 h-4 text-orange-400" />
    <h3 className="text-sm font-semibold text-white">Cupom de Desconto</h3>
  </div>

  {!couponSuccess ? (
    <div className="flex gap-2">
      <input
        type="text"
        value={couponCode}
        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
        placeholder="Digite o código"
        className="flex-1 bg-gray-700/50 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm"
        disabled={couponLoading}
      />
      <button
        onClick={validateCoupon}
        disabled={couponLoading || !couponCode}
        className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
      >
        {couponLoading ? 'Validando...' : 'Aplicar'}
      </button>
    </div>
  ) : (
    <div className="flex items-center justify-between bg-green-500/10 border border-green-500/30 rounded-lg p-3">
      <div className="flex items-center gap-2">
        <Check className="w-4 h-4 text-green-400" />
        <div>
          <p className="text-sm font-medium text-white">{couponCode}</p>
          <p className="text-xs text-green-400">{couponDiscount}% de desconto aplicado</p>
        </div>
      </div>
      <button
        onClick={removeCoupon}
        className="text-red-400 hover:text-red-300 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )}

  {couponError && (
    <p className="text-red-400 text-xs mt-2">{couponError}</p>
  )}
</div>

{/* Resumo de preço com desconto */}
<div className="border-t border-gray-700 pt-4 space-y-2">
  {couponDiscount > 0 && (
    <>
      <div className="flex justify-between text-sm">
        <span className="text-gray-400">Subtotal:</span>
        <span className="text-gray-400">R$ {PLAN_PRICE.toFixed(2).replace('.', ',')}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-green-400">Desconto ({couponDiscount}%):</span>
        <span className="text-green-400">
          - R$ {(PLAN_PRICE * (couponDiscount / 100)).toFixed(2).replace('.', ',')}
        </span>
      </div>
    </>
  )}
  <div className="flex justify-between items-center text-lg font-bold">
    <span className="text-white">Total:</span>
    <span className="text-orange-400">
      R$ {finalPrice.toFixed(2).replace('.', ',')}/mês
    </span>
  </div>
</div>
```

---

## ❓ Dúvidas?

Se tiver qualquer dúvida, me avise! Estou aqui para ajudar.

**Prioridade**: Resolver o token do PagBank primeiro, depois testar cupons! 🚀
