import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { authGuard } from "../../middlewares/auth";
import * as ledgerService from "./ledger.service";

const querySchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(100).default(20),
	token: z.string().optional(),
	type: z.string().optional(),
});

export async function ledgerRoutes(app: FastifyInstance) {
	app.addHook("preHandler", authGuard);

	app.get("/movements", async (req) => {
		const q = querySchema.parse(req.query);
		return ledgerService.listMovements(req.user!.id, q);
	});

	app.get("/reconcile/:token", async (req) => {
		const params = z.object({ token: z.string() }).parse(req.params);
		return ledgerService.reconstructBalance(req.user!.id, params.token);
	});
}
