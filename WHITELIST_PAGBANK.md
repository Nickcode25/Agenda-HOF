# ⚠️ WHITELIST DO PAGBANK - URGENTE

## Problema Atual

O backend está retornando erro `ACCESS_DENIED - whitelist access required` do PagBank.

## URLs que DEVEM estar no Whitelist do PagBank

Você precisa adicionar **TODAS** estas URLs no whitelist do PagBank:

### 1. Backend Railway (PRODUÇÃO)
```
https://agenda-hof-production.up.railway.app
```

### 2. Frontend Vercel (ambas versões)
```
https://agendahof.com
https://www.agendahof.com
```

## Como Adicionar no PagBank

1. Acesse: https://pagseguro.uol.com.br/preferencias/integracoes.jhtml
2. Vá em **"Whitelist de IPs/URLs"** ou **"URLs Autorizadas"**
3. Adicione cada URL acima **UMA POR UMA**
4. Salve cada uma

## ⚠️ IMPORTANTE

- O PagBank pode demorar **alguns minutos** para propagar o whitelist
- Depois de adicionar, aguarde 5-10 minutos antes de testar novamente
- Se o erro persistir, verifique se as URLs foram salvas corretamente

## Verificação

Após adicionar, você pode verificar se está funcionando testando o pagamento em:
```
https://www.agendahof.com/checkout
```

## Status Atual

- ✅ CORS configurado no backend (aceita www e sem www)
- ✅ Cupons funcionando (PROMO95 aplicado com sucesso)
- ❌ **Pagamento bloqueado por whitelist do PagBank**

## Próximos Passos

1. ✅ Você já adicionou o backend Railway no whitelist
2. ⏳ Aguarde alguns minutos para propagar
3. 🔄 Teste novamente o pagamento
4. 📞 Se não funcionar, contate suporte do PagBank para confirmar whitelist

## Alternativa: Testar se é problema de whitelist

Execute este comando no terminal do Railway (se tiver acesso) para testar a API do PagBank:

```bash
curl -X POST https://api.pagseguro.com/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{"reference_id":"TEST"}'
```

Se retornar HTML (`<!DOCTYPE`) = problema de whitelist
Se retornar JSON com erro = token ok, whitelist ok
