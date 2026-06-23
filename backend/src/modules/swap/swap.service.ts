import type { Balance, Prisma } from "@prisma/client";
import Decimal from "decimal.js";
import { env, isSupportedToken } from "../../config/env";
import { prisma } from "../../config/prisma";
import { getRate } from "../../lib/coingecko";
import { roundForToken, toDecimal, toPrismaDecimal } from "../../utils/decimal";
import { BadRequest, NotFound, Unprocessable } from "../../utils/errors";
import type { ExecuteDTO, QuoteDTO } from "./swap.schemas";

function assertTokens(from: string, to: string) {
	if (!isSupportedToken(from))
		throw BadRequest("TOKEN_NOT_SUPPORTED", `Token não suportado: ${from}`);
	if (!isSupportedToken(to))
		throw BadRequest("TOKEN_NOT_SUPPORTED", `Token não suportado: ${to}`);
	if (from === to)
		throw BadRequest("SAME_TOKEN", "fromToken e toToken devem ser diferentes");
}

export interface QuoteResult {
	fromToken: string;
	toToken: string;
	amountIn: string;
	feePercent: string;
	feeAmount: string;
	feeToken: string;
	amountInAfterFee: string;
	rate: string;
	amountOut: string;
	source: string;
	fetchedAt: string;
}

export async function quote(dto: QuoteDTO): Promise<QuoteResult> {
	assertTokens(dto.fromToken, dto.toToken);
	const amountIn = toDecimal(dto.amount);
	const { rate, source, fetchedAt } = await getRate(dto.fromToken, dto.toToken);

	// Calculate gross destination amount
	const amountOutGross = roundForToken(amountIn.times(rate), dto.toToken);

	// Calculate fee on destination token
	const feePercent = new Decimal(env.SWAP_FEE_PERCENT);
	const feeAmount = roundForToken(
		amountOutGross.times(feePercent).div(100),
		dto.toToken,
	);

	// Net destination amount received
	const amountOut = amountOutGross.minus(feeAmount);

	return {
		fromToken: dto.fromToken,
		toToken: dto.toToken,
		amountIn: amountIn.toString(),
		feePercent: feePercent.toString(),
		feeAmount: feeAmount.toString(),
		feeToken: dto.toToken,
		amountInAfterFee: amountIn.toString(),
		rate: rate.toString(),
		amountOut: amountOut.toString(),
		source,
		fetchedAt,
	};
}

export async function execute(userId: string, dto: ExecuteDTO) {
	assertTokens(dto.fromToken, dto.toToken);
	const q = await quote(dto);
	const amountIn = toDecimal(q.amountIn);
	const feeAmount = toDecimal(q.feeAmount);
	const amountOutNet = toDecimal(q.amountOut);
	const amountOutGross = amountOutNet.plus(feeAmount);

	const wallet = await prisma.wallet.findUnique({
		where: { userId },
	});
	if (!wallet) throw NotFound("Wallet não encontrada");

	const result = await prisma.$transaction(
		async (tx: Prisma.TransactionClient) => {
			// Sort tokens alphabetically to guarantee consistent locking order and prevent database deadlocks
			const tokensToLock = [dto.fromToken, dto.toToken].sort();
			const lockedBalances: Record<string, Balance> = {};

			for (const t of tokensToLock) {
				const rows = await tx.$queryRaw<Balance[]>`
        SELECT * FROM balances 
        WHERE "walletId" = ${wallet.id} AND token = ${t} 
        LIMIT 1 
        FOR UPDATE
      `;
				if (rows.length === 0) {
					throw NotFound(`Saldo de ${t} não encontrado`);
				}
				lockedBalances[t] = rows[0];
			}

			const balFromRecord = lockedBalances[dto.fromToken];
			const balToRecord = lockedBalances[dto.toToken];

			const balFromBefore = toDecimal(balFromRecord.amount);
			const balToBefore = toDecimal(balToRecord.amount);

			// Validate sufficient balance inside the locked transaction
			if (balFromBefore.lessThan(amountIn)) {
				throw Unprocessable(
					"INSUFFICIENT_BALANCE",
					`Saldo insuficiente em ${dto.fromToken}. Necessário ${amountIn.toString()}, disponível ${balFromBefore.toString()}.`,
				);
			}

			const balFromAfter = balFromBefore.minus(amountIn);
			const balToAfterFee = balToBefore.minus(feeAmount);
			const balToAfter = balToAfterFee.plus(amountOutGross);

			const transaction = await tx.transaction.create({
				data: {
					userId,
					type: "SWAP",
					tokenFrom: dto.fromToken,
					amountFrom: toPrismaDecimal(amountIn),
					tokenTo: dto.toToken,
					amountTo: toPrismaDecimal(amountOutNet),
					feeAmount: toPrismaDecimal(feeAmount),
					feeToken: dto.toToken,
					rate: toPrismaDecimal(toDecimal(q.rate)),
					metadata: {
						source: q.source,
						fetchedAt: q.fetchedAt,
						feePercent: q.feePercent,
					},
				},
			});

			const nowMs = Date.now();

			// Debit the source token from the user's wallet
			await tx.movement.create({
				data: {
					walletId: wallet.id,
					type: "SWAP_OUT",
					token: dto.fromToken,
					amount: toPrismaDecimal(amountIn.negated()),
					balanceBefore: toPrismaDecimal(balFromBefore),
					balanceAfter: toPrismaDecimal(balFromAfter),
					transactionId: transaction.id,
					createdAt: new Date(nowMs),
				},
			});

			// Debit the swap fee from the destination token balance
			await tx.movement.create({
				data: {
					walletId: wallet.id,
					type: "SWAP_FEE",
					token: dto.toToken,
					amount: toPrismaDecimal(feeAmount.negated()),
					balanceBefore: toPrismaDecimal(balToBefore),
					balanceAfter: toPrismaDecimal(balToAfterFee),
					transactionId: transaction.id,
					createdAt: new Date(nowMs + 1),
				},
			});

			// Credit the gross amount of the destination token
			await tx.movement.create({
				data: {
					walletId: wallet.id,
					type: "SWAP_IN",
					token: dto.toToken,
					amount: toPrismaDecimal(amountOutGross),
					balanceBefore: toPrismaDecimal(balToAfterFee),
					balanceAfter: toPrismaDecimal(balToAfter),
					transactionId: transaction.id,
					createdAt: new Date(nowMs + 2),
				},
			});

			// Update the locked balances in database
			await tx.balance.update({
				where: {
					walletId_token: { walletId: wallet.id, token: dto.fromToken },
				},
				data: { amount: toPrismaDecimal(balFromAfter) },
			});
			await tx.balance.update({
				where: { walletId_token: { walletId: wallet.id, token: dto.toToken } },
				data: { amount: toPrismaDecimal(balToAfter) },
			});

			return transaction;
		},
	);

	return {
		transactionId: result.id,
		fromToken: dto.fromToken,
		toToken: dto.toToken,
		amountIn: amountIn.toString(),
		feeAmount: feeAmount.toString(),
		feeToken: dto.toToken,
		amountOut: amountOutNet.toString(),
		rate: q.rate,
		source: q.source,
	};
}
