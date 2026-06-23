import { FastifyInstance } from 'fastify';
import { registerSchema, loginSchema, refreshSchema } from './auth.schemas';
import * as authService from './auth.service';
import { authGuard } from '../../middlewares/auth';

export async function authRoutes(app: FastifyInstance) {
  app.post('/register', async (req, reply) => {
    const dto = registerSchema.parse(req.body);
    const result = await authService.register(dto);
    
    reply.setCookie('refreshToken', result.refreshToken, {
      path: '/api/auth',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return reply.code(201).send(result);
  });

  app.post('/login', async (req, reply) => {
    const dto = loginSchema.parse(req.body);
    const result = await authService.login(dto);

    reply.setCookie('refreshToken', result.refreshToken, {
      path: '/api/auth',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return reply.send(result);
  });

  app.post('/refresh', async (req, reply) => {
    // Attempt to read from HTTPOnly cookie first, fallback to request body
    let refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      const dto = refreshSchema.parse(req.body);
      refreshToken = dto.refreshToken;
    }
    
    const result = await authService.refresh(refreshToken);

    reply.setCookie('refreshToken', result.refreshToken, {
      path: '/api/auth',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return reply.send(result);
  });

  app.post('/logout', { preHandler: authGuard }, async (req, reply) => {
    await authService.logout(req.user!.id);
    
    reply.clearCookie('refreshToken', {
      path: '/api/auth',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    return reply.send({ ok: true });
  });

  app.get('/me', { preHandler: authGuard }, async (req) => {
    return { user: req.user };
  });
}
