import { type Balance, Prisma } from "@prisma/client";
import { isSupportedToken } from "../../config/env";
import { prisma } from "../../config/prisma";
import { toDecimal, toPrismaDecimal } from "../../utils/decimal";
import { BadRequest, NotFound } from "../../utils/errors";
import type { DepositWebhookDTO } from "./webhook.schemas";

export async function processDeposit(dto: DepositWebhookDTO) {
	const token = dto.token.toUpperCase();
	if (!isSupportedToken(token)) {
		throw BadRequest(
			"TOKEN_NOT_SUPPORTED",
			`Token não suportado: ${token}. Use BRL, USD, BTC, ETH ou USDT.`,
		);
	}

	// Pre-check idempotency key to avoid unnecessary database locks on duplicates
	const existing = await prisma.transaction.findUnique({
		where: { idempotencyKey: dto.idempotencyKey },
	});

	if (existing) {
		const amountMatches = existing.amountTo
			? toDecimal(existing.amountTo).equals(toDecimal(dto.amount))
			: false;
		if (
			existing.userId !== dto.userId ||
			existing.tokenTo !== token ||
			!amountMatches ||
			existing.type !== "DEPOSIT"
		) {
			throw BadRequest(
				"IDEMPOTENCY_CONFLICT",
				"Chave de idempotência já utilizada com parâmetros diferentes.",
			);
		}

		return {
			status: "duplicate",
			transactionId: existing.id,
			message: "idempotencyKey já processada (no-op)",
		};
	}

	const user = await prisma.user.findUnique({
		where: { id: dto.userId },
		include: { wallet: { include: { balances: true } } },
	});

	if (!user) throw NotFound("Usuário não encontrado");
	if (!user.wallet) throw NotFound("Carteira não encontrada");

	const balance = user.wallet.balances.find((b: Balance) => b.token === token);
	if (!balance) throw NotFound(`Saldo do token ${token} não encontrado`);

	const amount = toDecimal(dto.amount);

	try {
		const result = await prisma.$transaction(
			async (tx: Prisma.TransactionClient) => {
				// Lock the specific balance row to handle concurrent deposits and ensure exact ledger balance auditability
				const lockedBalances = await tx.$queryRaw<Balance[]>`
        SELECT * FROM balances 
        WHERE "walletId" = ${user.wallet!.id} AND token = ${token} 
        LIMIT 1 
        FOR UPDATE
      `;

				if (lockedBalances.length === 0) {
					throw NotFound(`Saldo do token ${token} não encontrado`);
				}

				const balanceRecord = lockedBalances[0];
				const before = toDecimal(balanceRecord.amount);
				const after = before.plus(amount);

				const transaction = await tx.transaction.create({
					data: {
						userId: user.id,
						type: "DEPOSIT",
						tokenTo: token,
						amountTo: toPrismaDecimal(amount),
						idempotencyKey: dto.idempotencyKey,
					},
				});

				await tx.balance.update({
					where: { walletId_token: { walletId: user.wallet!.id, token } },
					data: { amount: toPrismaDecimal(after) },
				});

				const movement = await tx.movement.create({
					data: {
						walletId: user.wallet!.id,
						type: "DEPOSIT",
						token,
						amount: toPrismaDecimal(amount),
						balanceBefore: toPrismaDecimal(before),
						balanceAfter: toPrismaDecimal(after),
						transactionId: transaction.id,
					},
				});

				return { transaction, movement, before, after };
			},
		);

		return {
			status: "ok",
			transactionId: result.transaction.id,
			movementId: result.movement.id,
			token,
			amount: amount.toString(),
			balanceBefore: result.before.toString(),
			balanceAfter: result.after.toString(),
		};
	} catch (e: unknown) {
		// Handle potential concurrent race condition on duplicate webhook submittals
		if (
			e instanceof Prisma.PrismaClientKnownRequestError &&
			e.code === "P2002"
		) {
			const ex = await prisma.transaction.findUnique({
				where: { idempotencyKey: dto.idempotencyKey },
			});
			if (ex)
				return {
					status: "duplicate",
					transactionId: ex.id,
					message: "race resolved",
				};
		}
		throw e;
	}
}
