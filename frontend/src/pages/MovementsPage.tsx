import { useState, useEffect, useCallback } from 'react';
import { api, toastError } from '@/lib/api';
import { fmtNumber, fmtDate, shortId } from '@/lib/format';
import SectionHeader from '@/components/common/SectionHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { TypeBadge } from '@/components/common/TypeBadge';
import { PaginationFooter } from '@/components/common/PaginationFooter';

const TYPE_FILTERS = ['DEPOSIT', 'SWAP_IN', 'SWAP_OUT', 'SWAP_FEE', 'WITHDRAWAL'];

export default function MovementsPage() {
    const [data, setData] = useState({ items: [] as any[], total: 0, totalPages: 1, page: 1 });
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [tokenFilter, setTokenFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [loading, setLoading] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const params: { page: number; limit: number; token?: string; type?: string } = { page, limit };
            if (tokenFilter !== 'all') params.token = tokenFilter;
            if (typeFilter !== 'all') params.type = typeFilter;
            const { data } = await api.get('/ledger/movements', { params });
            setData(data);
        } catch (e) {
            toastError(e);
        } finally {
            setLoading(false);
        }
    }, [page, limit, tokenFilter, typeFilter]);

    useEffect(() => {
        load();
    }, [load]);

    return (
        <div className="space-y-6">
            <SectionHeader
                title="Movimentações"
                subtitle="Todas as alterações de saldo da sua carteira: depósitos, conversões, taxas e saques com saldo antes e depois."
            />

            <Card>
                <CardContent className="pt-6 space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Token</span>
                            <Select value={tokenFilter} onValueChange={(v) => { setTokenFilter(v); setPage(1); }}>
                                <SelectTrigger className="h-8 w-28" data-testid="movements-filter-token">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    <SelectItem value="BRL">BRL</SelectItem>
                                    <SelectItem value="BTC">BTC</SelectItem>
                                    <SelectItem value="ETH">ETH</SelectItem>
                                    <SelectItem value="USDT">USDT</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Tipo</span>
                            <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
                                <SelectTrigger className="h-8 w-36" data-testid="movements-filter-type">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    {TYPE_FILTERS.map((t) => (
                                        <SelectItem key={t} value={t}>{t}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center gap-2 ml-auto">
                            <span className="text-xs text-muted-foreground">Por página</span>
                            <Select value={String(limit)} onValueChange={(v) => { setLimit(Number(v)); setPage(1); }}>
                                <SelectTrigger className="h-8 w-20" data-testid="table-page-size-select">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {[5, 10, 20, 50].map((n) => (
                                        <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="rounded-md border border-border overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Data</TableHead>
                                    <TableHead>Tipo</TableHead>
                                    <TableHead>Token</TableHead>
                                    <TableHead className="text-right">Valor</TableHead>
                                    <TableHead className="text-right">Antes</TableHead>
                                    <TableHead className="text-right">Depois</TableHead>
                                    <TableHead>Ref TX</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading && (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-6">Carregando…</TableCell>
                                    </TableRow>
                                )}
                                {!loading && data.items.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">
                                            Nenhuma movimentação encontrada.
                                        </TableCell>
                                    </TableRow>
                                )}
                                {!loading && data.items.map((m) => (
                                    <TableRow
                                        key={m.id}
                                        className="hover:bg-secondary/40"
                                        data-testid={`ledger-row-${m.id}`}
                                    >
                                        <TableCell className="text-xs">{fmtDate(m.createdAt)}</TableCell>
                                        <TableCell>
                                            <TypeBadge type={m.type} testId={`ledger-row-${m.id}-type`} />
                                        </TableCell>
                                        <TableCell><Badge variant="secondary">{m.token}</Badge></TableCell>
                                        <TableCell className={`text-right font-mono tabular-nums ${Number(m.amount) < 0 ? 'text-red-300' : 'text-emerald-300'}`}>
                                            {Number(m.amount) > 0 ? '+' : ''}{fmtNumber(m.amount, { token: m.token })}
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-xs text-muted-foreground tabular-nums" data-testid={`ledger-row-${m.id}-before`}>
                                            {fmtNumber(m.balanceBefore, { token: m.token })}
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-xs tabular-nums" data-testid={`ledger-row-${m.id}-after`}>
                                            {fmtNumber(m.balanceAfter, { token: m.token })}
                                        </TableCell>
                                        <TableCell className="font-mono text-xs text-muted-foreground">{shortId(m.transactionId)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    <PaginationFooter
                        page={data.page || page}
                        total={data.total}
                        totalPages={data.totalPages || 1}
                        loading={loading}
                        itemName="movimentações"
                        onPageChange={setPage}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
