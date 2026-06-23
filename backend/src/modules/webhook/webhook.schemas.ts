import { z } from "zod";

export const depositWebhookSchema = z.object({
	userId: z.string().uuid({ message: "userId deve ser UUID" }),
	token: z.string().min(1),
	amount: z
		.union([z.string(), z.number()])
		.transform((v) => String(v))
		.refine((v) => /^[0-9]+(\.[0-9]+)?$/.test(v) && Number(v) > 0, {
			message: "amount deve ser número positivo",
		}),
	idempotencyKey: z.string().min(1).max(128),
});

export type DepositWebhookDTO = z.infer<typeof depositWebhookSchema>;
