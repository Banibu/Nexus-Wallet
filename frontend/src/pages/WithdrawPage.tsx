import { ArrowDownToLine, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { FormField } from '@/components/common/FormField';
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api, toastError } from '@/lib/api';
import { fmtDate, fmtNumber, shortId } from '@/lib/format';
import { getAmountInputError, normalizeApiAmount } from '@/lib/numberFormat';

export default function WithdrawPage() {
    const [token, setToken] = useState('BRL');
    const [amount, setAmount] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [recent, setRecent] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const parsedAmount = normalizeApiAmount(amount, token);
    const amountError = getAmountInputError(amount, token);

    // Form states for BRL
    const [brlMethod, setBrlMethod] = useState<'pix' | 'bank'>('pix');
    const [pixType, setPixType] = useState('cpf');
    const [pixKey, setPixKey] = useState('');
    const [bankName, setBankName] = useState('');
    const [branch, setBranch] = useState('');
    const [account, setAccount] = useState('');
    const [accountType, setAccountType] = useState('corrente');

    // Form states for Crypto (BTC / ETH / USDT)
    const [cryptoAddress, setCryptoAddress] = useState('');

    const loadRecent = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/transactions', {
                params: { type: 'WITHDRAWAL', limit: 10 },
            });
            setRecent(data.items);
        } catch (e) {
            toastError(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRecent();
    }, []);

    // Clear specific fields when token changes to avoid cross-submitting mismatched data
    useEffect(() => {
        setPixKey('');
        setCryptoAddress('');
        setBankName('');
        setBranch('');
        setAccount('');
    }, [token]);

    const submit = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        setSubmitting(true);

        let finalAddress = '';
        if (token === 'BRL') {
            if (brlMethod === 'pix') {
                if (!pixKey.trim()) {
                    toast.error('Chave PIX é obrigatória');
                    setSubmitting(false);
                    return;
                }
                finalAddress = `PIX (${pixType.toUpperCase()}): ${pixKey.trim()}`;
            } else {
                if (!bankName || !branch.trim() || !account.trim()) {
                    toast.error('Todos os dados bancários são obrigatórios');
                    setSubmitting(false);
                    return;
                }
                finalAddress = `Banco: ${bankName} | Ag: ${branch.trim()} | Cc: ${account.trim()} (${accountType === 'corrente' ? 'C/C' : 'Poupança'})`;
            }
        } else {
            if (!cryptoAddress.trim()) {
                toast.error(`Endereço de carteira ${token} é obrigatório`);
                setSubmitting(false);
                return;
            }
            finalAddress = cryptoAddress.trim();
        }

        const parsedAmount = normalizeApiAmount(amount, token);
        if (!parsedAmount) {
            toast.error('Valor de saque inválido');
            setSubmitting(false);
            return;
        }

        try {
            const { data } = await api.post('/withdrawals', {
                token,
                amount: parsedAmount,
                destinationAddress: finalAddress,
            });
            toast.success(
                `Saque registrado: ${fmtNumber(data.amount, { token: data.token })} ${data.token}`,
            );
            setAmount('');
            setPixKey('');
            setCryptoAddress('');
            setBranch('');
            setAccount('');
            loadRecent();
        } catch (err) {
            toastError(err);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <SectionHeader
                title="Solicitar Saque"
                subtitle="Debita o saldo e registra a movimentação correspondente na sua conta."
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="font-display flex items-center gap-2">
                            <ArrowDownToLine className="h-5 w-5 text-primary" />{' '}
                            Novo saque
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-4">
                            <FormField id="token" label="Token">
                                <Select value={token} onValueChange={setToken}>
                                    <SelectTrigger
                                        id="token"
                                        data-testid="withdraw-token-select"
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
                            <FormField id="amount" label="Quantidade">
                                <Input
                                    id="amount"
                                    inputMode="decimal"
                                    placeholder={
                                        token === 'BRL' ? '0,00' : '0.00'
                                    }
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    data-testid="withdraw-amount-input"
                                    className={
                                        amountError
                                            ? 'border-destructive focus-visible:ring-destructive'
                                            : ''
                                    }
                                />
                                {amountError && (
                                    <p className="text-xs text-destructive mt-1">
                                        {amountError}
                                    </p>
                                )}
                            </FormField>
                            {token === 'BRL' ? (
                                <div className="space-y-4 border-t border-border pt-4">
                                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                        Destinatário
                                    </Label>
                                    <Tabs
                                        value={brlMethod}
                                        onValueChange={(val) =>
                                            setBrlMethod(val as 'pix' | 'bank')
                                        }
                                        className="w-full"
                                    >
                                        <TabsList className="grid grid-cols-2 w-full">
                                            <TabsTrigger value="pix">
                                                PIX
                                            </TabsTrigger>
                                            <TabsTrigger value="bank">
                                                Dados Bancários
                                            </TabsTrigger>
                                        </TabsList>
                                        <TabsContent
                                            value="pix"
                                            className="space-y-3 pt-2"
                                        >
                                            <FormField
                                                id="pixType"
                                                label="Tipo de Chave PIX"
                                            >
                                                <Select
                                                    value={pixType}
                                                    onValueChange={setPixType}
                                                >
                                                    <SelectTrigger
                                                        id="pixType"
                                                        data-testid="withdraw-pix-type-select"
                                                    >
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="cpf">
                                                            CPF
                                                        </SelectItem>
                                                        <SelectItem value="cnpj">
                                                            CNPJ
                                                        </SelectItem>
                                                        <SelectItem value="email">
                                                            E-mail
                                                        </SelectItem>
                                                        <SelectItem value="phone">
                                                            Telefone
                                                        </SelectItem>
                                                        <SelectItem value="key">
                                                            Chave Aleatória
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </FormField>
                                            <FormField
                                                id="pixKey"
                                                label="Chave PIX"
                                            >
                                                <Input
                                                    id="pixKey"
                                                    placeholder={
                                                        pixType === 'cpf'
                                                            ? '000.000.000-00'
                                                            : pixType === 'cnpj'
                                                              ? '00.000.000/0000-00'
                                                              : pixType ===
                                                                  'email'
                                                                ? 'exemplo@email.com'
                                                                : pixType ===
                                                                    'phone'
                                                                  ? '+55 (11) 99999-9999'
                                                                  : 'Chave aleatória'
                                                    }
                                                    value={pixKey}
                                                    onChange={(e) =>
                                                        setPixKey(
                                                            e.target.value,
                                                        )
                                                    }
                                                    data-testid="withdraw-pix-key-input"
                                                />
                                            </FormField>
                                        </TabsContent>
                                        <TabsContent
                                            value="bank"
                                            className="space-y-3 pt-2"
                                        >
                                            <FormField
                                                id="bankName"
                                                label="Banco"
                                            >
                                                <Select
                                                    value={bankName}
                                                    onValueChange={setBankName}
                                                >
                                                    <SelectTrigger
                                                        id="bankName"
                                                        data-testid="withdraw-bank-name-select"
                                                    >
                                                        <SelectValue placeholder="Selecione o banco" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Itaú Unibanco">
                                                            Itaú Unibanco (341)
                                                        </SelectItem>
                                                        <SelectItem value="Bradesco">
                                                            Bradesco (237)
                                                        </SelectItem>
                                                        <SelectItem value="Banco do Brasil">
                                                            Banco do Brasil
                                                            (001)
                                                        </SelectItem>
                                                        <SelectItem value="Santander">
                                                            Santander Brasil
                                                            (033)
                                                        </SelectItem>
                                                        <SelectItem value="Caixa Econômica">
                                                            Caixa Econômica
                                                            (104)
                                                        </SelectItem>
                                                        <SelectItem value="Nubank">
                                                            Nubank (260)
                                                        </SelectItem>
                                                        <SelectItem value="Banco Inter">
                                                            Banco Inter (077)
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </FormField>
                                            <div className="grid grid-cols-2 gap-2">
                                                <FormField
                                                    id="branch"
                                                    label="Agência"
                                                >
                                                    <Input
                                                        id="branch"
                                                        placeholder="0001"
                                                        value={branch}
                                                        onChange={(e) =>
                                                            setBranch(
                                                                e.target.value,
                                                            )
                                                        }
                                                        data-testid="withdraw-branch-input"
                                                    />
                                                </FormField>
                                                <FormField
                                                    id="account"
                                                    label="Conta + Dígito"
                                                >
                                                    <Input
                                                        id="account"
                                                        placeholder="12345-6"
                                                        value={account}
                                                        onChange={(e) =>
                                                            setAccount(
                                                                e.target.value,
                                                            )
                                                        }
                                                        data-testid="withdraw-account-input"
                                                    />
                                                </FormField>
                                            </div>
                                            <FormField
                                                id="accountType"
                                                label="Tipo de Conta"
                                            >
                                                <Select
                                                    value={accountType}
                                                    onValueChange={
                                                        setAccountType
                                                    }
                                                >
                                                    <SelectTrigger
                                                        id="accountType"
                                                        data-testid="withdraw-account-type-select"
                                                    >
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="corrente">
                                                            Conta Corrente
                                                        </SelectItem>
                                                        <SelectItem value="poupança">
                                                            Conta Poupança
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </FormField>
                                        </TabsContent>
                                    </Tabs>
                                </div>
                            ) : (
                                <div className="space-y-4 border-t border-border pt-4">
                                    <FormField
                                        id="cryptoAddress"
                                        label={`Endereço de Carteira (${token})`}
                                    >
                                        <Input
                                            id="cryptoAddress"
                                            placeholder={
                                                token === 'BTC'
                                                    ? 'ex: 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'
                                                    : 'ex: 0x71C563D5F8F15351D4965eB87b4010373E7356c9'
                                            }
                                            value={cryptoAddress}
                                            onChange={(e) =>
                                                setCryptoAddress(e.target.value)
                                            }
                                            data-testid="withdraw-crypto-address-input"
                                            className="font-mono text-xs"
                                        />
                                        <p className="text-[11px] text-muted-foreground">
                                            Certifique-se de utilizar a rede
                                            correta para transferências de{' '}
                                            {token}.
                                        </p>
                                    </FormField>
                                </div>
                            )}
                            <Button
                                type="submit"
                                className="w-full"
                                disabled={submitting || !parsedAmount}
                                data-testid="withdraw-submit-button"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />{' '}
                                        Processando…
                                    </>
                                ) : (
                                    'Solicitar saque'
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="font-display">
                            Saques recentes
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border border-border overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Data</TableHead>
                                        <TableHead>Token</TableHead>
                                        <TableHead className="text-right">
                                            Valor
                                        </TableHead>
                                        <TableHead>Destino</TableHead>
                                        <TableHead>TX</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading && (
                                        <TableRow>
                                            <TableCell
                                                colSpan={5}
                                                className="text-center text-sm text-muted-foreground py-6"
                                            >
                                                Carregando…
                                            </TableCell>
                                        </TableRow>
                                    )}
                                    {!loading && recent.length === 0 && (
                                        <TableRow>
                                            <TableCell
                                                colSpan={5}
                                                className="text-center text-sm text-muted-foreground py-6"
                                            >
                                                Nenhum saque ainda.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                    {recent.map((t) => (
                                        <TableRow
                                            key={t.id}
                                            data-testid={`withdraw-row-${t.id}`}
                                        >
                                            <TableCell className="text-sm">
                                                {fmtDate(t.createdAt)}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary">
                                                    {t.tokenFrom}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-mono tabular-nums">
                                                {fmtNumber(t.amountFrom, {
                                                    token: t.tokenFrom,
                                                })}
                                            </TableCell>
                                            <TableCell
                                                className="text-xs max-w-[180px] truncate font-mono text-muted-foreground"
                                                title={
                                                    t.metadata
                                                        ?.destinationAddress ||
                                                    '-'
                                                }
                                            >
                                                {t.metadata
                                                    ?.destinationAddress || (
                                                    <span className="text-muted-foreground italic">
                                                        -
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell className="font-mono text-xs text-muted-foreground">
                                                {shortId(t.id)}
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
