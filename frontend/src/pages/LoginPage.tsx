import { ArrowLeft, Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import { useAuth } from '@/context/AuthContext';
import { apiErrorMessage } from '@/lib/api';

type Step = 'email' | 'password' | 'code';

export default function LoginPage() {
    const navigate = useNavigate();
    const { checkEmail, login, loginTotp } = useAuth();

    const [step, setStep] = useState<Step>('email');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [code, setCode] = useState('');

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const onEmailSubmit = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        if (!email.trim()) return;

        setError('');
        setLoading(true);
        try {
            const { twoFactorEnabled } = await checkEmail(email);
            if (twoFactorEnabled) {
                setStep('code');
            } else {
                setStep('password');
            }
        } catch (err) {
            setError(apiErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    const onPasswordSubmit = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await login(email, password, true);
            if (res.requires2FA) {
                // Should not happen with new flow, but just in case
                setStep('code');
            } else {
                toast.success('Login realizado');
                navigate('/dashboard', { replace: true });
            }
        } catch (err) {
            setError(apiErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    const onCodeSubmit = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        setError('');
        if (code.length !== 6) {
            setError('Informe o código de 6 dígitos.');
            return;
        }
        setLoading(true);
        try {
            await loginTotp(email, code, true);
            toast.success('Login realizado');
            navigate('/dashboard', { replace: true });
        } catch (err) {
            setError(apiErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout>
            <Card className="border-border">
                <CardHeader>
                    {step === 'email' && (
                        <>
                            <CardTitle className="font-display text-2xl">
                                Entrar
                            </CardTitle>
                            <CardDescription>
                                Insira seu email para acessar a carteira
                            </CardDescription>
                        </>
                    )}
                    {step === 'password' && (
                        <>
                            <div className="flex items-center mb-2">
                                <button
                                    type="button"
                                    onClick={() => setStep('email')}
                                    className="text-muted-foreground hover:text-foreground mr-2"
                                >
                                    <ArrowLeft className="h-5 w-5" />
                                </button>
                                <CardTitle className="font-display text-2xl">
                                    Digite sua senha
                                </CardTitle>
                            </div>
                            <CardDescription>{email}</CardDescription>
                        </>
                    )}
                    {step === 'code' && (
                        <>
                            <div className="flex items-center mb-2">
                                <button
                                    type="button"
                                    onClick={() => setStep('email')}
                                    className="text-muted-foreground hover:text-foreground mr-2"
                                >
                                    <ArrowLeft className="h-5 w-5" />
                                </button>
                                <CardTitle className="font-display text-2xl">
                                    Verificação em Duas Etapas
                                </CardTitle>
                            </div>
                            <CardDescription>
                                Sua conta possui 2FA ativo
                            </CardDescription>
                        </>
                    )}
                </CardHeader>
                <CardContent>
                    {error && (
                        <Alert variant="destructive" className="mb-4">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {step === 'email' && (
                        <form onSubmit={onEmailSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    autoComplete="email"
                                    placeholder="voce@email.com"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <Button
                                type="submit"
                                className="w-full mt-4"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />{' '}
                                        Verificando…
                                    </>
                                ) : (
                                    'Continuar'
                                )}
                            </Button>
                        </form>
                    )}

                    {step === 'password' && (
                        <form onSubmit={onPasswordSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="password">Senha</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={
                                            showPassword ? 'text' : 'password'
                                        }
                                        autoComplete="current-password"
                                        placeholder="••••••••"
                                        required
                                        value={password}
                                        onChange={(e) =>
                                            setPassword(e.target.value)
                                        }
                                        className="pr-10"
                                        autoFocus
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowPassword(!showPassword)
                                        }
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                            </div>
                            <Button
                                type="submit"
                                className="w-full mt-4"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />{' '}
                                        Entrando…
                                    </>
                                ) : (
                                    'Entrar'
                                )}
                            </Button>
                        </form>
                    )}

                    {step === 'code' && (
                        <form onSubmit={onCodeSubmit} className="space-y-4">
                            <div className="flex justify-center mb-4 text-primary">
                                <ShieldCheck className="h-12 w-12" />
                            </div>
                            <div className="text-center mb-6">
                                <p className="text-sm text-muted-foreground mt-1">
                                    Insira o código de 6 dígitos gerado pelo seu
                                    aplicativo autenticador para o email{' '}
                                    <strong>{email}</strong>.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="code">
                                    Código de Autenticação
                                </Label>
                                <Input
                                    id="code"
                                    type="text"
                                    inputMode="numeric"
                                    placeholder="000000"
                                    maxLength={6}
                                    required
                                    value={code}
                                    onChange={(e) =>
                                        setCode(
                                            e.target.value.replace(/\D/g, ''),
                                        )
                                    }
                                    className="text-center tracking-widest text-lg"
                                    autoFocus
                                />
                            </div>
                            <Button
                                type="submit"
                                className="w-full mt-4"
                                disabled={loading || code.length !== 6}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />{' '}
                                        Entrando…
                                    </>
                                ) : (
                                    'Entrar'
                                )}
                            </Button>
                        </form>
                    )}

                    {step === 'email' && (
                        <div className="mt-5 text-sm text-center text-muted-foreground">
                            Não tem conta?{' '}
                            <Link
                                to="/register"
                                className="text-primary hover:underline"
                            >
                                Criar conta
                            </Link>
                        </div>
                    )}
                </CardContent>
            </Card>
        </AuthLayout>
    );
}
