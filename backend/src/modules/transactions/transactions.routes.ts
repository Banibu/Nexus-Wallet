import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { Prisma, Transaction, Movement } from '@prisma/client';
import { authGuard } from '../../middlewares/auth';
import { prisma } from '../../config/prisma';
import { toDecimal } from '../../utils/decimal';

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  type: z.enum(['DEPOSIT', 'SWAP', 'WITHDRAWAL']).optional(),
});

export async function transactionsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authGuard);

  app.get('/', async (req) => {
    const q = querySchema.parse(req.query);

    const where: Prisma.TransactionWhereInput = { userId: req.user!.id };
    if (q.type) where.type = q.type;

    const [items, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (q.page - 1) * q.limit,
        take: q.limit,
      }),
      prisma.transaction.count({ where }),
    ]);

    return {
      page: q.page,
      limit: q.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / q.limit)),
      items: items.map((t: Transaction) => ({
        id: t.id,
        type: t.type,
        tokenFrom: t.tokenFrom,
        amountFrom: t.amountFrom ? toDecimal(t.amountFrom).toString() : null,
        tokenTo: t.tokenTo,
        amountTo: t.amountTo ? toDecimal(t.amountTo).toString() : null,
        feeAmount: t.feeAmount ? toDecimal(t.feeAmount).toString() : null,
        feeToken: t.feeToken,
        rate: t.rate ? toDecimal(t.rate).toString() : null,
        idempotencyKey: t.idempotencyKey,
        metadata: t.metadata,
        createdAt: t.createdAt.toISOString(),
      })),
    };
  });

  app.get('/:id', async (req) => {
    const params = z.object({ id: z.string().uuid() }).parse(req.params);
    const t = await prisma.transaction.findFirst({
      where: { id: params.id, userId: req.user!.id },
      include: { movements: { orderBy: { createdAt: 'asc' } } },
    });
    if (!t) return { error: 'NOT_FOUND' };
    return {
      id: t.id,
      type: t.type,
      tokenFrom: t.tokenFrom,
      amountFrom: t.amountFrom ? toDecimal(t.amountFrom).toString() : null,
      tokenTo: t.tokenTo,
      amountTo: t.amountTo ? toDecimal(t.amountTo).toString() : null,
      feeAmount: t.feeAmount ? toDecimal(t.feeAmount).toString() : null,
      feeToken: t.feeToken,
      rate: t.rate ? toDecimal(t.rate).toString() : null,
      metadata: t.metadata,
      createdAt: t.createdAt.toISOString(),
      movements: t.movements.map((m: Movement) => ({
        id: m.id,
        type: m.type,
        token: m.token,
        amount: toDecimal(m.amount).toString(),
        balanceBefore: toDecimal(m.balanceBefore).toString(),
        balanceAfter: toDecimal(m.balanceAfter).toString(),
        createdAt: m.createdAt.toISOString(),
      })),
    };
  });
}
