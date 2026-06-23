import type { Balance } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { toDecimal } from "../../utils/decimal";
import { NotFound } from "../../utils/errors";

export async function getBalances(userId: string) {
	const wallet = await prisma.wallet.findUnique({
		where: { userId },
		include: { balances: { orderBy: { token: "asc" } } },
	});
	if (!wallet) throw NotFound("Wallet não encontrada");
	return {
		walletId: wallet.id,
		balances: wallet.balances.map((b: Balance) => ({
			token: b.token,
			amount: toDecimal(b.amount).toString(),
		})),
	};
}
