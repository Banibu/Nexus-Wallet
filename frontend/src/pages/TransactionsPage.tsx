import { ChevronDown, ChevronUp } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { PaginationFooter } from '@/components/common/PaginationFooter';
import SectionHeader from '@/components/common/SectionHeader';
import { TypeBadge } from '@/components/common/TypeBadge';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { api, toastError } from '@/lib/api';
import { fmtDate, fmtNumber, shortId } from '@/lib/format';

function TransactionRow({ tx }: { tx: any }) {
    const [open, setOpen] = useState(false);
    const [detail, setDetail] = useState<any | null>(null);
    const [loadingDetail, setLoadingDetail] = useState(false);

    const toggle = async () => {
        const next = !open;
        setOpen(next);
        if (next && !detail) {
            setLoadingDetail(true);
            try {
                const { data } = await api.get(`/transactions/${tx.id}`);
                setDetail(data);
            } catch (e) {
                toastError(e);
            } finally {
                setLoadingDetail(false);
            }
        }
    };

    return (
        <>
            <TableRow
                data-testid={`transactions-row-${tx.id}`}
                className="hover:bg-secondary/40 cursor-pointer"
                onClick={toggle}
            >
                <TableCell className="text-xs">
                    {fmtDate(tx.createdAt)}
                </TableCell>
                <TableCell>
                    <TypeBadge type={tx.type} />
                </TableCell>
                <TableCell className="text-sm">
                    {tx.type === 'DEPOSIT' &&
                        `${fmtNumber(tx.amountTo, { token: tx.tokenTo })} ${tx.tokenTo}`}
                    {tx.type === 'WITHDRAWAL' &&
                        `${fmtNumber(tx.amountFrom, { token: tx.tokenFrom })} ${tx.tokenFrom}`}
                    {tx.type === 'SWAP' && (
                        <span>
                            {fmtNumber(tx.amountFrom, { token: tx.tokenFrom })}{' '}
                            {tx.tokenFrom} →{' '}
                            {fmtNumber(tx.amountTo, { token: tx.tokenTo })}{' '}
                            {tx.tokenTo}
                        </span>
                    )}
                </TableCell>
                <TableCell className="font-mono text-xs tabular-nums">
                    {tx.feeAmount
                        ? `${fmtNumber(tx.feeAmount, { token: tx.feeToken })} ${tx.feeToken}`
                        : '—'}
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                    {shortId(tx.id)}
                </TableCell>
                <TableCell
                    className="w-8"
                    data-testid={`transactions-row-${tx.id}-expand`}
                >
                    {open ? (
                        <ChevronUp className="h-4 w-4" />
                    ) : (
                        <ChevronDown className="h-4 w-4" />
                    )}
                </TableCell>
            </TableRow>
            {open && (
                <TableRow data-testid={`transactions-row-${tx.id}-details`}>
                    <TableCell colSpan={6} className="bg-secondary/30 p-4">
                        {loadingDetail && (
                            <div className="text-sm text-muted-foreground">
                                Carregando movimentos…
                            </div>
                        )}
                        {detail && (
                            <div className="space-y-3">
                                <div className="text-xs text-muted-foreground">
                                    Transaction ID:{' '}
                                    <span className="font-mono">
                                        {detail.id}
                                    </span>
                                    {detail.idempotencyKey && (
                                        <span className="ml-3">
                                            idempotencyKey:{' '}
                                            <span className="font-mono">
                                                {detail.idempotencyKey}
                                            </span>
                                        </span>
                                    )}
                                    {detail.rate && (
                                        <span className="ml-3">
                                            cotação:{' '}
                                            <span className="font-mono">
                                                {fmtNumber(detail.rate)}
                                            </span>
                                        </span>
                                    )}
                                </div>
                                <div className="rounded border border-border overflow-x-auto bg-card">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Tipo</TableHead>
                                                <TableHead>Token</TableHead>
                                                <TableHead className="text-right">
                                                    Valor
                                                </TableHead>
                                                <TableHead className="text-right">
                                                    Antes
                                                </TableHead>
                                                <TableHead className="text-right">
                                                    Depois
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {detail.movements.map((m) => (
                                                <TableRow key={m.id}>
                                                    <TableCell className="text-xs">
                                                        <TypeBadge
                                                            type={m.type}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="secondary">
                                                            {m.token}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell
                                                        className={`text-right font-mono text-xs tabular-nums ${Number(m.amount) < 0 ? 'text-red-300' : 'text-emerald-300'}`}
                                                    >
                                                        {Number(m.amount) > 0
                                                            ? '+'
                                                            : ''}
                                                        {fmtNumber(m.amount, {
                                                            token: m.token,
                                                        })}
                                                    </TableCell>
                                                    <TableCell className="text-right font-mono text-xs tabular-nums text-muted-foreground">
                                                        {fmtNumber(
                                                            m.balanceBefore,
                                                            { token: m.token },
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right font-mono text-xs tabular-nums">
                                                        {fmtNumber(
                                                            m.balanceAfter,
                                                            { token: m.token },
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        )}
                    </TableCell>
                </TableRow>
            )}
        </>
    );
}

export default function TransactionsPage() {
    const [data, setData] = useState({
        items: [] as any[],
        total: 0,
        totalPages: 1,
        page: 1,
    });
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [typeFilter, setTypeFilter] = useState('all');
    const [loading, setLoading] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const params: { page: number; limit: number; type?: string } = {
                page,
                limit,
            };
            if (typeFilter !== 'all') params.type = typeFilter;
            const { data } = await api.get('/transactions', { params });
            setData(data);
        } catch (e) {
            toastError(e);
        } finally {
            setLoading(false);
        }
    }, [page, limit, typeFilter]);

    useEffect(() => {
        load();
    }, [load]);

    return (
        <div className="space-y-6">
            <SectionHeader
                title="Histórico de Transações"
                subtitle="Cada depósito, conversão e saque agrupa as movimentações relacionadas. Clique numa linha para expandir."
            />
            <Card>
                <CardContent className="pt-6 space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                                Tipo
                            </span>
                            <Select
                                value={typeFilter}
                                onValueChange={(v) => {
                                    setTypeFilter(v);
                                    setPage(1);
                                }}
                            >
                                <SelectTrigger
                                    className="h-8 w-36"
                                    data-testid="transactions-filter-type"
                                >
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    <SelectItem value="DEPOSIT">
                                        DEPOSIT
                                    </SelectItem>
                                    <SelectItem value="SWAP">SWAP</SelectItem>
                                    <SelectItem value="WITHDRAWAL">
                                        WITHDRAWAL
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center gap-2 ml-auto">
                            <span className="text-xs text-muted-foreground">
                                Por página
                            </span>
                            <Select
                                value={String(limit)}
                                onValueChange={(v) => {
                                    setLimit(Number(v));
                                    setPage(1);
                                }}
                            >
                                <SelectTrigger className="h-8 w-20">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {[5, 10, 20, 50].map((n) => (
                                        <SelectItem key={n} value={String(n)}>
                                            {n}
                                        </SelectItem>
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
                                    <TableHead>Resumo</TableHead>
                                    <TableHead>Taxa</TableHead>
                                    <TableHead>TX</TableHead>
                                    <TableHead></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading && (
                                    <TableRow>
                                        <TableCell
                                            colSpan={6}
                                            className="text-center py-6 text-sm text-muted-foreground"
                                        >
                                            Carregando…
                                        </TableCell>
                                    </TableRow>
                                )}
                                {!loading && data.items.length === 0 && (
                                    <TableRow>
                                        <TableCell
                                            colSpan={6}
                                            className="text-center py-8 text-sm text-muted-foreground"
                                        >
                                            Sem transações ainda. Use “Depósito
                                            (Webhook)” para gerar dados.
                                        </TableCell>
                                    </TableRow>
                                )}
                                {!loading &&
                                    data.items.map((t) => (
                                        <TransactionRow key={t.id} tx={t} />
                                    ))}
                            </TableBody>
                        </Table>
                    </div>

                    <PaginationFooter
                        page={data.page || page}
                        total={data.total}
                        totalPages={data.totalPages || 1}
                        loading={loading}
                        itemName="transações"
                        onPageChange={setPage}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
