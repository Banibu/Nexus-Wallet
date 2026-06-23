import { FastifyInstance } from 'fastify';
import { authGuard } from '../../middlewares/auth';
import { withdrawalSchema } from './withdrawal.schemas';
import * as withdrawalService from './withdrawal.service';

export async function withdrawalRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authGuard);

  app.post('/', async (req, reply) => {
    const dto = withdrawalSchema.parse(req.body);
    const result = await withdrawalService.requestWithdrawal(req.user!.id, dto);
    return reply.code(201).send(result);
  });
}
