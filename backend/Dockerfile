# Backend Build stage
FROM node:22-alpine AS backend-builder
RUN apk add --no-cache openssl
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install
COPY backend/ ./
RUN npx prisma generate
RUN npm run build && npx tsc -p tsconfig.seed.json

# Production stage
FROM node:22-alpine
# Upgrade alpine packages to resolve CVEs / security vulnerabilities
RUN apk update && apk upgrade --no-cache && apk add --no-cache openssl
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --omit=dev --legacy-peer-deps
COPY --from=backend-builder /app/backend/dist ./dist
COPY --from=backend-builder /app/backend/prisma ./prisma
COPY --from=backend-builder /app/backend/node_modules/.prisma ./node_modules/.prisma

ENV PORT=8002
ENV HOST=0.0.0.0
ENV NODE_ENV=production

EXPOSE 8002

# Run migrations and start Fastify API
CMD ["sh", "-c", "npx prisma db push --accept-data-loss || (npx prisma db push --force-reset && node dist/prisma/seed.js) && node dist/server.js"]
