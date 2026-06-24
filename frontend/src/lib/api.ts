import axios, { type AxiosError } from 'axios';
import { toast } from 'sonner';
import type { User } from '@/context/AuthContext';

// ─── Base URL ─────────────────────────────────────────────────────────────────

const BACKEND_URL = (process.env.REACT_APP_BACKEND_URL ?? '').replace(/\/$/, '');
export const API = `${BACKEND_URL}/api`;

// ─── localStorage Keys ────────────────────────────────────────────────────────

const STORAGE_KEYS = {
    accessToken: 'nexus.accessToken',
    refreshToken: 'nexus.refreshToken',
    user: 'nexus.user',
} as const;

// ─── Token Storage ────────────────────────────────────────────────────────────

export function getAccessToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.accessToken) || sessionStorage.getItem(STORAGE_KEYS.accessToken);
}

export function getRefreshToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.refreshToken) || sessionStorage.getItem(STORAGE_KEYS.refreshToken);
}

export interface TokenPayload {
    accessToken?: string;
    refreshToken?: string;
}

export function setTokens({ accessToken, refreshToken }: TokenPayload, remember: boolean = true): void {
    const storage = remember ? localStorage : sessionStorage;
    const otherStorage = remember ? sessionStorage : localStorage;

    // Clean up other storage to avoid dual state
    otherStorage.removeItem(STORAGE_KEYS.accessToken);
    otherStorage.removeItem(STORAGE_KEYS.refreshToken);

    if (accessToken)
        storage.setItem(STORAGE_KEYS.accessToken, accessToken);
    if (refreshToken)
        storage.setItem(STORAGE_KEYS.refreshToken, refreshToken);
}

export function clearTokens(): void {
    localStorage.removeItem(STORAGE_KEYS.accessToken);
    localStorage.removeItem(STORAGE_KEYS.refreshToken);
    localStorage.removeItem(STORAGE_KEYS.user);
    sessionStorage.removeItem(STORAGE_KEYS.accessToken);
    sessionStorage.removeItem(STORAGE_KEYS.refreshToken);
    sessionStorage.removeItem(STORAGE_KEYS.user);
}

// ─── User Storage ─────────────────────────────────────────────────────────────

export function getUser(): User | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.user) || sessionStorage.getItem(STORAGE_KEYS.user);
        return raw ? (JSON.parse(raw) as User) : null;
    } catch {
        return null;
    }
}

export function setUser(u: User | null, remember: boolean = true): void {
    if (u) {
        const storage = remember ? localStorage : sessionStorage;
        const otherStorage = remember ? sessionStorage : localStorage;

        otherStorage.removeItem(STORAGE_KEYS.user);
        storage.setItem(STORAGE_KEYS.user, JSON.stringify(u));
    }
}

// ─── Axios Instance ───────────────────────────────────────────────────────────

export const api = axios.create({
    baseURL: API,
    timeout: 30_000,
    withCredentials: true,
});

// Attach the access token to every outgoing request
api.interceptors.request.use((config) => {
    const token = getAccessToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// ─── Transparent Token Refresh ────────────────────────────────────────────────
// When a request fails with 401, we try to silently refresh the access token
// using the refresh token (sent via cookie or stored locally).
// All concurrent 401s share the same refresh promise to avoid duplicate calls.

let pendingRefresh: Promise<string> | null = null;

async function tryRefreshAccessToken(): Promise<string> {
    if (pendingRefresh) return pendingRefresh;

    const refreshToken = getRefreshToken() ?? '';
    const remember = !!localStorage.getItem(STORAGE_KEYS.refreshToken);

    pendingRefresh = axios
        .post<TokenPayload>(
            `${API}/auth/refresh`,
            { refreshToken, remember },
            { withCredentials: true },
        )
        .then((response) => {
            setTokens(response.data);
            return response.data.accessToken as string;
        })
        .catch((error) => {
            clearTokens();
            throw error;
        })
        .finally(() => {
            pendingRefresh = null;
        });

    return pendingRefresh;
}

api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as typeof error.config & {
            _retry?: boolean;
        };
        const is401 = error.response?.status === 401;
        const isAuthRoute = originalRequest?.url?.includes('/auth/');
        const alreadyRetried = originalRequest?._retry;

        if (is401 && !isAuthRoute && !alreadyRetried) {
            originalRequest!._retry = true;
            try {
                const newToken = await tryRefreshAccessToken();
                originalRequest!.headers!.Authorization = `Bearer ${newToken}`;
                return api(originalRequest!);
            } catch {
                // Refresh failed — redirect to login
                if (typeof window !== 'undefined') {
                    window.location.href = '/login';
                }
            }
        }

        return Promise.reject(error);
    },
);

// ─── Error Utilities ──────────────────────────────────────────────────────────

/** Extracts a human-readable message from an API error. */
export function apiErrorMessage(err: unknown): string {
    const axiosErr = err as AxiosError<{
        error?: { message?: string };
        message?: string;
    }>;
    const data = axiosErr?.response?.data;
    return (
        data?.error?.message ??
        data?.message ??
        (err as Error)?.message ??
        'Erro inesperado'
    );
}

/** Displays an API error as a toast notification. */
export function toastError(err: unknown): void {
    toast.error(apiErrorMessage(err));
}
