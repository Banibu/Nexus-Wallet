import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import cookie from '@fastify/cookie';
import { ZodError } from 'zod';
import { AppError } from './utils/errors';
import { authRoutes } from './modules/auth/auth.routes';
import { walletRoutes } from './modules/wallet/wallet.routes';
import { webhookRoutes } from './modules/webhook/webhook.routes';
import { swapRoutes } from './modules/swap/swap.routes';
import { withdrawalRoutes } from './modules/withdrawal/withdrawal.routes';
import { ledgerRoutes } from './modules/ledger/ledger.routes';
import { transactionsRoutes } from './modules/transactions/transactions.routes';

export function buildApp(): FastifyInstance {
  const app = Fastify({
    logger: {
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      transport:
        process.env.NODE_ENV === 'production'
          ? undefined
          : {
              target: 'pino-pretty',
              options: { colorize: true, translateTime: 'HH:MM:ss', ignore: 'pid,hostname' },
            },
    },
  });

  app.register(cors, {
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  });
  app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });
  app.register(cookie);

  app.setErrorHandler((err: Error & { statusCode?: number; code?: string; details?: unknown }, _req, reply) => {
    if (err instanceof ZodError) {
      return reply.code(400).send({
        error: { code: 'VALIDATION_ERROR', message: 'Erro de validação', issues: err.issues },
      });
    }
    if (err instanceof AppError) {
      return reply.code(err.statusCode).send({
        error: { code: err.code, message: err.message, details: err.details },
      });
    }
    app.log.error(err);
    return reply.code(err.statusCode || 500).send({
      error: { code: 'INTERNAL_ERROR', message: err.message || 'Erro interno' },
    });
  });

  // health check (both /health and /api/health for proxy)
  app.get('/health', async () => ({ status: 'ok', service: 'nexus-wallet-api' }));



  // All routes under /api
  app.register(
    async (api) => {
      api.get('/health', async () => ({ status: 'ok', service: 'nexus-wallet-api' }));
      api.register(authRoutes, { prefix: '/auth' });
      api.register(walletRoutes, { prefix: '/wallet' });
      api.register(webhookRoutes, { prefix: '/webhooks' });
      api.register(swapRoutes, { prefix: '/swaps' });
      api.register(withdrawalRoutes, { prefix: '/withdrawals' });
      api.register(ledgerRoutes, { prefix: '/ledger' });
      api.register(transactionsRoutes, { prefix: '/transactions' });
    },
    { prefix: '/api' },
  );

  return app;
}
