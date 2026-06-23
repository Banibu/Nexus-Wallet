import {
    KeyRound,
    Loader2,
    Mail,
    ShieldAlert,
    ShieldCheck,
    Smartphone,
    UserCircle,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
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
import { useAuth } from '@/context/AuthContext';
import { api, apiErrorMessage } from '@/lib/api';

export default function ProfilePage() {
    const { user, updateUser } = useAuth();

    // 2FA Flow states
    const [isGenerating, setIsGenerating] = useState(false);
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [secret, setSecret] = useState('');

    const [stepCode, setStepCode] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showDisableForm, setShowDisableForm] = useState(false);

    if (!user) return null;

    const handleGenerate2FA = async () => {
        setIsGenerating(true);
        try {
            const { data } = await api.post('/auth/2fa/generate');
            setQrCodeUrl(data.qrCodeUrl);
            setSecret(data.secret);
        } catch (err) {
            toast.error(apiErrorMessage(err));
        } finally {
            setIsGenerating(false);
        }
    };

    const handleEnable2FA = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.post('/auth/2fa/enable', { code: stepCode });
            updateUser({ twoFactorEnabled: true });
            toast.success('Autenticação de Dois Fatores ativada com sucesso!');
            setQrCodeUrl('');
            setSecret('');
            setStepCode('');
        } catch (err) {
            toast.error(apiErrorMessage(err));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDisable2FA = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.post('/auth/2fa/disable', { code: stepCode });
            updateUser({ twoFactorEnabled: false });
            toast.success('Autenticação de Dois Fatores desativada.');
            setShowDisableForm(false);
            setStepCode('');
        } catch (err) {
            toast.error(apiErrorMessage(err));
        } finally {
            setIsSubmitting(false);
        }
    };

    const cancelSetup = () => {
        setQrCodeUrl('');
        setSecret('');
        setStepCode('');
    };

    return (
        <div className="space-y-6">
            <SectionHeader
                title="Meu Perfil"
                subtitle="Gerencie suas informações e segurança da conta."
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-display flex items-center gap-2">
                            <UserCircle className="h-5 w-5 text-primary" />{' '}
                            Dados Pessoais
                        </CardTitle>
                        <CardDescription>
                            Informações básicas do seu perfil na Nexus.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                                <span className="text-2xl font-bold font-display uppercase">
                                    {(user.name || user.email).charAt(0)}
                                </span>
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold">
                                    {user.name || 'Usuário Nexus'}
                                </h3>
                                {user.username && (
                                    <p className="text-muted-foreground">
                                        @{user.username}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-border">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Mail className="h-4 w-4" /> Email
                                </div>
                                <span className="font-medium text-sm">
                                    {user.email}
                                </span>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <ShieldCheck className="h-4 w-4" /> Status
                                    da Conta
                                </div>
                                <Badge
                                    variant="secondary"
                                    className="bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25"
                                >
                                    Verificada
                                </Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="font-display flex items-center gap-2">
                            <KeyRound className="h-5 w-5 text-primary" />{' '}
                            Segurança (2FA)
                        </CardTitle>
                        <CardDescription>
                            Proteja sua conta com Autenticação de Duas Etapas.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {user.twoFactorEnabled ? (
                            <div className="space-y-4">
                                <div className="rounded-lg bg-emerald-500/10 p-4 flex flex-col items-center justify-center text-center border border-emerald-500/20">
                                    <ShieldCheck className="h-8 w-8 text-emerald-500 mb-2" />
                                    <h4 className="font-medium text-sm text-emerald-600">
                                        Autenticador Ativado
                                    </h4>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Sua conta está protegida. Você fará
                                        login pelo aplicativo em vez de senha.
                                    </p>
                                </div>

                                {!showDisableForm ? (
                                    <Button
                                        variant="outline"
                                        className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                                        onClick={() => setShowDisableForm(true)}
                                    >
                                        Desativar 2FA
                                    </Button>
                                ) : (
                                    <form
                                        onSubmit={handleDisable2FA}
                                        className="space-y-3 p-4 border border-border rounded-lg bg-secondary/20"
                                    >
                                        <div className="space-y-1">
                                            <Label htmlFor="disableCode">
                                                Código do Autenticador
                                            </Label>
                                            <Input
                                                id="disableCode"
                                                type="text"
                                                inputMode="numeric"
                                                placeholder="000000"
                                                maxLength={6}
                                                required
                                                value={stepCode}
                                                onChange={(e) =>
                                                    setStepCode(
                                                        e.target.value.replace(
                                                            /\D/g,
                                                            '',
                                                        ),
                                                    )
                                                }
                                                className="tracking-widest"
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                type="submit"
                                                variant="destructive"
                                                className="flex-1"
                                                disabled={isSubmitting}
                                            >
                                                {isSubmitting ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    'Confirmar'
                                                )}
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                onClick={() => {
                                                    setShowDisableForm(false);
                                                    setStepCode('');
                                                }}
                                                disabled={isSubmitting}
                                            >
                                                Cancelar
                                            </Button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        ) : qrCodeUrl ? (
                            <form
                                onSubmit={handleEnable2FA}
                                className="space-y-4"
                            >
                                <div className="text-center text-sm text-muted-foreground">
                                    Escaneie o QR Code abaixo com o Google
                                    Authenticator ou Authy.
                                </div>
                                <div className="flex justify-center bg-white p-2 rounded-lg w-fit mx-auto">
                                    <img
                                        src={qrCodeUrl}
                                        alt="QR Code"
                                        className="w-32 h-32"
                                    />
                                </div>
                                <div className="text-center text-xs text-muted-foreground break-all">
                                    <span className="font-semibold block mb-1">
                                        Chave Manual:
                                    </span>
                                    {secret}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="enableCode">
                                        Código de 6 dígitos
                                    </Label>
                                    <Input
                                        id="enableCode"
                                        type="text"
                                        inputMode="numeric"
                                        placeholder="000000"
                                        maxLength={6}
                                        required
                                        value={stepCode}
                                        onChange={(e) =>
                                            setStepCode(
                                                e.target.value.replace(
                                                    /\D/g,
                                                    '',
                                                ),
                                            )
                                        }
                                        className="text-center tracking-widest text-lg"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        type="submit"
                                        className="flex-1"
                                        disabled={
                                            isSubmitting ||
                                            stepCode.length !== 6
                                        }
                                    >
                                        {isSubmitting ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            'Ativar'
                                        )}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={cancelSetup}
                                        disabled={isSubmitting}
                                    >
                                        Cancelar
                                    </Button>
                                </div>
                            </form>
                        ) : (
                            <div className="space-y-4">
                                <div className="rounded-lg bg-secondary/50 p-4 flex flex-col items-center justify-center text-center">
                                    <ShieldAlert className="h-8 w-8 text-amber-500 mb-2" />
                                    <h4 className="font-medium text-sm">
                                        Proteção Desativada
                                    </h4>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Ative o 2FA para proteger sua conta e
                                        permitir logins rápidos sem senha via
                                        aplicativo (Google Authenticator, Authy,
                                        etc).
                                    </p>
                                </div>
                                <Button
                                    className="w-full"
                                    onClick={handleGenerate2FA}
                                    disabled={isGenerating}
                                >
                                    {isGenerating ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />{' '}
                                            Aguarde…
                                        </>
                                    ) : (
                                        <>
                                            <Smartphone className="h-4 w-4 mr-2" />{' '}
                                            Configurar Autenticador
                                        </>
                                    )}
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
