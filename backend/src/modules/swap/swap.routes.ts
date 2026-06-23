import { FastifyInstance } from 'fastify';
import { authGuard } from '../../middlewares/auth';
import { quoteSchema, executeSchema } from './swap.schemas';
import * as swapService from './swap.service';

export async function swapRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authGuard);

  app.get('/quote', async (req) => {
    const dto = quoteSchema.parse(req.query);
    return swapService.quote(dto);
  });

  app.post('/execute', async (req) => {
    const dto = executeSchema.parse(req.body);
    return swapService.execute(req.user!.id, dto);
  });
}
