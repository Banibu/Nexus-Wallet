import { prisma } from '../../config/prisma';
import { env } from '../../config/env';
import { hashPassword, verifyPassword, sha256 } from '../../lib/hash';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../lib/jwt';
import { BadRequest, Conflict, Unauthorized } from '../../utils/errors';
import { v4 as uuid } from 'uuid';
import { LoginDTO, RegisterDTO } from './auth.schemas';

export async function register(dto: RegisterDTO) {
  const existing = await prisma.user.findUnique({ where: { email: dto.email } });
  if (existing) throw Conflict('EMAIL_TAKEN', 'Email já cadastrado');

  const passwordHash = await hashPassword(dto.password);
  const user = await prisma.user.create({
    data: {
      email: dto.email,
      passwordHash,
      wallet: {
        create: {
          balances: {
            create: env.SUPPORTED_TOKENS.map((t) => ({ token: t, amount: 0 })),
          },
        },
      },
    },
    include: { wallet: { include: { balances: true } } },
  });

  const tokens = await issueTokens(user.id, user.email);
  return { user: { id: user.id, email: user.email, createdAt: user.createdAt }, ...tokens };
}

export async function login(dto: LoginDTO) {
  const user = await prisma.user.findUnique({ where: { email: dto.email } });
  if (!user) throw Unauthorized('Credenciais inválidas');
  const ok = await verifyPassword(dto.password, user.passwordHash);
  if (!ok) throw Unauthorized('Credenciais inválidas');
  const tokens = await issueTokens(user.id, user.email);
  return { user: { id: user.id, email: user.email, createdAt: user.createdAt }, ...tokens };
}

export async function issueTokens(userId: string, email: string) {
  const access = signAccessToken({ sub: userId, email });
  const jti = uuid();
  const refresh = signRefreshToken({ sub: userId, jti });
  const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
  await prisma.refreshToken.create({
    data: { id: jti, userId, tokenHash: sha256(refresh), expiresAt },
  });
  return { accessToken: access, refreshToken: refresh };
}

export async function refresh(refreshToken: string) {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw Unauthorized('Refresh token inválido');
  }
  const record = await prisma.refreshToken.findUnique({ where: { id: payload.jti } });
  if (!record || record.revoked) throw Unauthorized('Refresh token revogado');
  if (record.tokenHash !== sha256(refreshToken)) throw Unauthorized('Refresh token incompatível');
  if (record.expiresAt < new Date()) throw Unauthorized('Refresh token expirado');
  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) throw Unauthorized('Usuário inexistente');
  // rotate
  await prisma.refreshToken.update({ where: { id: record.id }, data: { revoked: true } });
  const tokens = await issueTokens(user.id, user.email);
  return { user: { id: user.id, email: user.email }, ...tokens };
}

export async function logout(userId: string) {
  await prisma.refreshToken.updateMany({ where: { userId, revoked: false }, data: { revoked: true } });
}
