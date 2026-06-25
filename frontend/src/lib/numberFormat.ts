export type AmountCurrency = 'BRL' | 'BTC' | 'ETH' | 'USDT' | string;

const BRL_INPUT_PATTERN = /^(\d+|\d{1,3}(\.\d{3})+)(,\d{1,2})?$/;
const TECHNICAL_DECIMAL_PATTERN = /^\d+(\.\d+)?$/;

function normalizeCurrency(currency: AmountCurrency): string {
    return String(currency || '')
        .trim()
        .toUpperCase();
}

export function isBrlCurrency(currency: AmountCurrency): boolean {
    return normalizeCurrency(currency) === 'BRL';
}

export function parseAmountInput(
    value: string,
    currency: AmountCurrency,
): string | null {
    const raw = value.trim();
    if (!raw) return null;

    if (isBrlCurrency(currency)) {
        if (!BRL_INPUT_PATTERN.test(raw)) return null;
        return raw.replace(/\./g, '').replace(',', '.');
    }

    if (!TECHNICAL_DECIMAL_PATTERN.test(raw)) return null;
    return raw;
}

export function isValidAmountInput(
    value: string,
    currency: AmountCurrency,
): boolean {
    return parseAmountInput(value, currency) !== null;
}

export function isPositiveTechnicalAmount(
    value: string | null | undefined,
): boolean {
    if (!value || !TECHNICAL_DECIMAL_PATTERN.test(value)) return false;
    return value.replace('.', '').replace(/^0+/, '').length > 0;
}

export function getAmountInputError(
    value: string,
    currency: AmountCurrency,
): string | null {
    if (!value.trim()) return null;

    const parsed = parseAmountInput(value, currency);
    if (!parsed) {
        if (isBrlCurrency(currency)) {
            return 'Formato inválido. Use vírgula como decimal. Exemplo: 1.273,00 ou 1273,00.';
        }

        return 'Formato inválido. Use ponto como decimal. Exemplo: 0.001 ou 1.25.';
    }

    if (!isPositiveTechnicalAmount(parsed)) {
        return 'O valor deve ser maior que zero.';
    }

    return null;
}

export function normalizeApiAmount(
    value: string,
    currency: AmountCurrency,
): string | null {
    const parsed = parseAmountInput(value, currency);
    if (!isPositiveTechnicalAmount(parsed)) return null;
    return parsed;
}

export function formatAmount(
    value: number | string | null | undefined,
    currency: AmountCurrency,
): string {
    if (value === null || value === undefined || value === '') return '—';

    const n = typeof value === 'string' ? Number(value) : value;
    if (!Number.isFinite(n)) return String(value);

    if (isBrlCurrency(currency)) {
        return new Intl.NumberFormat('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(n);
    }

    const token = normalizeCurrency(currency);
    const maximumFractionDigits = token === 'BTC' || token === 'ETH' ? 8 : 6;

    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits,
    }).format(n);
}
