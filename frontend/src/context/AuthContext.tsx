import {
    createContext,
    type ReactNode,
    useCallback,
    useContext,
    useEffect,
    useState,
} from 'react';
import { api, clearTokens, getUser, setTokens, setUser } from '@/lib/api';

// ─── Domain Types ─────────────────────────────────────────────────────────────

export interface User {
    id: string;
    name: string;
    username: string;
    email: string;
    twoFactorEnabled?: boolean;
}

export interface Requires2FAResponse {
    requires2FA: true;
    tempToken: string;
}

export interface LoginSuccessResponse {
    requires2FA?: false;
    user: User;
    accessToken: string;
    refreshToken: string;
}

export type LoginResponse = Requires2FAResponse | LoginSuccessResponse;

// ─── Context Interface ────────────────────────────────────────────────────────

interface AuthContextType {
    user: User | null;
    loading: boolean;
    checkEmail: (email: string) => Promise<{ twoFactorEnabled: boolean }>;
    login: (
        email: string,
        password: string,
        remember: boolean,
    ) => Promise<LoginResponse>;
    loginTotp: (
        email: string,
        code: string,
        remember: boolean,
    ) => Promise<User>;
    verifyLogin2FA: (
        tempToken: string,
        code: string,
        remember: boolean,
    ) => Promise<User>;
    register: (name: string, email: string, password: string) => Promise<User>;
    logout: () => Promise<void>;
    updateUser: (data: Partial<User>) => void;
}

// ─── Context & Provider ───────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setLocalUser] = useState<User | null>(getUser);
    const [loading, setLoading] = useState(false);

    const persistUser = useCallback((u: User | null, remember: boolean = true) => {
        setUser(u, remember);
        setLocalUser(u);
    }, []);

    const updateUser = useCallback((data: Partial<User>) => {
        setLocalUser((prev) => {
            if (!prev) return null;
            const updated = { ...prev, ...data };
            const remember = !!localStorage.getItem('nexus.user');
            setUser(updated, remember);
            return updated;
        });
    }, []);

    const checkEmail = useCallback(
        async (email: string): Promise<{ twoFactorEnabled: boolean }> => {
            setLoading(true);
            try {
                const { data } = await api.post<{ twoFactorEnabled: boolean }>(
                    '/auth/check-email',
                    { email },
                );
                return data;
            } finally {
                setLoading(false);
            }
        },
        [],
    );

    const login = useCallback(
        async (
            email: string,
            password: string,
            remember: boolean,
        ): Promise<LoginResponse> => {
            setLoading(true);
            try {
                const { data } = await api.post<LoginResponse>('/auth/login', {
                    email,
                    password,
                    remember,
                });

                if (data.requires2FA) {
                    return data;
                }

                const success = data as LoginSuccessResponse;
                setTokens(success, remember);
                persistUser(success.user, remember);
                return success;
            } finally {
                setLoading(false);
            }
        },
        [persistUser],
    );

    const loginTotp = useCallback(
        async (
            email: string,
            code: string,
            remember: boolean,
        ): Promise<User> => {
            setLoading(true);
            try {
                const { data } = await api.post<LoginSuccessResponse>(
                    '/auth/login/totp',
                    { email, code, remember },
                );
                setTokens(data, remember);
                persistUser(data.user, remember);
                return data.user;
            } finally {
                setLoading(false);
            }
        },
        [persistUser],
    );

    const verifyLogin2FA = useCallback(
        async (
            tempToken: string,
            code: string,
            remember: boolean,
        ): Promise<User> => {
            setLoading(true);
            try {
                const { data } = await api.post<LoginSuccessResponse>(
                    '/auth/login/2fa',
                    { tempToken, code, remember },
                );
                setTokens(data, remember);
                persistUser(data.user, remember);
                return data.user;
            } finally {
                setLoading(false);
            }
        },
        [persistUser],
    );

    const register = useCallback(
        async (
            name: string,
            email: string,
            password: string,
        ): Promise<User> => {
            setLoading(true);
            try {
                const { data } = await api.post<LoginSuccessResponse>(
                    '/auth/register',
                    { name, email, password },
                );
                setTokens(data, true);
                persistUser(data.user, true);
                return data.user;
            } finally {
                setLoading(false);
            }
        },
        [persistUser],
    );

    const logout = useCallback(async () => {
        try {
            await api.post('/auth/logout');
        } catch {
            // Best-effort: the session cookies and local state are cleared regardless
        } finally {
            clearTokens();
            setLocalUser(null);
        }
    }, []);

    useEffect(() => {
        const storedUser = getUser();
        if (!storedUser) return;

        const remember = !!localStorage.getItem('nexus.user');

        api.get<{ user: User }>('/auth/me')
            .then(({ data }) => persistUser(data.user, remember))
            .catch(() => {
                clearTokens();
                setLocalUser(null);
            });
    }, [persistUser]);

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                checkEmail,
                login,
                loginTotp,
                verifyLogin2FA,
                register,
                logout,
                updateUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextType {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
    return ctx;
}
