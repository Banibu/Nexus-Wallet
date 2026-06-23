/// <reference types="node" />
/**
 * Seed script: creates demo user demo@nexus.com / demo1234 with realistic balances and transaction history.
 * Resets the demo user data if it already exists so that re-running guarantees a clean visual state.
 */
// In production, the src folder does not exist and variables are already injected by the container
try {
  require('../src/config/dotenv');
} catch (e) {
  // Ignore if not found
}
import { PrismaClient, MovementType, TransactionType } from '@prisma/client';
import bcrypt from 'bcryptjs';
import Decimal from 'decimal.js';

const prisma = new PrismaClient();
const SUPPORTED = ['BRL', 'USD', 'BTC', 'ETH', 'USDT'];

async function main() {
  const name = 'Demo User';
  const username = 'demouser';
  const email = 'demo@nexus.com';
  const password = 'Demo@1234!';

  // Delete existing demo user if exists to avoid conflicts and recreate clean mock history
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Seed: Deletando usuário demo anterior (id=${existing.id}) para reinicializar os dados mock.`);
    await prisma.user.delete({ where: { id: existing.id } });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  // 1. Create the user
  const user = await prisma.user.create({
    data: {
      name,
      username,
      email,
      passwordHash,
    },
  });

  // 2. Create the wallet
  const wallet = await prisma.wallet.create({
    data: {
      userId: user.id,
    },
  });

  // 3. Create the wallet balances matching the final state of the mock transactions
  const finalBalances = {
    BRL: new Decimal('10000.00'),
    USD: new Decimal('500.00'),
    BTC: new Decimal('0.045'),
    ETH: new Decimal('0.85'),
    USDT: new Decimal('350.00'),
  };

  await prisma.balance.createMany({
    data: SUPPORTED.map((token) => ({
      walletId: wallet.id,
      token,
      amount: finalBalances[token as keyof typeof finalBalances] || new Decimal('0'),
    })),
  });

  // 4. Create mock transaction history
  console.log('Seed: Gerando histórico de transações mock...');

  // Transaction 1: Deposit of 20,000.00 BRL (5 days ago)
  const tx1 = await prisma.transaction.create({
    data: {
      userId: user.id,
      type: TransactionType.DEPOSIT,
      tokenTo: 'BRL',
      amountTo: new Decimal('20000.00'),
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      movements: {
        create: {
          walletId: wallet.id,
          type: MovementType.DEPOSIT,
          token: 'BRL',
          amount: new Decimal('20000.00'),
          balanceBefore: new Decimal('0.00'),
          balanceAfter: new Decimal('20000.00'),
        },
      },
    },
  });

  // Transaction 2: Swap of 7,000.00 BRL to 0.045 BTC with 105.00 BRL fee (3 days ago)
  const tx2 = await prisma.transaction.create({
    data: {
      userId: user.id,
      type: TransactionType.SWAP,
      tokenFrom: 'BRL',
      amountFrom: new Decimal('7000.00'),
      tokenTo: 'BTC',
      amountTo: new Decimal('0.045'),
      feeAmount: new Decimal('105.00'),
      feeToken: 'BRL',
      rate: new Decimal('0.00000642'),
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      movements: {
        createMany: {
          data: [
            {
              walletId: wallet.id,
              type: MovementType.SWAP_OUT,
              token: 'BRL',
              amount: new Decimal('-7000.00'),
              balanceBefore: new Decimal('20000.00'),
              balanceAfter: new Decimal('13000.00'),
            },
            {
              walletId: wallet.id,
              type: MovementType.SWAP_FEE,
              token: 'BRL',
              amount: new Decimal('-105.00'),
              balanceBefore: new Decimal('13000.00'),
              balanceAfter: new Decimal('12895.00'),
            },
            {
              walletId: wallet.id,
              type: MovementType.SWAP_IN,
              token: 'BTC',
              amount: new Decimal('0.045'),
              balanceBefore: new Decimal('0.000'),
              balanceAfter: new Decimal('0.045'),
            },
          ],
        },
      },
    },
  });

  // Transaction 3: Swap of 2,850.00 BRL to 0.85 ETH with 42.75 BRL fee (2 days ago)
  const tx3 = await prisma.transaction.create({
    data: {
      userId: user.id,
      type: TransactionType.SWAP,
      tokenFrom: 'BRL',
      amountFrom: new Decimal('2850.00'),
      tokenTo: 'ETH',
      amountTo: new Decimal('0.85'),
      feeAmount: new Decimal('42.75'),
      feeToken: 'BRL',
      rate: new Decimal('0.000298'),
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      movements: {
        createMany: {
          data: [
            {
              walletId: wallet.id,
              type: MovementType.SWAP_OUT,
              token: 'BRL',
              amount: new Decimal('-2850.00'),
              balanceBefore: new Decimal('12895.00'),
              balanceAfter: new Decimal('10045.00'),
            },
            {
              walletId: wallet.id,
              type: MovementType.SWAP_FEE,
              token: 'BRL',
              amount: new Decimal('-42.75'),
              balanceBefore: new Decimal('10045.00'),
              balanceAfter: new Decimal('10002.25'),
            },
            {
              walletId: wallet.id,
              type: MovementType.SWAP_IN,
              token: 'ETH',
              amount: new Decimal('0.85'),
              balanceBefore: new Decimal('0.000'),
              balanceAfter: new Decimal('0.85'),
            },
          ],
        },
      },
    },
  });

  // Transaction 4: Withdrawal of 2.25 BRL (1 day ago)
  const tx4 = await prisma.transaction.create({
    data: {
      userId: user.id,
      type: TransactionType.WITHDRAWAL,
      tokenFrom: 'BRL',
      amountFrom: new Decimal('2.25'),
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      movements: {
        create: {
          walletId: wallet.id,
          type: MovementType.WITHDRAWAL,
          token: 'BRL',
          amount: new Decimal('-2.25'),
          balanceBefore: new Decimal('10002.25'),
          balanceAfter: new Decimal('10000.00'),
        },
      },
    },
  });

  // Transaction 5: Deposit of 350.00 USDT (12 hours ago)
  const tx5 = await prisma.transaction.create({
    data: {
      userId: user.id,
      type: TransactionType.DEPOSIT,
      tokenTo: 'USDT',
      amountTo: new Decimal('350.00'),
      createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
      movements: {
        create: {
          walletId: wallet.id,
          type: MovementType.DEPOSIT,
          token: 'USDT',
          amount: new Decimal('350.00'),
          balanceBefore: new Decimal('0.00'),
          balanceAfter: new Decimal('350.00'),
        },
      },
    },
  });

  console.log(`Seed: Criado usuário ${email} / ${password} (id=${user.id}) com sucesso.`);
  console.log(`Balances criados: BRL=10000, BTC=0.045, ETH=0.85, USDT=350.`);
  console.log(`Total de transações criadas: 5.`);
}

main()
  .catch((e) => {
    console.error('Seed FAILED:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
