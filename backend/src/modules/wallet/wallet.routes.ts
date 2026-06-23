import type { FastifyInstance } from "fastify";
import { authGuard } from "../../middlewares/auth";
import * as walletService from "./wallet.service";

export async function walletRoutes(app: FastifyInstance) {
	app.addHook("preHandler", authGuard);

	app.get("/balances", async (req) => {
		return walletService.getBalances(req.user!.id);
	});
}
