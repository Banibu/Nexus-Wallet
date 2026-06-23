import { Loader2, RefreshCw, Repeat, Wallet } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { FormField } from '@/components/common/FormField';
import SectionHeader from '@/components/common/SectionHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { api, getUser, toastError } from '@/lib/api';
import { fmtDate, shortId } from '@/lib/format';

export default function DepositPage() {
    const [idempotencyKey, setKey] = useState(uuidv4());
    const [token, setToken] = useState('BTC');
    const [amount, setAmount] = useState('0.1');
    const [attempts, setAttempts] = useState<any[]>([]);
    const [sending, setSending] = useState(false);
    const user = getUser();

    const newKey = () => setKey(uuidv4());

    useEffect(() => {
        if (!user) return;
        try {
            const stored = JSON.parse(
                sessionStorage.getItem(`deposit_attempts_${user.id}`) || '[]',
            );
            setAttempts(stored);
        } catch {
            /* ignore */
        }
    }, [user?.id]);

    const saveAttempt = (a: any) => {
        setAttempts((prev) => {
            const next = [a, ...prev].slice(0, 20);
            if (user) {
                sessionStorage.setItem(
                    `deposit_attempts_${user.id}`,
                    JSON.stringify(next),
                );
            }
            return next;
        });
    };

    const fire = async (repeatSameKey = false) => {
        if (!user) return;
        setSending(true);
        const keyToUse = repeatSameKey ? idempotencyKey : uuidv4();
        if (!repeatSameKey) {
            setKey(keyToUse);
        }
        try {
            const { data } = await api.post('/webhooks/deposit', {
                userId: user.id,
                token,
                amount,
                idempotencyKey: keyToUse,
            });
            saveAttempt({
                at: new Date().toISOString(),
                key: keyToUse,
                token,
                amount,
                status: data.status,
                txId: data.transactionId,
                msg: data.message || null,
            });
            if (data.status === 'duplicate') {
                toast.info('Idempotency válida: depo não foi duplicado');
            } else {
                toast.success(`Depósito creditado • ${amount} ${token}`);
            }
        } catch (e) {
            toastError(e);
            saveAttempt({
                at: new Date().toISOString(),
                key: keyToUse,
                token,
                amount,
                status: 'error',
                msg: e?.response?.data?.error?.message || e.message,
            });
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="space-y-6">
            <SectionHeader
                title="Depósito via Webhook"
                subtitle="Simulação de depósitos para a sua carteira."
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-display flex items-center gap-2">
                            <Wallet className="h-5 w-5 text-primary" /> Disparar
                            webhook
                        </CardTitle>
                        <CardDescription>
                            Como esta é uma simulação para testes, o sistema
                            utiliza uma chave de idempotência gerada
                            automaticamente e dispara para a rota{' '}
                            <code className="bg-secondary px-1.5 py-0.5 rounded text-xs text-foreground font-mono">
                                POST /api/webhooks/deposit
                            </code>
                            .
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <FormField id="userId" label="userId (autenticado)">
                            <Input
                                id="userId"
                                value={user?.id || ''}
                                readOnly
                                className="font-mono text-xs"
                            />
                        </FormField>

                        <div className="grid grid-cols-2 gap-3">
                            <FormField id="token" label="Token">
                                <Select value={token} onValueChange={setToken}>
                                    <SelectTrigger
                                        id="token"
                                        data-testid="deposit-token-select"
                                    >
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="BRL">BRL</SelectItem>
                                        <SelectItem value="BTC">BTC</SelectItem>
                                        <SelectItem value="ETH">ETH</SelectItem>
                                        <SelectItem value="USDT">
                                            USDT
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </FormField>
                            <FormField id="amount" label="Amount">
                                <Input
                                    id="amount"
                                    inputMode="decimal"
                                    value={amount}
                                    onChange={(e) =>
                                        setAmount(
                                            e.target.value.replace(',', '.'),
                                        )
                                    }
                                    data-testid="deposit-amount-input"
                                />
                            </FormField>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <Button
                                onClick={() => fire(false)}
                                disabled={sending}
                                className="flex-1"
                                data-testid="deposit-fire-webhook-button"
                            >
                                {sending ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />{' '}
                                        Enviando…
                                    </>
                                ) : (
                                    'Simular depósito'
                                )}
                            </Button>
                            <Button
                                variant="secondary"
                                onClick={() => fire(true)}
                                disabled={sending}
                                data-testid="deposit-repeat-webhook-button"
                            >
                                <Repeat className="h-4 w-4 mr-1" /> Repetir
                                mesma key
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="font-display">
                            Tentativas (sessão)
                        </CardTitle>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                if (user)
                                    sessionStorage.removeItem(
                                        `deposit_attempts_${user.id}`,
                                    );
                                setAttempts([]);
                            }}
                        >
                            <RefreshCw className="h-3 w-3 mr-1" /> Limpar
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div
                            className="rounded-md border border-border overflow-x-auto"
                            data-testid="deposit-attempts-table"
                        >
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Hora</TableHead>
                                        <TableHead>Key</TableHead>
                                        <TableHead>Token</TableHead>
                                        <TableHead className="text-right">
                                            Valor
                                        </TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {attempts.length === 0 && (
                                        <TableRow>
                                            <TableCell
                                                colSpan={5}
                                                className="text-center text-sm text-muted-foreground py-6"
                                            >
                                                Sem tentativas ainda.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                    {attempts.map((a, i) => (
                                        <TableRow key={i}>
                                            <TableCell className="text-xs">
                                                {fmtDate(a.at)}
                                            </TableCell>
                                            <TableCell className="font-mono text-xs">
                                                {shortId(a.key)}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary">
                                                    {a.token}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-mono">
                                                {a.amount}
                                            </TableCell>
                                            <TableCell>
                                                {a.status === 'ok' && (
                                                    <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30">
                                                        creditado
                                                    </Badge>
                                                )}
                                                {a.status === 'duplicate' && (
                                                    <Badge variant="outline">
                                                        idempotente
                                                    </Badge>
                                                )}
                                                {a.status === 'error' && (
                                                    <Badge variant="destructive">
                                                        erro
                                                    </Badge>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
