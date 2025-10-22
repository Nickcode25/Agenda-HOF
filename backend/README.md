# Backend - Agenda HOF

Backend para integração com PagBank (processamento de pagamentos).

## 🚀 Instalação

```bash
cd backend
npm install
```

## ⚙️ Configuração

1. O arquivo `.env` já está configurado com seu token do PagBank
2. Verifique se o `FRONTEND_URL` está correto (padrão: http://localhost:5175)

## 🏃 Executar

### Desenvolvimento
```bash
npm run dev
```

### Produção
```bash
npm start
```

O servidor irá rodar em `http://localhost:3001`

## 📡 Endpoints

- `GET /health` - Health check
- `POST /api/pagbank/create-pix` - Criar pedido PIX
- `POST /api/pagbank/create-card-charge` - Processar cartão
- `POST /api/pagbank/create-boleto` - Gerar boleto
- `GET /api/pagbank/check-status/:orderId` - Verificar status

## 🔐 Segurança

- O token do PagBank fica seguro no backend
- CORS configurado apenas para seu frontend
- Todas as requisições são validadas

## 📦 Deploy

Para deploy em produção (Heroku, Railway, Vercel, etc.):

1. Configure as variáveis de ambiente no painel
2. Mude `NODE_ENV=production`
3. Use o token de PRODUÇÃO do PagBank
4. Atualize `FRONTEND_URL` com seu domínio real
