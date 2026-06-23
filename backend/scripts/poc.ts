/**
 * POC Script - Validates ALL core integrations in isolation BEFORE building the app.
 *
 * Tests:
 *   1) Prisma connection to PostgreSQL
 *   2) Redis connection (ioredis)
 *   3) CoinGecko API (with demo key) — fetch BTC + ETH price in BRL
 *   4) Redis cache hit/miss for quotes (TTL ~30s)
 *   5) Ledger consistency: create movements + reconstruct balance by SUM(amount)
 *
 * Run: yarn poc
 */
import 'dotenv/config';
import { PrismaClient, Prisma } from '@prisma/client';
import Redis from 'ioredis';
import axios from 'axios';
import Decimal from 'decimal.js';

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL!, { lazyConnect: false });

const CG_KEY = process.env.COINGECKO_API_KEY!;
const CG_URL = process.env.COINGECKO_BASE_URL!;

async function step(name: string, fn: () => Promise<void>) {
  const t0 = Date.now();
  try {
    await fn();
    console.log(`\u2705 [${Date.now() - t0}ms] ${name}`);
  } catch (e: any) {
    console.error(`\u274c [${Date.now() - t0}ms] ${name}: ${e?.message || e}`);
    throw e;
  }
}

async function testPrisma() {
  const r = await prisma.$queryRaw<{ now: Date }[]>`SELECT NOW() as now`;
  if (!r?.[0]?.now) throw new Error('No NOW() result');
}

async function testRedis() {
  await redis.set('nexus:poc:ping', 'pong', 'EX', 10);
  const v = await redis.get('nexus:poc:ping');
  if (v !== 'pong') throw new Error('Redis roundtrip failed');
}

async function fetchCoinGeckoPrices() {
  const url = `${CG_URL}/simple/price`;
  const res = await axios.get(url, {
    params: { ids: 'bitcoin,ethereum', vs_currencies: 'brl,usd' },
    headers: { 'x-cg-demo-api-key': CG_KEY, accept: 'application/json' },
    timeout: 15000,
  });
  const data = res.data;
  console.log('   CoinGecko response:', JSON.stringify(data));
  if (!data?.bitcoin?.brl || !data?.ethereum?.brl) {
    throw new Error('Missing prices in response: ' + JSON.stringify(data));
  }
  return data;
}

async function testCoinGeckoCache() {
  const cacheKey = 'nexus:quote:btc:brl';
  await redis.del(cacheKey);

  // Miss → fetch
  let cached = await redis.get(cacheKey);
  if (cached) throw new Error('expected MISS');
  const data = await fetchCoinGeckoPrices();
  await redis.set(cacheKey, JSON.stringify(data), 'EX', 30);
  console.log('   Cached with TTL=30s');

  // Hit
  cached = await redis.get(cacheKey);
  if (!cached) throw new Error('expected HIT after set');
  const parsed = JSON.parse(cached);
  if (!parsed?.bitcoin?.brl) throw new Error('cache deserialization broken');
  console.log(`   Cache HIT - BTC=${parsed.bitcoin.brl} BRL, ETH=${parsed.ethereum.brl} BRL`);
}

async function testLedgerReconstruction() {
  // Create a temp user + wallet, insert 3 movements, then reconstruct balance.
  const email = `poc+${Date.now()}@nexus.local`;
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: 'poc',
      wallet: { create: {} },
    },
    include: { wallet: true },
  });
  const walletId = user.wallet!.id;

  // Create balance row
  await prisma.balance.create({ data: { walletId, token: 'BTC', amount: new Prisma.Decimal(0) } });

  // Insert 3 movements transactionally: +0.5, -0.1, +0.05  => 0.45
  await prisma.$transaction(async (tx) => {
    let bal = new Decimal(0);
    const deltas = [new Decimal('0.5'), new Decimal('-0.1'), new Decimal('0.05')];
    const types: any[] = ['DEPOSIT', 'WITHDRAWAL', 'DEPOSIT'];
    for (let i = 0; i < deltas.length; i++) {
      const before = bal;
      const after = bal.plus(deltas[i]);
      bal = after;
      await tx.movement.create({
        data: {
          walletId,
          type: types[i],
          token: 'BTC',
          amount: new Prisma.Decimal(deltas[i].toString()),
          balanceBefore: new Prisma.Decimal(before.toString()),
          balanceAfter: new Prisma.Decimal(after.toString()),
        },
      });
    }
    await tx.balance.update({
      where: { walletId_token: { walletId, token: 'BTC' } },
      data: { amount: new Prisma.Decimal(bal.toString()) },
    });
  });

  // Reconstruct by SUM(amount) WHERE walletId, token
  const movs = await prisma.movement.findMany({ where: { walletId, token: 'BTC' } });
  const sum = movs.reduce((acc, m) => acc.plus(new Decimal(m.amount.toString())), new Decimal(0));
  const stored = await prisma.balance.findUnique({
    where: { walletId_token: { walletId, token: 'BTC' } },
  });
  const storedDec = new Decimal(stored!.amount.toString());
  console.log(`   Reconstructed=${sum.toString()} | Stored=${storedDec.toString()}`);
  if (!sum.eq(storedDec)) throw new Error('Ledger reconstruction mismatch!');
  if (!sum.eq(new Decimal('0.45'))) throw new Error('Expected 0.45');

  // Cleanup
  await prisma.user.delete({ where: { id: user.id } });
}

async function main() {
  console.log('==> Nexus POC starting...\n');
  await step('1) Prisma -> PostgreSQL connection', testPrisma);
  await step('2) Redis connectivity', testRedis);
  await step('3) CoinGecko (demo key) + Redis cache miss/hit', testCoinGeckoCache);
  await step('4) Ledger movements + reconstruct balance', testLedgerReconstruction);
  console.log('\n\u2705 ALL POC CHECKS PASSED');
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await redis.quit();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error('POC FAILED:', e);
    await prisma.$disconnect();
    await redis.quit();
    process.exit(1);
  });
