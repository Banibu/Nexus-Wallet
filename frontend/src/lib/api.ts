import axios from 'axios';
import { toast } from 'sonner';
import { User } from '@/context/AuthContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
export const API = `${BACKEND_URL}/api`;

const ACCESS_KEY = 'nexus.accessToken';
const REFRESH_KEY = 'nexus.refreshToken';
const USER_KEY = 'nexus.user';

export function getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_KEY);
}
export function getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_KEY);
}
export interface TokenPayload {
    accessToken?: string;
    refreshToken?: string;
}
export function setTokens({ accessToken, refreshToken }: TokenPayload): void {
    if (accessToken) localStorage.setItem(ACCESS_KEY, accessToken);
    if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
}
export function clearTokens(): void {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
}
export function getUser(): User | null {
    try {
        const raw = localStorage.getItem(USER_KEY);
        return raw ? JSON.parse(raw) as User : null;
    } catch {
        return null;
    }
}
export function setUser(u: User | null): void {
    if (u) localStorage.setItem(USER_KEY, JSON.stringify(u));
}

export const api = axios.create({ baseURL: API, timeout: 30000, withCredentials: true });

api.interceptors.request.use((cfg) => {
    const tk = getAccessToken();
    if (tk) cfg.headers.Authorization = `Bearer ${tk}`;
    return cfg;
});

let refreshInflight: Promise<string> | null = null;

async function tryRefresh(): Promise<string> {
    if (refreshInflight) return refreshInflight;
    const refreshToken = getRefreshToken() || '';
    refreshInflight = axios
        .post(`${API}/auth/refresh`, { refreshToken }, { withCredentials: true })
        .then((r) => {
            setTokens(r.data);
            return r.data.accessToken as string;
        })
        .catch((e) => {
            clearTokens();
            throw e;
        })
        .finally(() => {
            refreshInflight = null;
        });
    return refreshInflight;
}

api.interceptors.response.use(
    (r) => r,
    async (error) => {
        const original = error.config || {};
        if (error.response?.status === 401 && !original._retry && !original.url?.includes('/auth/')) {
            original._retry = true;
            try {
                const newToken = await tryRefresh();
                original.headers.Authorization = `Bearer ${newToken}`;
                return api(original);
            } catch {
                if (typeof window !== 'undefined') {
                    window.location.href = '/login';
                }
            }
        }
        return Promise.reject(error);
    },
);

export function apiErrorMessage(err: any): string {
    const data = err?.response?.data;
    return data?.error?.message || data?.message || err?.message || 'Erro inesperado';
}

export function toastError(err: any): void {
    toast.error(apiErrorMessage(err));
}
