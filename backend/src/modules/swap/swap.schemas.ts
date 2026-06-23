import { z } from 'zod';

const amountStr = z
  .union([z.string(), z.number()])
  .transform((v) => String(v))
  .refine((v) => /^[0-9]+(\.[0-9]+)?$/.test(v) && Number(v) > 0, {
    message: 'amount deve ser número positivo',
  });

export const quoteSchema = z.object({
  fromToken: z.string().min(1).transform((s) => s.toUpperCase()),
  toToken: z.string().min(1).transform((s) => s.toUpperCase()),
  amount: amountStr,
});

export const executeSchema = quoteSchema;

export type QuoteDTO = z.infer<typeof quoteSchema>;
export type ExecuteDTO = z.infer<typeof executeSchema>;
