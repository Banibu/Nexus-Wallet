import Decimal from 'decimal.js';
import { Prisma } from '@prisma/client';

// Sensible global config: 40 sig digits, half-up rounding
Decimal.set({ precision: 40, rounding: Decimal.ROUND_HALF_UP });

export const toDecimal = (v: string | number | Prisma.Decimal | Decimal): Decimal => {
  if (v instanceof Decimal) return v;
  if (typeof v === 'string' || typeof v === 'number') return new Decimal(v);
  // Prisma.Decimal has .toString()
  return new Decimal(v.toString());
};

export const toPrismaDecimal = (v: Decimal | string | number): Prisma.Decimal =>
  new Prisma.Decimal(typeof v === 'object' ? v.toString() : v.toString());

export const formatAmount = (v: Decimal | string | number, dp = 8): string =>
  toDecimal(v).toFixed(dp).replace(/\.?0+$/, (m) => (m.includes('.') ? '' : m));

export const roundForToken = (v: Decimal, token: string): Decimal => {
  return v.toDecimalPlaces(18, Decimal.ROUND_HALF_UP);
};
