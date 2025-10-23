# 🚀 Quick Start - Mercado Pago

## 1️⃣ Obter Credenciais

Acesse: https://www.mercadopago.com.br/developers/panel/credentials

Copie:
- **Public Key** (para o frontend)
- **Access Token** (para o backend)

⚠️ Use credenciais de **TESTE** durante desenvolvimento!

## 2️⃣ Configurar Variáveis

### Frontend: `.env`
```env
VITE_MERCADOPAGO_PUBLIC_KEY=TEST-sua-public-key
VITE_BACKEND_URL=http://localhost:3001
```

### Backend: `backend/.env`
```env
MERCADOPAGO_ACCESS_TOKEN=TEST-seu-access-token
FRONTEND_URL=http://localhost:5175
PORT=3001
NODE_ENV=development
```

## 3️⃣ Instalar Dependências

```bash
# Raiz do projeto
npm install

# Backend
cd backend
npm install mercadopago
```

## 4️⃣ Iniciar Servidores

### Terminal 1 - Backend
```bash
cd backend
npm start
```

### Terminal 2 - Frontend
```bash
npm run dev
```

## 5️⃣ Testar Pagamento

Acesse: http://localhost:5175

Use cartão de teste:
- **Número**: `5031 4332 1540 6351`
- **Titular**: Qualquer nome
- **Validade**: `12/25`
- **CVV**: `123`
- **CPF**: `12345678909`

## 📚 Documentação Completa

Veja: [docs/setup-guides/MERCADOPAGO_SETUP.md](docs/setup-guides/MERCADOPAGO_SETUP.md)

## 🆘 Problemas?

1. **SDK não carregado**: Verifique `index.html` tem o script do Mercado Pago
2. **Token inválido**: Copie o token completo (incluindo `TEST-`)
3. **Cartão recusado**: Use os cartões de teste oficiais
4. **Backend não inicia**: Verifique se `MERCADOPAGO_ACCESS_TOKEN` está configurado

---

✅ Pronto! Mercado Pago configurado e funcionando! 🎉
