import { ArrowDown, ArrowLeftRight, Loader2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import SectionHeader from '@/components/common/SectionHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { api, toastError } from '@/lib/api';
import { fmtNumber, fmtRate } from '@/lib/format';
import { getAmountInputError, normalizeApiAmount } from '@/lib/numberFormat';

const TOKENS = ['BRL', 'BTC', 'ETH', 'USDT'];

export default function SwapPage() {
    const [fromToken, setFrom] = useState('BTC');
    const [toToken, setTo] = useState('BRL');
    const [amount, setAmount] = useState('');
    const [quote, setQuote] = useState<any | null>(null);
    const [quoteLoading, setQuoteLoading] = useState(false);
    const [executing, setExecuting] = useState(false);
    const debounceRef = useRef<any>(null);
    const parsedAmount = normalizeApiAmount(amount, fromToken);
    const amountError = getAmountInputError(amount, fromToken);

    const fetchQuote = useCallback(async () => {
        const parsedAmount = normalizeApiAmount(amount, fromToken);
        if (!parsedAmount || fromToken === toToken) {
            setQuote(null);
            return;
        }
        setQuoteLoading(true);
        try {
            const { data } = await api.get('/swaps/quote', {
                params: { fromToken, toToken, amount: parsedAmount },
            });
            setQuote(data);
        } catch (e) {
            setQuote(null);
            toastError(e);
        } finally {
            setQuoteLoading(false);
        }
    }, [amount, fromToken, toToken]);

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(fetchQuote, 450);
        return () => debounceRef.current && clearTimeout(debounceRef.current);
    }, [fetchQuote]);

    useEffect(() => {
        if (!quote) return;
        const interval = setInterval(fetchQuote, 10000);
        return () => clearInterval(interval);
    }, [fetchQuote, quote]);

    const swapDirection = () => {
        setFrom(toToken);
        setTo(fromToken);
    };

    const execute = async () => {
        const parsedAmount = normalizeApiAmount(amount, fromToken);
        if (!quote || !parsedAmount) return;
        setExecuting(true);
        try {
            const { data } = await api.post('/swaps/execute', {
                fromToken,
                toToken,
                amount: parsedAmount,
            });
            toast.success(
                `Conversão concluída • ${fmtNumber(data.amountOut, { token: toToken })} ${toToken}`,
            );
            setAmount('');
            setQuote(null);
        } catch (e) {
            toastError(e);
        } finally {
            setExecuting(false);
        }
    };

    return (
        <div className="space-y-6">
            <SectionHeader
                title="Swap"
                subtitle="Converta entre BRL, BTC, ETH e USDT com cotações atualizadas em tempo real."
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-display flex items-center gap-2">
                            <ArrowLeftRight className="h-5 w-5 text-primary" />{' '}
                            Nova conversão
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label>De</Label>
                                <Select
                                    value={fromToken}
                                    onValueChange={setFrom}
                                >
                                    <SelectTrigger data-testid="swap-from-token-select">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {TOKENS.map((t) => (
                                            <SelectItem
                                                key={t}
                                                value={t}
                                                disabled={t === toToken}
                                            >
                                                {t}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Para</Label>
                                <Select value={toToken} onValueChange={setTo}>
                                    <SelectTrigger data-testid="swap-to-token-select">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {TOKENS.map((t) => (
                                            <SelectItem
                                                key={t}
                                                value={t}
                                                disabled={t === fromToken}
                                            >
                                                {t}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex justify-center">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={swapDirection}
                                data-testid="swap-flip-direction"
                            >
                                <ArrowDown className="h-4 w-4 mr-1" /> Inverter
                            </Button>
                        </div>
                        <div className="space-y-2">
                            <Label>Quantidade ({fromToken})</Label>
                            <Input
                                inputMode="decimal"
                                placeholder={
                                    fromToken === 'BRL' ? '0,00' : '0.00'
                                }
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                data-testid="swap-amount-input"
                                className={`text-lg tabular-nums ${amountError ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                            />
                            {amountError && (
                                <p className="text-xs text-destructive mt-1">
                                    {amountError}
                                </p>
                            )}
                        </div>
                        <Button
                            className="w-full"
                            size="lg"
                            disabled={
                                !quote ||
                                executing ||
                                quoteLoading ||
                                !parsedAmount
                            }
                            onClick={execute}
                            data-testid="swap-execute-button"
                        >
                            {executing ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />{' '}
                                    Processando…
                                </>
                            ) : (
                                'Confirmar conversão'
                            )}
                        </Button>
                    </CardContent>
                </Card>

                <Card className="bg-card">
                    <CardHeader className="flex flex-row items-start justify-between">
                        <div>
                            <CardTitle className="font-display">
                                Resumo da cotação
                            </CardTitle>
                            <div className="text-xs text-muted-foreground">
                                Cotação em tempo real
                            </div>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                            Taxa 1,5%
                        </Badge>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {!quote && !quoteLoading && (
                            <div className="py-8 text-center text-sm text-muted-foreground">
                                Informe uma quantidade para gerar a cotação.
                            </div>
                        )}
                        {quoteLoading && (
                            <div className="py-8 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />{' '}
                                Buscando cotação…
                            </div>
                        )}
                        {quote && !quoteLoading && (
                            <div className="space-y-3 text-sm">
                                <Row
                                    label="Você envia"
                                    value={`${fmtNumber(quote.amountIn, { token: quote.fromToken })} ${quote.fromToken}`}
                                />
                                <Row
                                    label={`Taxa (${quote.feePercent}%)`}
                                    value={`${fmtNumber(quote.feeAmount, { token: quote.feeToken })} ${quote.feeToken}`}
                                    testid="swap-quote-fee"
                                />
                                <Row
                                    label="Convertido (após taxa)"
                                    value={`${fmtNumber(quote.amountInAfterFee, { token: quote.fromToken })} ${quote.fromToken}`}
                                />
                                <Row
                                    label="Cotação"
                                    value={`1 ${quote.fromToken} = ${fmtRate(quote.rate, quote.toToken, 8)} ${quote.toToken}`}
                                    testid="swap-quote-rate"
                                />
                                <Separator />
                                <div className="flex items-end justify-between">
                                    <div className="text-muted-foreground text-xs">
                                        Você recebe
                                    </div>
                                    <div
                                        className="text-2xl font-display font-semibold tabular-nums"
                                        data-testid="swap-quote-to-total"
                                    >
                                        {fmtNumber(quote.amountOut, {
                                            token: quote.toToken,
                                        })}{' '}
                                        {quote.toToken}
                                    </div>
                                </div>
                                <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                                    <span>
                                        Atualizada em{' '}
                                        {new Date(
                                            quote.fetchedAt,
                                        ).toLocaleTimeString('pt-BR')}
                                    </span>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function Row({
    label,
    value,
    testid,
}: {
    label: string;
    value: string;
    testid?: string;
}) {
    return (
        <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">{label}</span>
            <span
                className="font-mono tabular-nums text-sm"
                data-testid={testid}
            >
                {value}
            </span>
        </div>
    );
}
