import type { Movement, MovementType, Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { toDecimal } from "../../utils/decimal";
import { NotFound } from "../../utils/errors";

export interface ListParams {
	page: number;
	limit: number;
	token?: string;
	type?: string;
}

export async function listMovements(userId: string, params: ListParams) {
	const wallet = await prisma.wallet.findUnique({ where: { userId } });
	if (!wallet) throw NotFound("Wallet não encontrada");

	const where: Prisma.MovementWhereInput = { walletId: wallet.id };
	if (params.token) where.token = params.token.toUpperCase();
	if (params.type) where.type = params.type.toUpperCase() as MovementType;

	const [items, total] = await Promise.all([
		prisma.movement.findMany({
			where,
			orderBy: [{ createdAt: "desc" }, { id: "desc" }],
			skip: (params.page - 1) * params.limit,
			take: params.limit,
		}),
		prisma.movement.count({ where }),
	]);

	return {
		page: params.page,
		limit: params.limit,
		total,
		totalPages: Math.max(1, Math.ceil(total / params.limit)),
		items: items.map((m: Movement) => ({
			id: m.id,
			type: m.type,
			token: m.token,
			amount: toDecimal(m.amount).toString(),
			balanceBefore: toDecimal(m.balanceBefore).toString(),
			balanceAfter: toDecimal(m.balanceAfter).toString(),
			transactionId: m.transactionId,
			createdAt: m.createdAt.toISOString(),
		})),
	};
}

export async function reconstructBalance(userId: string, token: string) {
	const wallet = await prisma.wallet.findUnique({ where: { userId } });
	if (!wallet) throw NotFound("Wallet não encontrada");
	const sum = await prisma.movement.aggregate({
		where: { walletId: wallet.id, token: token.toUpperCase() },
		_sum: { amount: true },
	});
	const reconstructed = toDecimal(sum._sum.amount ?? 0).toString();
	const balance = await prisma.balance.findUnique({
		where: {
			walletId_token: { walletId: wallet.id, token: token.toUpperCase() },
		},
	});
	return {
		token: token.toUpperCase(),
		reconstructed,
		stored: balance ? toDecimal(balance.amount).toString() : "0",
		consistent: balance
			? toDecimal(balance.amount).eq(toDecimal(reconstructed))
			: false,
	};
}
