import { z } from "zod";

export const registerSchema = z.object({
	name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres").max(100),
	email: z.string().email("E-mail inválido").toLowerCase(),
	password: z
		.string()
		.min(8, "A senha deve ter no mínimo 8 caracteres")
		.max(128)
		.regex(/[a-zA-Z]/, "A senha deve conter pelo menos uma letra")
		.regex(/[0-9]/, "A senha deve conter pelo menos um número")
		.refine(
			(val) => !/^(?:123456|qwerty|password|12345678|123456789)$/i.test(val),
			{
				message: "Senha muito fraca ou comum. Evite sequências simples.",
			},
		),
});

export const checkEmailSchema = z.object({
	email: z.string().email("E-mail inválido").toLowerCase(),
});

export const loginSchema = z.object({
	email: z.string().email().toLowerCase(),
	password: z.string().min(1),
	remember: z.boolean().optional(),
});

export const loginTotpSchema = z.object({
	email: z.string().email().toLowerCase(),
	code: z.string().length(6),
	remember: z.boolean().optional(),
});

export const login2FASchema = z.object({
	tempToken: z.string(),
	code: z.string().length(6),
	remember: z.boolean().optional(),
});

export const enable2FASchema = z.object({
	code: z.string().length(6),
});

export const disable2FASchema = z.object({
	code: z.string().length(6),
});

export const refreshSchema = z.object({
	refreshToken: z.string().min(10),
});

export type RegisterDTO = z.infer<typeof registerSchema>;
export type CheckEmailDTO = z.infer<typeof checkEmailSchema>;
export type LoginDTO = z.infer<typeof loginSchema>;
export type LoginTotpDTO = z.infer<typeof loginTotpSchema>;
export type Login2FADTO = z.infer<typeof login2FASchema>;
export type RefreshDTO = z.infer<typeof refreshSchema>;
