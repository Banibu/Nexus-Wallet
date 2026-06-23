import './dotenv';

function must(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (!v) throw new Error(`Missing env var ${name}`);
  return v;
}

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  HOST: process.env.HOST || '127.0.0.1',
  PORT: parseInt(process.env.PORT || '8002', 10),

  DATABASE_URL: must('DATABASE_URL'),
  REDIS_URL: must('REDIS_URL', 'redis://127.0.0.1:6379'),

  JWT_ACCESS_SECRET: must('JWT_ACCESS_SECRET'),
  JWT_REFRESH_SECRET: must('JWT_REFRESH_SECRET'),
  ACCESS_TOKEN_TTL: process.env.ACCESS_TOKEN_TTL || '15m',
  REFRESH_TOKEN_TTL_DAYS: parseInt(process.env.REFRESH_TOKEN_TTL_DAYS || '7', 10),

  COINGECKO_API_KEY: must('COINGECKO_API_KEY'),
  COINGECKO_BASE_URL: process.env.COINGECKO_BASE_URL || 'https://api.coingecko.com/api/v3',

  SWAP_FEE_PERCENT: parseFloat(process.env.SWAP_FEE_PERCENT || '1.5'),

  SUPPORTED_TOKENS: ['BRL', 'BTC', 'ETH', 'USDT'] as const,
};

export type SupportedToken = (typeof env.SUPPORTED_TOKENS)[number];
export const isSupportedToken = (t: string): t is SupportedToken =>
  (env.SUPPORTED_TOKENS as readonly string[]).includes(t);
