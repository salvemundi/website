'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useMemo, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { User, SignupData } from '@/shared/model/types/auth';
import { loginWithEntraIdAction, signupWithPasswordAction, logoutAction } from '@/shared/api/auth-actions';
import { toast } from 'sonner';
import * as authApi from '@/shared/lib/auth';

import { isInternalAuthWindow } from './msal-client';
import { useMsalAuth } from '../hooks/useMsalAuth';
import { useSession } from '../hooks/useSession';
import { useAuthRateLimit } from '../hooks/useAuthRateLimit';
import { useTokenLifecycle } from '../hooks/useTokenLifecycle';

// Legacy interface for backward compatibility
export interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    loginWithMicrosoft: () => Promise<void>;
    loginWithRedirect: (returnUrl?: string) => Promise<void>;
    logout: () => void;
    signup: (userData: SignupData) => Promise<void>;
    refreshUser: () => Promise<void>;
    isLoggingOut: boolean;
    authError: string | null;
}

// Optimized state sub-trees
const AuthUserContext = createContext<User | null>(null);

// Granular context 2: Auth status (only re-renders when status changes)
type AuthStatus = 'authenticated' | 'unauthenticated' | 'checking';
interface AuthStatusContextValue {
    status: AuthStatus;
    isLoading: boolean;
    isLoggingOut: boolean;
    authError: string | null;
}
const AuthStatusContext = createContext<AuthStatusContextValue>({
    status: 'checking',
    isLoading: true,
    isLoggingOut: false,
    authError: null,
});

// Granular context 3: Auth actions (stable functions, never re-renders)
interface AuthActionsContextValue {
    loginWithMicrosoft: () => Promise<void>;
    loginWithRedirect: (returnUrl?: string) => Promise<void>;
    logout: () => void;
    signup: (userData: SignupData) => Promise<void>;
    refreshUser: () => Promise<void>;
}
const AuthActionsContext = createContext<AuthActionsContextValue | undefined>(undefined);

// Legacy context for backward compatibility
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const router = useRouter();
    const [appLoading, setAppLoading] = useState(true);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [isReady, setIsReady] = useState(false);

    // Extracted Custom Hooks
    const { authErrorCount, canAttemptAuth, recordAuthAttempt } = useAuthRateLimit();
    const { user, setUser, fetchSession, clearSession } = useSession();
    const {
        isInitializing: msalInitializing,
        error: msalError,
        handleRedirectPromise,
        loginWithRedirect: msalLoginRedirect,
        trySilentLogin,
        logoutMsal
    } = useMsalAuth(canAttemptAuth);

    const isProcessingLogin = useRef(false);

    // Provide Token Refresh Polling & Cross-Tab features
    useTokenLifecycle({
        canAttemptAuth,
        recordAuthAttempt,
        fetchSession,
        clearSession,
        trySilentMsalLogin: async () => {
            const result = await trySilentLogin();
            if (result) await handleLoginSuccess(result, false);
            return result;
        },
        isReady
    });

    const checkAndRedirect = useCallback(() => {
        try {
            const returnTo = localStorage.getItem('auth_return_to');
            if (returnTo) {
                localStorage.removeItem('auth_return_to');
                const currentPath = window.location.pathname + window.location.search;

                if (returnTo === currentPath || (returnTo === '/' && currentPath === '/')) {
                    return;
                }

                if (returnTo.startsWith('/') && !returnTo.startsWith('//')) {
                    router.replace(returnTo);
                } else {
                    router.replace('/account');
                }
            }
        } catch (e) {
            // ignore
        }
    }, [router]);

    const handleLoginSuccess = useCallback(async (loginResponse: unknown, shouldRedirect: boolean = false) => {
        if (isProcessingLogin.current) return;
        isProcessingLogin.current = true;
        setAppLoading(true);

        try {
            const lr = loginResponse as { idToken?: string; account?: { username?: string } };
            const idToken = lr.idToken;
            const userEmail = lr.account?.username;

            const response = await loginWithEntraIdAction(idToken || '', userEmail || '');

            if (response.success === false) {
                toast.error(response.error || 'Inloggen mislukt. Probeer het opnieuw.');
                setAppLoading(false);
                isProcessingLogin.current = false;
                return;
            }

            const validatedUser = response.user;
            if (!validatedUser) {
                throw new Error('Login failed: backend did not returning user details.');
            }

            try {
                const committees = await authApi.fetchAndPersistUserCommittees(validatedUser.id);
                setUser({ ...validatedUser, committees });
            } catch (e) {
                setUser(validatedUser);
            }

            if (shouldRedirect) {
                checkAndRedirect();
            } else {
                if (typeof window !== 'undefined') {
                    const url = new URL(window.location.href);
                    if (url.hash && (url.hash.includes('code=') || url.hash.includes('error='))) {
                        url.hash = '';
                    }
                    if (url.searchParams.has('code') || url.searchParams.has('state')) {
                        url.searchParams.delete('code');
                        url.searchParams.delete('state');
                        url.searchParams.delete('session_state');
                        url.searchParams.delete('error');
                        url.searchParams.delete('error_description');
                    }
                    window.history.replaceState({}, document.title, url.toString());
                }
            }
        } catch (error) {
            console.error('Microsoft login processing error:', error);
            toast.error('Inloggen mislukt. Probeer het opnieuw.');
        } finally {
            setAppLoading(false);
            isProcessingLogin.current = false;
        }
    }, [checkAndRedirect, setUser]);

    const checkAuthStatus = useCallback(async () => {
        if (!canAttemptAuth() && authErrorCount > 0) {
            setAppLoading(false);
            return;
        }

        try {
            const userData = await fetchSession();

            if (userData) {
                recordAuthAttempt(true);
                setAppLoading(false);
            } else {
                recordAuthAttempt(false);
                const silentResult = await trySilentLogin();

                if (silentResult) {
                    await handleLoginSuccess(silentResult, false);
                    recordAuthAttempt(true);
                } else {
                    await new Promise(resolve => setTimeout(resolve, 800)); // Grace Period
                    setUser(null);
                }
                setAppLoading(false);
            }
        } catch (error) {
            console.error('[AuthProvider] Auth check error:', error);
            recordAuthAttempt(false);
            await new Promise(resolve => setTimeout(resolve, 800));
            setUser(null);
            setAppLoading(false);
        }
    }, [canAttemptAuth, authErrorCount, fetchSession, recordAuthAttempt, trySilentLogin, handleLoginSuccess, setUser]);


    useEffect(() => {
        if (msalInitializing || isInternalAuthWindow()) return;
        setIsReady(true);
    }, [msalInitializing]);

    useEffect(() => {
        if (!isReady || isInternalAuthWindow()) return;

        const processAuth = async () => {
            if (user) return;

            try {
                const response = await handleRedirectPromise();
                if (response) {
                    await handleLoginSuccess(response, true);
                    recordAuthAttempt(true);
                } else {
                    await checkAuthStatus();
                }
            } catch (error: any) {
                recordAuthAttempt(false);
                setAppLoading(false);
            }
        };

        processAuth();
    }, [isReady, handleRedirectPromise, handleLoginSuccess, recordAuthAttempt, checkAuthStatus, user]);


    const loginWithRedirect = useCallback(async (returnUrl?: string) => {
        return msalLoginRedirect(returnUrl);
    }, [msalLoginRedirect]);

    const loginWithMicrosoft = useCallback(async () => {
        return loginWithRedirect();
    }, [loginWithRedirect]);

    const signup = useCallback(async (userData: SignupData) => {
        setAppLoading(true);
        try {
            const response = await signupWithPasswordAction(userData);
            localStorage.setItem('auth_token', response.access_token);
            localStorage.setItem('refresh_token', response.refresh_token);
            try {
                const committees = await authApi.fetchAndPersistUserCommittees(response.user.id);
                setUser({ ...response.user, committees });
            } catch (e) {
                setUser(response.user);
            }
        } catch (error) {
            console.error('Signup error:', error);
            throw error;
        } finally {
            setAppLoading(false);
        }
    }, [setUser]);

    const logout = useCallback(async () => {
        setIsLoggingOut(true);
        try {
            await logoutAction();
        } catch (error) {
            console.error('Failed to logout:', error);
        }

        clearSession();
        await logoutMsal();
        setIsLoggingOut(false);
    }, [clearSession, logoutMsal]);

    const refreshUser = useCallback(async () => {
        await fetchSession();
    }, [fetchSession]);


    const authActions = useMemo(() => ({
        loginWithMicrosoft,
        logout,
        signup,
        refreshUser,
        loginWithRedirect,
    }), [loginWithMicrosoft, logout, signup, refreshUser, loginWithRedirect]);


    const finalLoading = msalInitializing || appLoading;
    const computedAuthError = msalError ? msalError.message : null;

    const authStatus = useMemo(() => ({
        status: (!!user ? 'authenticated' : (finalLoading ? 'checking' : 'unauthenticated')) as AuthStatus,
        isLoading: finalLoading,
        isLoggingOut,
        authError: computedAuthError,
    }), [user, finalLoading, isLoggingOut, computedAuthError]);

    const legacyValue = useMemo(() => ({
        user,
        isAuthenticated: !!user,
        isLoading: finalLoading,
        isLoggingOut,
        loginWithMicrosoft,
        logout,
        signup,
        refreshUser,
        authError: computedAuthError,
        loginWithRedirect,
    }), [user, finalLoading, isLoggingOut, loginWithMicrosoft, logout, signup, refreshUser, computedAuthError, loginWithRedirect]);

    return (
        <AuthUserContext.Provider value={user}>
            <AuthStatusContext.Provider value={authStatus}>
                <AuthActionsContext.Provider value={authActions}>
                    <AuthContext.Provider value={legacyValue}>
                        {children}
                    </AuthContext.Provider>
                </AuthActionsContext.Provider>
            </AuthStatusContext.Provider>
        </AuthUserContext.Provider>
    );
}

// ============================================================================
// Context Selector Hooks - Use these for performance optimization
// ============================================================================

export function useAuthUser() {
    return useContext(AuthUserContext);
}

export function useAuthStatus() {
    return useContext(AuthStatusContext);
}

export function useAuthActions() {
    const context = useContext(AuthActionsContext);
    if (context === undefined) {
        throw new Error('useAuthActions must be used within an AuthProvider');
    }
    return context;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
