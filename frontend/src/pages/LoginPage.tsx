import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { apiErrorMessage } from '@/lib/api';
import { AuthLayout } from '@/components/auth/AuthLayout';

export default function LoginPage() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const onSubmit = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password);
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
                    <CardTitle className="font-display text-2xl">Entrar</CardTitle>
                    <CardDescription>Use suas credenciais para acessar a carteira</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={onSubmit} className="space-y-4">
                        {error && (
                            <Alert variant="destructive" data-testid="login-error-alert">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
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
                                data-testid="login-email-input"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Senha</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="current-password"
                                    placeholder="••••••••"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    data-testid="login-password-input"
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={loading}
                            data-testid="login-submit-button"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Entrando…
                                </>
                            ) : (
                                'Entrar'
                            )}
                        </Button>
                    </form>
                    <div className="mt-5 text-sm text-center text-muted-foreground">
                        Não tem conta?{' '}
                        <Link
                            to="/register"
                            className="text-primary hover:underline"
                            data-testid="login-register-link"
                        >
                            Criar conta
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </AuthLayout>
    );
}
