import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
    env: {
      DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/nexus_wallet?schema=public",
      REDIS_URL: "redis://127.0.0.1:6379",
      JWT_ACCESS_SECRET: "mock-access-secret-key-for-testing-only-12345678",
      JWT_REFRESH_SECRET: "mock-refresh-secret-key-for-testing-only-12345678",
      COINGECKO_API_KEY: "mock-coingecko-key",
      COINGECKO_BASE_URL: "https://api.coingecko.com/api/v3",
      SWAP_FEE_PERCENT: "1.5",
    },
  },
});
