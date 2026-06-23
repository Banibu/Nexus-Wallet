import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(6).max(128),
});

export const loginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(10),
});

export type RegisterDTO = z.infer<typeof registerSchema>;
export type LoginDTO = z.infer<typeof loginSchema>;
export type RefreshDTO = z.infer<typeof refreshSchema>;
