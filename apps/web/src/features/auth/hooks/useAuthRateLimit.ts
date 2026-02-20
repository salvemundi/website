'use client';

import { useState, useCallback, useRef } from 'react';

interface UseAuthRateLimitResult {
    authErrorCount: number;
    canAttemptAuth: () => boolean;
    recordAuthAttempt: (success: boolean) => void;
    clearCorruptedAuthState: (cleanupFn?: () => void) => void;
}

const RATE_LIMIT_WINDOW_MS = 5000; // 5 second window
const MAX_ATTEMPTS_IN_WINDOW = 3; // Max 3 attempts in 5 seconds
const ERROR_BACKOFF_MS = 30000; // 30 second backoff after max errors

export function useAuthRateLimit(): UseAuthRateLimitResult {
    const [authErrorCount, setAuthErrorCount] = useState<number>(0);
    // Use ref for attempts to avoid unnecessary re-renders when just recording attempts
    const authAttemptsContent = useRef<number[]>([]);

    const clearCorruptedAuthState = useCallback((cleanupFn?: () => void) => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        setAuthErrorCount(0);
        authAttemptsContent.current = [];
        if (cleanupFn) {
            cleanupFn();
        }
    }, []);

    const canAttemptAuth = useCallback((): boolean => {
        const now = Date.now();
        const attempts = authAttemptsContent.current;

        // Check if we're in error backoff period
        if (authErrorCount >= MAX_ATTEMPTS_IN_WINDOW) {
            const lastAttempt = attempts.length > 0 ? attempts[attempts.length - 1] : 0;
            if (now - lastAttempt < ERROR_BACKOFF_MS) {
                return false;
            } else {
                // Reset error count after backoff period, but if we've had too many errors
                // in succession, clear corrupted state
                if (authErrorCount >= MAX_ATTEMPTS_IN_WINDOW * 2) {
                    clearCorruptedAuthState();
                } else {
                    setAuthErrorCount(0);
                }
            }
        }

        // Count attempts in the current window
        const recentAttempts = attempts.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW_MS);
        if (recentAttempts.length >= MAX_ATTEMPTS_IN_WINDOW) {
            return false;
        }

        return true;
    }, [authErrorCount, clearCorruptedAuthState]);

    const recordAuthAttempt = useCallback((success: boolean) => {
        const now = Date.now();
        authAttemptsContent.current = [...authAttemptsContent.current.filter(t => now - t < RATE_LIMIT_WINDOW_MS), now];

        if (success) {
            setAuthErrorCount(0);
        } else {
            setAuthErrorCount(prev => prev + 1);
        }
    }, []);

    return {
        authErrorCount,
        canAttemptAuth,
        recordAuthAttempt,
        clearCorruptedAuthState
    };
}
