import { LogOut, Menu, UserCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/context/AuthContext';

interface HeaderProps {
    mobileOpen: boolean;
    setMobileOpen: (open: boolean) => void;
    currentTitle: string;
    brand: ReactNode;
    navList: ReactNode;
}

export default function Header({
    mobileOpen,
    setMobileOpen,
    currentTitle,
    brand,
    navList,
}: HeaderProps) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login', { replace: true });
    };

    return (
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
                    {brand}
                    {navList}
                </SheetContent>
            </Sheet>

            <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">
                    Nexus Wallet
                </span>
                <h1 className="text-sm font-semibold leading-none font-display">
                    {currentTitle}
                </h1>
            </div>

            <div className="ml-auto flex items-center gap-3">
                <div className="hidden sm:flex flex-col text-right mr-2">
                    <span
                        className="text-sm font-medium leading-none"
                        data-testid="topbar-user-name"
                    >
                        {user?.name ?? user?.email}
                    </span>
                    {user?.username && (
                        <span
                            className="text-[11px] text-muted-foreground mt-1"
                            data-testid="topbar-user-username"
                        >
                            @{user.username}
                        </span>
                    )}
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full"
                        >
                            <UserCircle className="h-6 w-6 text-muted-foreground" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => navigate('/profile')}>
                            <UserCircle className="mr-2 h-4 w-4" />
                            <span>Meu Perfil</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={handleLogout}
                            className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Sair</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
