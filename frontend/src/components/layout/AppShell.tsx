import {
    ArrowDownToLine,
    ArrowLeftRight,
    History,
    LayoutDashboard,
    Receipt,
    ShieldCheck,
    Wallet,
} from 'lucide-react';
import { type ElementType, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import Header from './Header';

// ─── Navigation Config ────────────────────────────────────────────────────────

interface NavItem {
    to: string;
    label: string;
    icon: ElementType;
    testid: string;
}

const NAV_ITEMS: NavItem[] = [
    {
        to: '/dashboard',
        label: 'Dashboard',
        icon: LayoutDashboard,
        testid: 'nav-dashboard',
    },
    { to: '/swap', label: 'Swap', icon: ArrowLeftRight, testid: 'nav-swap' },
    {
        to: '/withdraw',
        label: 'Saque',
        icon: ArrowDownToLine,
        testid: 'nav-withdraw',
    },
    { to: '/deposit', label: 'Depósito', icon: Wallet, testid: 'nav-deposit' },
    {
        to: '/transactions',
        label: 'Transações',
        icon: Receipt,
        testid: 'nav-transactions',
    },
    {
        to: '/audit',
        label: 'Auditoria',
        icon: ShieldCheck,
        testid: 'nav-audit',
    },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function Brand() {
    return (
        <div className="flex items-center gap-2 px-3 py-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 ring-1 ring-primary/30">
                <Wallet className="h-5 w-5 text-primary" />
            </div>
            <div className="flex flex-col leading-tight">
                <span className="font-display font-semibold tracking-tight">
                    Nexus Wallet
                </span>
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Fintech · Crypto
                </span>
            </div>
        </div>
    );
}

function NavList({ onItemClick }: { onItemClick?: () => void }) {
    return (
        <nav className="flex flex-col gap-1 px-2" data-testid="app-sidebar">
            {NAV_ITEMS.map(({ to, label, icon: Icon, testid }) => (
                <NavLink
                    key={to}
                    to={to}
                    data-testid={testid}
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
                    <span>{label}</span>
                </NavLink>
            ))}
        </nav>
    );
}

// ─── AppShell ─────────────────────────────────────────────────────────────────

export default function AppShell() {
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);

    const currentTitle =
        NAV_ITEMS.find((n) => location.pathname.startsWith(n.to))?.label ??
        'Dashboard';

    return (
        <div className="min-h-screen flex bg-background text-foreground">
            <aside className="hidden md:flex md:w-64 md:flex-col md:border-r md:border-border md:bg-card">
                <Brand />
                <NavList />
                <div className="mt-auto p-4 text-[11px] text-muted-foreground">
                    © {new Date().getFullYear()} Nexus Wallet
                </div>
            </aside>

            <div className="flex flex-1 flex-col min-w-0">
                <Header
                    mobileOpen={mobileOpen}
                    setMobileOpen={setMobileOpen}
                    currentTitle={currentTitle}
                    brand={<Brand />}
                    navList={
                        <NavList onItemClick={() => setMobileOpen(false)} />
                    }
                />

                <main className="flex-1 p-4 sm:p-6 lg:p-8">
                    <div className="max-w-6xl mx-auto w-full">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
