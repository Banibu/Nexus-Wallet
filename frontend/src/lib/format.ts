import { formatAmount, isBrlCurrency } from './numberFormat';

export function fmtNumber(
    value: number | string | null | undefined,
    opts: { token?: string; maxDigits?: number } = {},
) {
    if (value === null || value === undefined || value === '') return '—';

    const { token, maxDigits } = opts;
    if (token) {
        return formatAmount(value, token);
    }

    const n = typeof value === 'string' ? Number(value) : value;
    if (!Number.isFinite(n)) return String(value);

    return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: maxDigits ?? 6,
    }).format(n);
}

export function fmtToken(
    value: number | string | null | undefined,
    token: string,
) {
    return `${fmtNumber(value, { token })} ${token}`;
}

export function fmtRate(
    value: number | string | null | undefined,
    quoteToken: string,
    maxDigits = 8,
) {
    if (value === null || value === undefined || value === '') return '—';

    const n = typeof value === 'string' ? Number(value) : value;
    if (!Number.isFinite(n)) return String(value);

    return new Intl.NumberFormat(
        isBrlCurrency(quoteToken) ? 'pt-BR' : 'en-US',
        {
            minimumFractionDigits: 0,
            maximumFractionDigits: maxDigits,
        },
    ).format(n);
}

export function fmtDate(iso: string | Date | null | undefined) {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleString('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'medium',
    });
}

export function shortId(id: string | null | undefined) {
    if (!id) return '—';
    return id.length > 12 ? `${id.slice(0, 6)}…${id.slice(-4)}` : id;
}
