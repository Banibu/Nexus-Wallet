import { FastifyInstance } from 'fastify';
import { depositWebhookSchema } from './webhook.schemas';
import * as webhookService from './webhook.service';
import { verifyWebhookSignature } from '../../utils/crypto';
import { Unauthorized } from '../../utils/errors';
import { verifyAccessToken } from '../../lib/jwt';

export async function webhookRoutes(app: FastifyInstance) {
  app.post('/deposit', async (req, reply) => {
    let isSimulation = false;

    // Check if it's a simulated call by verifying the Authorization bearer token
    const auth = req.headers.authorization;
    if (auth && auth.toLowerCase().startsWith('bearer ')) {
      const token = auth.slice(7).trim();
      try {
        const payload = verifyAccessToken(token);
        // Verify token is valid and the user is depositing to their own account
        if (payload && payload.sub === (req.body as any)?.userId) {
          isSimulation = true;
        }
      } catch (err) {
        // Ignore invalid token and fall back to standard signature verification
      }
    }

    if (!isSimulation) {
      // If WEBHOOK_SECRET is set, enforce HMAC signature verification
      const secret = process.env.WEBHOOK_SECRET;
      if (secret) {
        const signature = req.headers['x-nexus-signature'] as string | undefined;
        const isValid = verifyWebhookSignature(req.body, signature, secret);
        if (!isValid) {
          throw Unauthorized('Assinatura de webhook inválida');
        }
      }
    }

    const dto = depositWebhookSchema.parse(req.body);
    const result = await webhookService.processDeposit(dto);
    return reply.code(result.status === 'duplicate' ? 200 : 201).send(result);
  });
}

