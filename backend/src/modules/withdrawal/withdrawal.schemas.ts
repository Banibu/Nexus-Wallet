import { z } from 'zod';

export const withdrawalSchema = z.object({
  token: z.string().min(1).transform((s) => s.toUpperCase()),
  amount: z
    .union([z.string(), z.number()])
    .transform((v) => String(v))
    .refine((v) => /^[0-9]+(\.[0-9]+)?$/.test(v) && Number(v) > 0, {
      message: 'amount deve ser número positivo',
    }),
  destinationAddress: z.string().optional(),
});

export type WithdrawalDTO = z.infer<typeof withdrawalSchema>;
