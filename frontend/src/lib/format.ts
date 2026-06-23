export function fmtNumber(
    value: number | string | null | undefined,
    opts: { token?: string; maxDigits?: number } = {},
) {
    if (value === null || value === undefined) return '—';
    const n = typeof value === 'string' ? Number(value) : value;
    if (Number.isNaN(n)) return String(value);
    const { token, maxDigits } = opts;
    let frac = maxDigits;
    if (frac === undefined) {
        if (token === 'BRL') frac = 2;
        else if (token === 'BTC' || token === 'ETH') frac = 8;
        else frac = 6;
    }
    return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: token === 'BRL' ? 2 : 0,
        maximumFractionDigits: frac,
    }).format(n);
}

export function fmtToken(
    value: number | string | null | undefined,
    token: string,
) {
    return `${fmtNumber(value, { token })} ${token}`;
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
