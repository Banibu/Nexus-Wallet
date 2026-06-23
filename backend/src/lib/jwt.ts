import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface AccessPayload {
  sub: string; // userId
  email: string;
}

export interface RefreshPayload {
  sub: string;
  jti: string;
}

export const signAccessToken = (payload: AccessPayload) =>
  jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    algorithm: 'HS256',
    expiresIn: env.ACCESS_TOKEN_TTL as any,
  });

export const signRefreshToken = (payload: RefreshPayload) =>
  jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    algorithm: 'HS256',
    expiresIn: `${env.REFRESH_TOKEN_TTL_DAYS}d`,
  });

export const verifyAccessToken = (token: string): AccessPayload => {
  return jwt.verify(token, env.JWT_ACCESS_SECRET, { algorithms: ['HS256'] }) as AccessPayload;
};

export const verifyRefreshToken = (token: string): RefreshPayload => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET, { algorithms: ['HS256'] }) as RefreshPayload;
};
