import { AlertTriangle, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import SectionHeader from '@/components/common/SectionHeader';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api, toastError } from '@/lib/api';
import { fmtNumber } from '@/lib/format';

const TOKENS = ['BRL', 'BTC', 'ETH'];

export default function AuditPage() {
    const [token, setToken] = useState('BRL');
    const [data, setData] = useState<any | null>(null);
    const [loading, setLoading] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get(`/ledger/reconcile/${token}`);
            setData(data);
        } catch (e) {
            toastError(e);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        load();
    }, [load]);

    return (
        <div className="space-y-6">
            <SectionHeader
                title="Auditoria de Saldos"
                subtitle="Compare o saldo armazenado com o saldo recalculado a partir do histórico completo de movimentações."
            />

            <Tabs
                value={token}
                onValueChange={setToken}
                data-testid="audit-token-tabs"
            >
                <TabsList>
                    {TOKENS.map((t) => (
                        <TabsTrigger
                            key={t}
                            value={t}
                            data-testid={`audit-tab-${t}`}
                        >
                            {t}
                        </TabsTrigger>
                    ))}
                </TabsList>
                {TOKENS.map((t) => (
                    <TabsContent key={t} value={t} className="mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 font-display">
                                    <ShieldCheck className="h-5 w-5 text-primary" />{' '}
                                    Reconciliação de {t}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="rounded-lg border border-border p-5">
                                        <div className="text-xs uppercase tracking-widest text-muted-foreground">
                                            Saldo atual
                                        </div>
                                        <div
                                            className="font-display text-3xl font-semibold tabular-nums mt-1"
                                            data-testid="audit-stored-balance"
                                        >
                                            {data
                                                ? fmtNumber(data.stored, {
                                                      token: t,
                                                  })
                                                : '—'}{' '}
                                            <span className="text-sm text-muted-foreground">
                                                {t}
                                            </span>
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-1">
                                            Saldo registrado na carteira
                                        </div>
                                    </div>
                                    <div className="rounded-lg border border-border p-5">
                                        <div className="text-xs uppercase tracking-widest text-muted-foreground">
                                            Saldo recalculado
                                        </div>
                                        <div
                                            className="font-display text-3xl font-semibold tabular-nums mt-1"
                                            data-testid="audit-rebuilt-balance"
                                        >
                                            {data
                                                ? fmtNumber(
                                                      data.reconstructed,
                                                      { token: t },
                                                  )
                                                : '—'}{' '}
                                            <span className="text-sm text-muted-foreground">
                                                {t}
                                            </span>
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-1">
                                            Soma de todas as movimentações
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                                    <div>
                                        <div className="text-xs uppercase tracking-widest text-muted-foreground">
                                            Status
                                        </div>
                                        <div
                                            className="mt-1"
                                            data-testid="audit-delta"
                                        >
                                            {data?.consistent ? (
                                                <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30">
                                                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" />{' '}
                                                    Consistente • Delta = 0
                                                </Badge>
                                            ) : (
                                                <Badge variant="destructive">
                                                    <AlertTriangle className="h-3.5 w-3.5 mr-1" />{' '}
                                                    Divergente
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-xs text-muted-foreground max-w-md text-right">
                                        Garantia de integridade: o saldo da sua
                                        carteira pode ser reconstruído a
                                        qualquer momento a partir do histórico
                                        completo de movimentações.
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    );
}
