import type { FastifyReply, FastifyRequest } from "fastify";
import { verifyAccessToken } from "../lib/jwt";
import { Unauthorized } from "../utils/errors";

declare module "fastify" {
	interface FastifyRequest {
		user?: { id: string; email: string };
	}
}

export async function authGuard(req: FastifyRequest, _reply: FastifyReply) {
	const auth = req.headers.authorization;
	if (!auth?.toLowerCase().startsWith("bearer ")) {
		throw Unauthorized("Missing Authorization Bearer token");
	}
	const token = auth.slice(7).trim();
	try {
		const payload = verifyAccessToken(token);
		req.user = { id: payload.sub, email: payload.email };
	} catch {
		throw Unauthorized("Invalid or expired access token");
	}
}
