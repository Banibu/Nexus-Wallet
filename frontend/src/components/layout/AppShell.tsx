import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
    LayoutDashboard,
    ArrowLeftRight,
    Wallet,
    ArrowDownToLine,
    History,
    Receipt,
    ShieldCheck,
    LogOut,
    Menu,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';

const NAV_ITEMS = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, testid: 'nav-dashboard' },
    { to: '/swap', label: 'Swap', icon: ArrowLeftRight, testid: 'nav-swap' },
    { to: '/withdraw', label: 'Saque', icon: ArrowDownToLine, testid: 'nav-withdraw' },
    { to: '/deposit', label: 'Depósito', icon: Wallet, testid: 'nav-deposit' },
    { to: '/movements', label: 'Movimentações', icon: History, testid: 'nav-movements' },
    { to: '/transactions', label: 'Transações', icon: Receipt, testid: 'nav-transactions' },
    { to: '/audit', label: 'Auditoria', icon: ShieldCheck, testid: 'nav-audit' },
];

function NavList({ onItemClick }: { onItemClick?: () => void } = {}) {
    return (
        <nav className="flex flex-col gap-1 px-2" data-testid="app-sidebar">
            {NAV_ITEMS.map((it) => {
                const Icon = it.icon;
                return (
                    <NavLink
                        key={it.to}
                        to={it.to}
                        data-testid={it.testid}
                        onClick={onItemClick}
                        className={({ isActive }) =>
                            `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                                isActive
                                    ? 'bg-accent text-accent-foreground border-l-2 border-primary pl-[10px]'
                                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                            }`
                        }
                    >
                        <Icon className="h-4 w-4" />
                        <span>{it.label}</span>
                    </NavLink>
                );
            })}
        </nav>
    );
}

function Brand() {
    return (
        <div className="flex items-center gap-2 px-3 py-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 ring-1 ring-primary/30">
                <Wallet className="h-5 w-5 text-primary" />
            </div>
            <div className="flex flex-col leading-tight">
                <span className="font-display font-semibold tracking-tight">Nexus Wallet</span>
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Fintech · Crypto
                </span>
            </div>
        </div>
    );
}



export default function AppShell() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);

    const currentTitle =
        NAV_ITEMS.find((n) => location.pathname.startsWith(n.to))?.label || 'Dashboard';

    const handleLogout = async () => {
        await logout();
        navigate('/login', { replace: true });
    };

    return (
        <div className="min-h-screen flex bg-background text-foreground">
            {/* Desktop sidebar */}
            <aside className="hidden md:flex md:w-64 md:flex-col md:border-r md:border-border md:bg-card">
                <Brand />
                <NavList />
                <div className="mt-auto p-4 text-[11px] text-muted-foreground">
                    © {new Date().getFullYear()} Nexus Wallet
                </div>
            </aside>

            <div className="flex flex-1 flex-col min-w-0">
                {/* Topbar */}
                <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/85 backdrop-blur px-4">
                    <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                        <SheetTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="md:hidden"
                                data-testid="topbar-mobile-menu"
                            >
                                <Menu className="h-5 w-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-72 p-0 bg-card">
                            <Brand />
                            <NavList onItemClick={() => setMobileOpen(false)} />
                        </SheetContent>
                    </Sheet>
                    <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">Nexus Wallet</span>
                        <h1 className="text-sm font-semibold leading-none font-display">
                            {currentTitle}
                        </h1>
                    </div>
                    <div className="ml-auto flex items-center gap-3">
                        <span
                            className="hidden sm:inline-block text-xs text-muted-foreground max-w-[180px] truncate"
                            data-testid="topbar-user-email"
                        >
                            {user?.email}
                        </span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleLogout}
                            data-testid="topbar-logout-button"
                        >
                            <LogOut className="h-4 w-4 mr-1.5" /> Sair
                        </Button>
                    </div>
                </header>

                <main className="flex-1 p-4 sm:p-6 lg:p-8">
                    <div className="max-w-6xl mx-auto w-full">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
