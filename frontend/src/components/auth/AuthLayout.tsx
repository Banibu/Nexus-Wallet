import { ReactNode } from 'react';
import { Wallet, ShieldCheck, Zap, LineChart, Lock } from 'lucide-react';

const FEATURES = [
    { icon: ShieldCheck, label: 'Segurança de nível bancário' },
    { icon: Zap, label: 'Conversões em tempo real entre BRL, BTC e ETH' },
    { icon: LineChart, label: 'Extrato completo e transparente das suas operações' },
    { icon: Lock, label: 'Autenticação moderna com sessões protegidas' },
];

export function AuthSidebar() {
    return (
        <div className="hidden lg:flex flex-col justify-between p-10 bg-card border-r border-border relative overflow-hidden">
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    backgroundImage:
                        'radial-gradient(800px circle at 20% 0%, hsla(173,78%,36%,0.18), transparent 55%), radial-gradient(600px circle at 90% 100%, hsla(84,85%,55%,0.08), transparent 60%)',
                }}
            />
            <div className="relative">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 ring-1 ring-primary/30">
                        <Wallet className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <div className="font-display text-2xl font-semibold tracking-tight">Nexus Wallet</div>
                        <div className="text-xs text-muted-foreground uppercase tracking-widest">
                            Fintech · Crypto
                        </div>
                    </div>
                </div>
                <h1 className="mt-12 font-display text-4xl xl:text-5xl font-semibold leading-tight tracking-tight">
                    Sua carteira cripto,<br />
                    <span className="text-primary">simples</span> e em tempo real.
                </h1>
                <p className="mt-4 text-muted-foreground max-w-md">
                    Gerencie BRL, BTC e ETH em um único lugar. Receba depósitos, converta entre
                    ativos e realize saques com extrato detalhado de todas as suas operações.
                </p>
                <ul className="mt-8 space-y-3">
                    {FEATURES.map((f) => {
                        const Icon = f.icon;
                        return (
                            <li key={f.label} className="flex items-center gap-3 text-sm">
                                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                                    <Icon className="h-4 w-4" />
                                </div>
                                <span>{f.label}</span>
                            </li>
                        );
                    })}
                </ul>
            </div>
            <div className="relative text-xs text-muted-foreground">
                © {new Date().getFullYear()} Nexus Wallet. Todos os direitos reservados.
            </div>
        </div>
    );
}

export function AuthLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen grid lg:grid-cols-2">
            <AuthSidebar />
            <div className="flex items-center justify-center p-6 sm:p-10">
                <div className="w-full max-w-md">
                    <div className="flex items-center gap-2 lg:hidden mb-6">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 ring-1 ring-primary/30">
                            <Wallet className="h-5 w-5 text-primary" />
                        </div>
                        <div className="font-display font-semibold text-lg">Nexus Wallet</div>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}
