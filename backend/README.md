# Backend Nexus Wallet (Fastify + Prisma)

API REST implementando os 8 requisitos do teste prático Nexus.

Veja o **README principal** em `/app/README.md` para instruções completas.

## Scripts úteis

```bash
npm install
npx prisma db push   # sincroniza schema com o banco (db push)
npm run seed         # cria usuário demo@nexus.com / demo1234
npm run dev          # hot-reload em http://localhost:8002
npm run poc          # script POC validando CoinGecko + Redis + Ledger
npm run build && npm start  # build TS + run produção
```

## Variáveis de ambiente

Ver `.env` (template) — campos esperados:
- `DATABASE_URL`, `REDIS_URL`
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `ACCESS_TOKEN_TTL`, `REFRESH_TOKEN_TTL_DAYS`
- `COINGECKO_API_KEY`, `COINGECKO_BASE_URL`
- `SWAP_FEE_PERCENT`, `PORT`, `HOST`
