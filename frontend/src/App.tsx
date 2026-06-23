import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import '@/App.css';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import AppShell from '@/components/layout/AppShell';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import DashboardPage from '@/pages/DashboardPage';
import SwapPage from '@/pages/SwapPage';
import WithdrawPage from '@/pages/WithdrawPage';
import DepositPage from '@/pages/DepositPage';
import TransactionsPage from '@/pages/TransactionsPage';
import AuditPage from '@/pages/AuditPage';

import { ReactElement } from 'react';

function PrivateRoute({ children }: { children: ReactElement }) {
    const { user } = useAuth();
    if (!user) return <Navigate to="/login" replace />;
    return children;
}

function PublicRoute({ children }: { children: ReactElement }) {
    const { user } = useAuth();
    if (user) return <Navigate to="/dashboard" replace />;
    return children;
}

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Toaster theme="dark" position="bottom-center" richColors closeButton />
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
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/dashboard" element={<DashboardPage />} />
                        <Route path="/swap" element={<SwapPage />} />
                        <Route path="/withdraw" element={<WithdrawPage />} />
                        <Route path="/deposit" element={<DepositPage />} />
                        <Route path="/transactions" element={<TransactionsPage />} />
                        <Route path="/audit" element={<AuditPage />} />
                    </Route>
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}
