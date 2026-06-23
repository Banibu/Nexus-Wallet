import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { apiErrorMessage } from '@/lib/api';
import { AuthLayout } from '@/components/auth/AuthLayout';

export default function RegisterPage() {
    const navigate = useNavigate();
    const { register } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const submit = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        setError('');
        if (password.length < 6) {
            setError('Senha deve ter pelo menos 6 caracteres');
            return;
        }
        if (password !== confirm) {
            setError('Senhas não conferem');
            return;
        }
        setLoading(true);
        try {
            await register(email, password);
            toast.success('Conta criada com sucesso');
            navigate('/dashboard', { replace: true });
        } catch (err) {
            setError(apiErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout>
            <Card>
                <CardHeader>
                    <CardTitle className="font-display text-2xl">Criar conta</CardTitle>
                    <CardDescription>Sua carteira será criada com BRL, BTC e ETH zerados</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={submit} className="space-y-4">
                        {error && (
                            <Alert variant="destructive" data-testid="register-error-alert">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                data-testid="register-email-input"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Senha</Label>
                            <Input
                                id="password"
                                type="password"
                                required
                                minLength={6}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                data-testid="register-password-input"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirm">Confirmar senha</Label>
                            <Input
                                id="confirm"
                                type="password"
                                required
                                minLength={6}
                                value={confirm}
                                onChange={(e) => setConfirm(e.target.value)}
                                data-testid="register-confirm-input"
                            />
                        </div>
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={loading}
                            data-testid="register-submit-button"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Criando…
                                </>
                            ) : (
                                'Criar conta'
                            )}
                        </Button>
                    </form>
                    <div className="mt-4 text-sm text-center text-muted-foreground">
                        Já tem conta?{' '}
                        <Link to="/login" className="text-primary hover:underline">Entrar</Link>
                    </div>
                </CardContent>
            </Card>
        </AuthLayout>
    );
}
