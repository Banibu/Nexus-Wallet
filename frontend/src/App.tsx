import type { ReactElement } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import '@/App.css';
import AppShell from '@/components/layout/AppShell';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import AuditPage from '@/pages/AuditPage';
import DashboardPage from '@/pages/DashboardPage';
import DepositPage from '@/pages/DepositPage';
import LoginPage from '@/pages/LoginPage';
import ProfilePage from '@/pages/ProfilePage';
import RegisterPage from '@/pages/RegisterPage';
import SwapPage from '@/pages/SwapPage';
import TransactionsPage from '@/pages/TransactionsPage';
import WithdrawPage from '@/pages/WithdrawPage';

// ─── Route Guards ─────────────────────────────────────────────────────────────

function AuthGate() {
    return (
        <div className="min-h-screen grid place-items-center bg-background text-muted-foreground">
            Carregando sessão…
        </div>
    );
}

function PrivateRoute({ children }: { children: ReactElement }) {
    const { user, authReady } = useAuth();
    if (!authReady) return <AuthGate />;
    return user ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }: { children: ReactElement }) {
    const { user, authReady } = useAuth();
    if (!authReady) return <AuthGate />;
    return user ? <Navigate to="/dashboard" replace /> : children;
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Toaster
                    theme="dark"
                    position="bottom-center"
                    richColors
                    closeButton
                />
                <Routes>
                    <Route
                        path="/login"
                        element={
                            <PublicRoute>
                                <LoginPage />
                            </PublicRoute>
                        }
                    />
                    <Route
                        path="/register"
                        element={
                            <PublicRoute>
                                <RegisterPage />
                            </PublicRoute>
                        }
                    />

                    <Route
                        element={
                            <PrivateRoute>
                                <AppShell />
                            </PrivateRoute>
                        }
                    >
                        <Route
                            index
                            element={<Navigate to="/dashboard" replace />}
                        />
                        <Route path="/dashboard" element={<DashboardPage />} />
                        <Route path="/swap" element={<SwapPage />} />
                        <Route path="/withdraw" element={<WithdrawPage />} />
                        <Route path="/deposit" element={<DepositPage />} />
                        <Route
                            path="/transactions"
                            element={<TransactionsPage />}
                        />
                        <Route path="/audit" element={<AuditPage />} />
                        <Route path="/profile" element={<ProfilePage />} />
                    </Route>

                    <Route
                        path="*"
                        element={<Navigate to="/dashboard" replace />}
                    />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}
