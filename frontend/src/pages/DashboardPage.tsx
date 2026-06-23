import { useEffect, useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api, toastError } from '@/lib/api';
import { fmtNumber } from '@/lib/format';
import SectionHeader from '@/components/common/SectionHeader';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Bitcoin,
    DollarSign,
    Coins,
    ArrowLeftRight,
    ArrowDownToLine,
    Wallet,
} from 'lucide-react';

const TOKEN_META = {
    BRL: { label: 'Real Brasileiro', icon: DollarSign, color: 'text-emerald-300' },
    BTC: { label: 'Bitcoin', icon: Bitcoin, color: 'text-amber-300' },
    ETH: { label: 'Ethereum', icon: Coins, color: 'text-indigo-300' },
};

async function fetchQuoteSafe(from, to, amount) {
    try {
        const { data } = await api.get('/swaps/quote', {
            params: { fromToken: from, toToken: to, amount },
        });
        return Number(data.rate);
    } catch {
        return null;
    }
}

export default function DashboardPage() {
    const [balances, setBalances] = useState<any | null>(null);
    const [rates, setRates] = useState({ BTC: null, ETH: null });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const refresh = useCallback(async () => {
        setRefreshing(true);
        try {
            const [walletRes, btcRate, ethRate] = await Promise.all([
                api.get('/wallet/balances'),
                fetchQuoteSafe('BTC', 'BRL', '1'),
                fetchQuoteSafe('ETH', 'BRL', '1'),
            ]);
            setBalances(walletRes.data.balances);
            setRates({ BTC: btcRate, ETH: ethRate });
        } catch (e) {
            toastError(e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        refresh();
        const interval = setInterval(refresh, 15000);
        return () => clearInterval(interval);
    }, [refresh]);

    const totalBRL = useMemo(() => {
        if (!balances) return 0;
        let total = 0;
        for (const b of balances) {
            const amt = Number(b.amount);
            if (b.token === 'BRL') total += amt;
            else if (b.token === 'BTC' && rates.BTC) total += amt * rates.BTC;
            else if (b.token === 'ETH' && rates.ETH) total += amt * rates.ETH;
        }
        return total;
    }, [balances, rates]);

    return (
        <div className="space-y-6">
            <SectionHeader
                title="Visão Geral"
                subtitle="Acompanhe os saldos da sua carteira e converta entre BRL, BTC e ETH em tempo real."
            />

            <Card className="bg-gradient-to-br from-card to-card/40 border-border">
                <CardContent className="py-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                    <div>
                        <div className="text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <Wallet className="h-3.5 w-3.5" /> Patrimônio estimado
                        </div>
                        <div
                            className="font-display text-4xl sm:text-5xl font-semibold tabular-nums mt-1"
                            data-testid="dashboard-total-brl"
                        >
                            R$ {fmtNumber(totalBRL, { token: 'BRL' })}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                            {rates.BTC ? 'BTC R$ ' + fmtNumber(rates.BTC, { token: 'BRL' }) : ''}
                            {rates.BTC && rates.ETH ? ' · ' : ''}
                            {rates.ETH ? 'ETH R$ ' + fmtNumber(rates.ETH, { token: 'BRL' }) : ''}
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button asChild data-testid="dashboard-action-swap">
                            <Link to="/swap">
                                <ArrowLeftRight className="h-4 w-4 mr-1.5" /> Trocar
                            </Link>
                        </Button>
                        <Button asChild variant="secondary" data-testid="dashboard-action-withdraw">
                            <Link to="/withdraw">
                                <ArrowDownToLine className="h-4 w-4 mr-1.5" /> Sacar
                            </Link>
                        </Button>
                        <Button asChild variant="outline" data-testid="dashboard-action-deposit">
                            <Link to="/deposit">
                                <Wallet className="h-4 w-4 mr-1.5" /> Depositar
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {loading
                    ? [0, 1, 2].map((i) => (
                          <Card key={i}>
                              <CardContent className="p-5 space-y-3">
                                  <Skeleton className="h-5 w-24" />
                                  <Skeleton className="h-9 w-32" />
                                  <Skeleton className="h-4 w-20" />
                              </CardContent>
                          </Card>
                      ))
                    : (balances || []).map((b) => {
                          const meta = TOKEN_META[b.token] || { label: b.token, icon: Coins };
                          const Icon = meta.icon;
                          let brl = null;
                          if (b.token === 'BRL') brl = Number(b.amount);
                          else if (b.token === 'BTC' && rates.BTC) brl = Number(b.amount) * rates.BTC;
                          else if (b.token === 'ETH' && rates.ETH) brl = Number(b.amount) * rates.ETH;
                          return (
                              <Card
                                  key={b.token}
                                  className="relative overflow-hidden"
                                  data-testid={`balance-card-${b.token}`}
                              >
                                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
                                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                                      <div className="flex items-center gap-2">
                                          <div
                                              className={`flex h-8 w-8 items-center justify-center rounded-full bg-secondary ${meta.color}`}
                                          >
                                              <Icon className="h-4 w-4" />
                                          </div>
                                          <div>
                                              <div className="text-xs text-muted-foreground">{meta.label}</div>
                                              <div className="text-sm font-medium font-display">{b.token}</div>
                                          </div>
                                      </div>
                                      <Badge variant="secondary" className="text-[10px]">
                                          Disponível
                                      </Badge>
                                  </CardHeader>
                                  <CardContent className="pt-1 pb-5">
                                      <div
                                          className="text-2xl sm:text-3xl font-display font-semibold tabular-nums"
                                          data-testid={`balance-card-${b.token}-amount`}
                                      >
                                          {fmtNumber(b.amount, { token: b.token })}
                                      </div>
                                      {brl !== null && b.token !== 'BRL' && (
                                          <div
                                              className="text-xs text-muted-foreground mt-1"
                                              data-testid={`balance-card-${b.token}-brl-value`}
                                          >
                                              ≈ R$ {fmtNumber(brl, { token: 'BRL' })}
                                          </div>
                                      )}
                                      <div className="mt-3 flex gap-2">
                                          <Button
                                              asChild
                                              size="sm"
                                              variant="outline"
                                              className="h-7 px-2 text-xs"
                                          >
                                              <Link to="/swap">Trocar</Link>
                                          </Button>
                                          <Button
                                              asChild
                                              size="sm"
                                              variant="ghost"
                                              className="h-7 px-2 text-xs"
                                          >
                                              <Link to="/withdraw">Sacar</Link>
                                          </Button>
                                      </div>
                                  </CardContent>
                              </Card>
                          );
                      })}
            </div>
        </div>
    );
}
