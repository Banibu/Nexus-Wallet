import type { FastifyInstance, FastifyReply } from "fastify";
import { prisma } from "../../config/prisma";
import { authGuard } from "../../middlewares/auth";
import { Unauthorized } from "../../utils/errors";
import {
	checkEmailSchema,
	disable2FASchema,
	enable2FASchema,
	login2FASchema,
	loginSchema,
	loginTotpSchema,
	refreshSchema,
	registerSchema,
} from "./auth.schemas";
import * as authService from "./auth.service";

// ─── Cookie Helpers ───────────────────────────────────────────────────────────

const IS_PRODUCTION = process.env.NODE_ENV === "production";

/** Seconds in common durations */
const COOKIE_TTL = {
	refreshToken: 7 * 24 * 60 * 60, // 7 days
	trustedDevice: 30 * 24 * 60 * 60, // 30 days
} as const;

const REFRESH_COOKIE_OPTIONS = {
	path: "/api/auth",
	httpOnly: true,
	secure: IS_PRODUCTION,
	sameSite: "lax" as const,
};

/**
 * Sets the refresh token cookie and, when the user chose "remember device",
 * also sets a long-lived trusted_device cookie so subsequent 2FA logins are
 * skipped for this browser.
 */
function setSessionCookies(
	reply: FastifyReply,
	refreshToken: string,
	remember?: boolean,
): void {
	reply.setCookie("refreshToken", refreshToken, {
		...REFRESH_COOKIE_OPTIONS,
		maxAge: COOKIE_TTL.refreshToken,
	});

	if (remember) {
		reply.setCookie("trusted_device", "true", {
			...REFRESH_COOKIE_OPTIONS,
			maxAge: COOKIE_TTL.trustedDevice,
		});
	}
}

// ─── Routes ───────────────────────────────────────────────────────────────────

export async function authRoutes(app: FastifyInstance) {
	// ── Public: Email Check ──────────────────────────────────────────────────
	// Returns whether the given email has 2FA active. Used by the login UI to
	// decide which step to show (password or TOTP code).
	app.post("/check-email", async (req, reply) => {
		const { email } = checkEmailSchema.parse(req.body);
		const result = await authService.checkEmail(email);
		return reply.send(result);
	});

	// ── Public: Registration ─────────────────────────────────────────────────
	app.post("/register", async (req, reply) => {
		const dto = registerSchema.parse(req.body);
		const result = await authService.register(dto);

		setSessionCookies(reply, result.refreshToken);
		return reply.code(201).send(result);
	});

	// ── Public: Password Login ───────────────────────────────────────────────
	// If the user has 2FA enabled and no trusted device cookie, this returns
	// `requires2FA: true` with a short-lived `tempToken`. The client must then
	// call /login/2fa to complete the flow.
	app.post("/login", async (req, reply) => {
		const dto = loginSchema.parse(req.body);
		const hasTrustedDevice = req.cookies.trusted_device === "true";
		const result = await authService.login(dto, hasTrustedDevice);

		if (!result.requires2FA) {
			setSessionCookies(reply, result.refreshToken, result.remember);
		}

		return reply.send(result);
	});

	// ── Public: TOTP Login (Passwordless) ───────────────────────────────────
	// Allows users with 2FA to log in using only their email + authenticator code.
	app.post("/login/totp", async (req, reply) => {
		const dto = loginTotpSchema.parse(req.body);
		const result = await authService.loginTotp(dto);

		setSessionCookies(reply, result.refreshToken, result.remember);
		return reply.send(result);
	});

	// ── Public: 2FA Second Step ──────────────────────────────────────────────
	// Exchanges a short-lived tempToken + TOTP code for full session tokens.
	app.post("/login/2fa", async (req, reply) => {
		const dto = login2FASchema.parse(req.body);
		const result = await authService.login2FA(dto);

		setSessionCookies(reply, result.refreshToken, result.remember);
		return reply.send(result);
	});

	// ── Public: Token Refresh ────────────────────────────────────────────────
	// Accepts a refresh token from either the cookie or the request body.
	app.post("/refresh", async (req, reply) => {
		const refreshTokenFromCookie = req.cookies.refreshToken;
		const refreshToken =
			refreshTokenFromCookie ?? refreshSchema.parse(req.body).refreshToken;

		const result = await authService.refresh(refreshToken);

		reply.setCookie("refreshToken", result.refreshToken, {
			...REFRESH_COOKIE_OPTIONS,
			maxAge: COOKIE_TTL.refreshToken,
		});

		return reply.send(result);
	});

	// ── Protected: Logout ────────────────────────────────────────────────────
	app.post("/logout", { preHandler: authGuard }, async (req, reply) => {
		await authService.logout(req.user!.id);

		reply.clearCookie("refreshToken", REFRESH_COOKIE_OPTIONS);
		return reply.send({ ok: true });
	});

	// ── Protected: Current User ──────────────────────────────────────────────
	app.get("/me", { preHandler: authGuard }, async (req) => {
		const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
		if (!user) throw Unauthorized("Usuário não encontrado");

		return {
			user: {
				id: user.id,
				name: user.name,
				username: user.username,
				email: user.email,
				createdAt: user.createdAt,
				twoFactorEnabled: user.twoFactorEnabled,
			},
		};
	});

	// ── Protected: 2FA Management ────────────────────────────────────────────

	// Step 1: Generates a TOTP secret and returns a QR code for the authenticator app.
	// 2FA remains disabled until the user confirms with /2fa/enable.
	app.post("/2fa/generate", { preHandler: authGuard }, async (req, reply) => {
		const result = await authService.generate2FA(req.user!.id, req.user!.email);
		return reply.send(result);
	});

	// Step 2: Confirms setup by verifying a TOTP code and activates 2FA.
	app.post("/2fa/enable", { preHandler: authGuard }, async (req, reply) => {
		const { code } = enable2FASchema.parse(req.body);
		const result = await authService.enable2FA(req.user!.id, code);
		return reply.send(result);
	});

	// Deactivates 2FA. Requires a valid code to prevent accidental deactivation.
	app.post("/2fa/disable", { preHandler: authGuard }, async (req, reply) => {
		const { code } = disable2FASchema.parse(req.body);
		const result = await authService.disable2FA(req.user!.id, code);
		return reply.send(result);
	});
}
