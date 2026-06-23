import { prisma } from '../../config/prisma';
import { Prisma, Balance } from '@prisma/client';
import { isSupportedToken } from '../../config/env';
import { NotFound, Unprocessable } from '../../utils/errors';
import { toDecimal, toPrismaDecimal } from '../../utils/decimal';
import { WithdrawalDTO } from './withdrawal.schemas';

export async function requestWithdrawal(userId: string, dto: WithdrawalDTO) {
  if (!isSupportedToken(dto.token)) {
    throw Unprocessable('TOKEN_NOT_SUPPORTED', `Token não suportado: ${dto.token}`);
  }

  const wallet = await prisma.wallet.findUnique({
    where: { userId },
    include: { balances: true },
  });
  if (!wallet) throw NotFound('Wallet não encontrada');
  
  const amount = toDecimal(dto.amount);

  const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // Acquire a database lock on the specific balance row to prevent concurrent double-withdrawals
    const lockedBalances = await tx.$queryRaw<Balance[]>`
      SELECT * FROM balances 
      WHERE "walletId" = ${wallet.id} AND token = ${dto.token} 
      LIMIT 1 
      FOR UPDATE
    `;
    if (lockedBalances.length === 0) {
      throw NotFound(`Saldo de ${dto.token} não encontrado`);
    }

    const balanceRecord = lockedBalances[0];
    const before = toDecimal(balanceRecord.amount);

    // Validate balance against the locked record inside the transaction block
    if (before.lessThan(amount)) {
      throw Unprocessable(
        'INSUFFICIENT_BALANCE',
        `Saldo insuficiente em ${dto.token}. Necessário ${amount.toString()}, disponível ${before.toString()}.`,
      );
    }
    const after = before.minus(amount);

    const transaction = await tx.transaction.create({
      data: {
        userId,
        type: 'WITHDRAWAL',
        tokenFrom: dto.token,
        amountFrom: toPrismaDecimal(amount),
        metadata: dto.destinationAddress ? { destinationAddress: dto.destinationAddress } : undefined,
      },
    });

    await tx.balance.update({
      where: { walletId_token: { walletId: wallet.id, token: dto.token } },
      data: { amount: toPrismaDecimal(after) },
    });

    const movement = await tx.movement.create({
      data: {
        walletId: wallet.id,
        type: 'WITHDRAWAL',
        token: dto.token,
        amount: toPrismaDecimal(amount.negated()),
        balanceBefore: toPrismaDecimal(before),
        balanceAfter: toPrismaDecimal(after),
        transactionId: transaction.id,
      },
    });

    return { transaction, movement, before, after };
  });

  return {
    status: 'ok',
    transactionId: result.transaction.id,
    token: dto.token,
    amount: amount.toString(),
    balanceBefore: result.before.toString(),
    balanceAfter: result.after.toString(),
    destinationAddress: dto.destinationAddress || null,
  };
}
