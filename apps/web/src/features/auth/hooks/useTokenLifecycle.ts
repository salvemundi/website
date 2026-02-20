'use client';

import { useEffect, useCallback } from 'react';
import { isInternalAuthWindow } from '../providers/msal-client';
import * as authApi from '@/shared/lib/auth';

interface UseTokenLifecycleProps {
    canAttemptAuth: () => boolean;
    recordAuthAttempt: (success: boolean) => void;
    fetchSession: () => Promise<any>; // Using any to avoid importing User if not needed, but can be typed
    clearSession: () => void;
    trySilentMsalLogin: () => Promise<any>;
    isReady: boolean; // Tells the hook if MSAL/initialization is done
}

export function useTokenLifecycle({
    canAttemptAuth,
    recordAuthAttempt,
    fetchSession,
    clearSession,
    trySilentMsalLogin,
    isReady
}: UseTokenLifecycleProps) {

    const isTokenExpiringSoon = useCallback((): boolean => {
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) return true;

            const parts = token.split('.');
            if (parts.length !== 3) return true;

            const payload = JSON.parse(atob(parts[1]));
            const exp = payload.exp;
            if (!exp) return true;

            const nowSeconds = Math.floor(Date.now() / 1000);
            return (exp - nowSeconds) < 300; // 5 minutes
        } catch (e) {
            return true;
        }
    }, []);

    const proactiveRefresh = useCallback(async () => {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken || !canAttemptAuth()) return;

        if (!isTokenExpiringSoon()) return;

        try {
            const { performTokenRefresh } = await import('@/shared/lib/directus');
            const success = await performTokenRefresh();

            if (success) {
                const token = localStorage.getItem('auth_token');
                if (token) {
                    await fetchSession();
                }
                recordAuthAttempt(true);
            } else {
                recordAuthAttempt(false);
                await trySilentMsalLogin();
            }
        } catch (e) {
            recordAuthAttempt(false);
            await trySilentMsalLogin();
        }
    }, [canAttemptAuth, isTokenExpiringSoon, fetchSession, recordAuthAttempt, trySilentMsalLogin]);

    useEffect(() => {
        if (!isReady || isInternalAuthWindow()) return;

        const onAuthExpired = () => {
            clearSession();
        };

        const onAuthRefreshed = (e: CustomEvent) => {
            const payload = e.detail;
            if (payload && payload.user) {
                // If we have the payload, we might emit it or let a fetchSession handle it
                fetchSession();
            } else {
                fetchSession();
            }
        };

        const onVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                const refreshToken = localStorage.getItem('refresh_token');
                if (refreshToken && canAttemptAuth()) {
                    proactiveRefresh();
                }
            }
        };

        window.addEventListener('auth:expired', onAuthExpired as EventListener);
        window.addEventListener('auth:refreshed', onAuthRefreshed as EventListener);
        document.addEventListener('visibilitychange', onVisibilityChange);

        const refreshInterval = setInterval(() => {
            const refreshToken = localStorage.getItem('refresh_token');
            if (refreshToken && canAttemptAuth()) {
                proactiveRefresh();
            }
        }, 60 * 1000);

        return () => {
            window.removeEventListener('auth:expired', onAuthExpired as EventListener);
            window.removeEventListener('auth:refreshed', onAuthRefreshed as EventListener);
            document.removeEventListener('visibilitychange', onVisibilityChange);
            clearInterval(refreshInterval);
        };
    }, [isReady, proactiveRefresh, clearSession, fetchSession, canAttemptAuth]);

    return { proactiveRefresh };
}
