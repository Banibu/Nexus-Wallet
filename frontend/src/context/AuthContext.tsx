import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import { api, clearTokens, getUser, setTokens, setUser } from '@/lib/api';

export interface User {
    id: string;
    email: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<User>;
    register: (email: string, password: string) => Promise<User>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setLocalUser] = useState<User | null>(getUser());
    const [loading, setLoading] = useState<boolean>(false);

    const persistUser = useCallback((u: User | null) => {
        setUser(u);
        setLocalUser(u);
    }, []);

    const login = useCallback(
        async (email: string, password: string): Promise<User> => {
            setLoading(true);
            try {
                const { data } = await api.post('/auth/login', { email, password });
                setTokens(data);
                persistUser(data.user);
                return data.user;
            } finally {
                setLoading(false);
            }
        },
        [persistUser],
    );

    const register = useCallback(
        async (email: string, password: string): Promise<User> => {
            setLoading(true);
            try {
                const { data } = await api.post('/auth/register', { email, password });
                setTokens(data);
                persistUser(data.user);
                return data.user;
            } finally {
                setLoading(false);
            }
        },
        [persistUser],
    );

    const logout = useCallback(async (): Promise<void> => {
        try {
            await api.post('/auth/logout');
        } catch {
            /* ignore */
        } finally {
            clearTokens();
            setLocalUser(null);
        }
    }, []);

    useEffect(() => {
        // Re-validate user from /auth/me on mount if we have token
        const stored = getUser();
        if (stored) {
            api.get('/auth/me')
                .then(({ data }) => persistUser(data.user))
                .catch(() => {
                    clearTokens();
                    setLocalUser(null);
                });
        }
    }, [persistUser]);

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextType {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be inside AuthProvider');
    return ctx;
}
