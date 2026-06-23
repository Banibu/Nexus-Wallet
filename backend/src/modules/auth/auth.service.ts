import type { User } from "@prisma/client";
import QRCode from "qrcode";
import * as speakeasy from "speakeasy";
import { v4 as uuid } from "uuid";
import { env } from "../../config/env";
import { prisma } from "../../config/prisma";
import { hashPassword, sha256, verifyPassword } from "../../lib/hash";
import {
	signAccessToken,
	signRefreshToken,
	signTempToken,
	verifyRefreshToken,
	verifyTempToken,
} from "../../lib/jwt";
import { BadRequest, Conflict, Unauthorized } from "../../utils/errors";
import type {
	Login2FADTO,
	LoginDTO,
	LoginTotpDTO,
	RegisterDTO,
} from "./auth.schemas";

// ─── Shared Helpers ───────────────────────────────────────────────────────────

/** Fields returned in the public user object across all auth responses. */
type PublicUser = Pick<
	User,
	"id" | "name" | "username" | "email" | "twoFactorEnabled"
> & {
	createdAt?: Date;
};

function toPublicUser(user: User): PublicUser {
	return {
		id: user.id,
		name: user.name,
		username: user.username,
		email: user.email,
		twoFactorEnabled: user.twoFactorEnabled,
		createdAt: user.createdAt,
	};
}

function verifyTotpCode(secret: string, token: string): boolean {
	return speakeasy.totp.verify({ secret, encoding: "base32", token });
}

// ─── Token Issuance ───────────────────────────────────────────────────────────

/**
 * Creates a fresh access + refresh token pair and persists the refresh token
 * in the database. The old token is NOT automatically revoked here — callers
 * must revoke as needed (e.g., on refresh rotation).
 */
export async function issueTokens(userId: string, email: string) {
	const accessToken = signAccessToken({ sub: userId, email });
	const jti = uuid();
	const refreshToken = signRefreshToken({ sub: userId, jti });
	const expiresAt = new Date(
		Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
	);

	await prisma.refreshToken.create({
		data: { id: jti, userId, tokenHash: sha256(refreshToken), expiresAt },
	});

	return { accessToken, refreshToken };
}

// ─── Registration ─────────────────────────────────────────────────────────────

export async function register(dto: RegisterDTO) {
	const existingUser = await prisma.user.findUnique({
		where: { email: dto.email },
	});
	if (existingUser) throw Conflict("EMAIL_TAKEN", "Email já cadastrado");

	// Derive a unique username from the display name
	const baseUsername = dto.name
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "") // strip accents
		.replace(/[^a-z0-9]/g, ""); // strip non-alphanumeric
	const suffix = Math.floor(1000 + Math.random() * 9000);
	const username = `${baseUsername}${suffix}`;

	const passwordHash = await hashPassword(dto.password);

	const user = await prisma.user.create({
		data: {
			name: dto.name,
			username,
			email: dto.email,
			passwordHash,
			wallet: {
				create: {
					balances: {
						create: env.SUPPORTED_TOKENS.map((token) => ({ token, amount: 0 })),
					},
				},
			},
		},
		include: { wallet: { include: { balances: true } } },
	});

	const tokens = await issueTokens(user.id, user.email);
	return { user: toPublicUser(user), ...tokens };
}

// ─── Email Check ──────────────────────────────────────────────────────────────

/**
 * Checks whether a given email has 2FA enabled.
 * Used by the login flow to decide which step to show next.
 * Intentionally does not reveal whether the account exists.
 */
export async function checkEmail(
	email: string,
): Promise<{ twoFactorEnabled: boolean }> {
	const user = await prisma.user.findUnique({ where: { email } });
	return { twoFactorEnabled: user?.twoFactorEnabled ?? false };
}

// ─── Login (Password) ─────────────────────────────────────────────────────────

/**
 * Standard email + password login.
 * If the user has 2FA enabled and the device is not trusted, returns a short-lived
 * `tempToken` instead of full tokens. The client must then complete the 2FA step.
 */
export async function login(dto: LoginDTO, hasTrustedDevice: boolean) {
	const user = await prisma.user.findUnique({ where: { email: dto.email } });
	if (!user) throw Unauthorized("Credenciais inválidas");

	const passwordMatches = await verifyPassword(dto.password, user.passwordHash);
	if (!passwordMatches) throw Unauthorized("Credenciais inválidas");

	// If 2FA is active and this device isn't trusted, ask for the TOTP code next
	if (user.twoFactorEnabled && !hasTrustedDevice) {
		const tempToken = signTempToken({ sub: user.id, type: "2fa" });
		return { requires2FA: true as const, tempToken };
	}

	const tokens = await issueTokens(user.id, user.email);
	return { user: toPublicUser(user), ...tokens, remember: dto.remember };
}

// ─── Login (TOTP — Passwordless) ──────────────────────────────────────────────

/**
 * Passwordless login using only an email + TOTP code.
 * Only works if the user has 2FA enabled.
 */
export async function loginTotp(dto: LoginTotpDTO) {
	const user = await prisma.user.findUnique({ where: { email: dto.email } });
	if (!user?.twoFactorEnabled || !user.twoFactorSecret) {
		throw Unauthorized("Usuário ou código inválido");
	}

	const isValidCode = verifyTotpCode(user.twoFactorSecret, dto.code);
	if (!isValidCode) throw Unauthorized("Código inválido ou expirado");

	const tokens = await issueTokens(user.id, user.email);
	return { user: toPublicUser(user), ...tokens, remember: dto.remember };
}

// ─── Login (2FA Second Step) ──────────────────────────────────────────────────

/**
 * Second step of a password-based 2FA login.
 * Validates the short-lived `tempToken` issued during the first step,
 * then verifies the TOTP code before issuing full session tokens.
 */
export async function login2FA(dto: Login2FADTO) {
	let tempPayload: { sub: string; type: string };
	try {
		tempPayload = verifyTempToken(dto.tempToken);
	} catch {
		throw Unauthorized("Token temporário inválido ou expirado");
	}

	const user = await prisma.user.findUnique({ where: { id: tempPayload.sub } });
	if (!user?.twoFactorEnabled || !user.twoFactorSecret) {
		throw Unauthorized("Conta não configurada para 2FA");
	}

	const isValidCode = verifyTotpCode(user.twoFactorSecret, dto.code);
	if (!isValidCode) throw Unauthorized("Código inválido ou expirado");

	const tokens = await issueTokens(user.id, user.email);
	return { user: toPublicUser(user), ...tokens, remember: dto.remember };
}

// ─── Token Refresh ────────────────────────────────────────────────────────────

/**
 * Validates a refresh token, rotates it (revokes old, issues new), and returns
 * fresh tokens. Throws if the token is invalid, revoked, or expired.
 */
export async function refresh(refreshToken: string) {
	let payload: { sub: string; jti: string };
	try {
		payload = verifyRefreshToken(refreshToken);
	} catch {
		throw Unauthorized("Refresh token inválido");
	}

	const storedToken = await prisma.refreshToken.findUnique({
		where: { id: payload.jti },
	});
	if (!storedToken || storedToken.revoked)
		throw Unauthorized("Refresh token revogado");
	if (storedToken.tokenHash !== sha256(refreshToken))
		throw Unauthorized("Refresh token incompatível");
	if (storedToken.expiresAt < new Date())
		throw Unauthorized("Refresh token expirado");

	const user = await prisma.user.findUnique({ where: { id: payload.sub } });
	if (!user) throw Unauthorized("Usuário inexistente");

	// Rotate: revoke the old token and issue a fresh pair
	await prisma.refreshToken.update({
		where: { id: storedToken.id },
		data: { revoked: true },
	});
	const tokens = await issueTokens(user.id, user.email);

	return { user: toPublicUser(user), ...tokens };
}

// ─── Logout ───────────────────────────────────────────────────────────────────

/** Revokes all active refresh tokens for the given user, effectively ending all sessions. */
export async function logout(userId: string): Promise<void> {
	await prisma.refreshToken.updateMany({
		where: { userId, revoked: false },
		data: { revoked: true },
	});
}

// ─── 2FA Management ───────────────────────────────────────────────────────────

/**
 * Generates a new TOTP secret, persists it (with 2FA still disabled),
 * and returns both the raw secret and a QR code URL for the authenticator app.
 * The user must scan the QR code and confirm with `enable2FA` to activate.
 */
export async function generate2FA(userId: string, email: string) {
	const secretData = speakeasy.generateSecret({
		name: `Nexus Wallet (${email})`,
		length: 20,
	});

	const secret = secretData.base32;
	const qrCodeUrl = await QRCode.toDataURL(secretData.otpauth_url!);

	// Store the secret but keep 2FA disabled until the user confirms
	await prisma.user.update({
		where: { id: userId },
		data: { twoFactorSecret: secret, twoFactorEnabled: false },
	});

	return { secret, qrCodeUrl };
}

/**
 * Enables 2FA for a user after they scan the QR code and provide a valid TOTP code
 * from their authenticator app. This confirms they have access to the shared secret.
 */
export async function enable2FA(userId: string, code: string) {
	const user = await prisma.user.findUnique({ where: { id: userId } });
	if (!user?.twoFactorSecret)
		throw BadRequest("2FA_ERROR", "2FA não foi iniciado");

	const isValidCode = verifyTotpCode(user.twoFactorSecret, code);
	if (!isValidCode) throw BadRequest("2FA_ERROR", "Código inválido");

	await prisma.user.update({
		where: { id: userId },
		data: { twoFactorEnabled: true },
	});
	return { success: true as const };
}

/**
 * Disables 2FA for a user. Requires a valid TOTP code to prevent accidental
 * (or malicious) deactivation from an unattended session.
 */
export async function disable2FA(userId: string, code: string) {
	const user = await prisma.user.findUnique({ where: { id: userId } });
	if (!user?.twoFactorSecret || !user.twoFactorEnabled) {
		throw BadRequest("2FA_ERROR", "2FA não está ativo");
	}

	const isValidCode = verifyTotpCode(user.twoFactorSecret, code);
	if (!isValidCode) throw BadRequest("2FA_ERROR", "Código inválido");

	await prisma.user.update({
		where: { id: userId },
		data: { twoFactorEnabled: false, twoFactorSecret: null },
	});

	return { success: true as const };
}
