'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { PublicClientApplication } from '@azure/msal-browser';
import { msalConfig, loginRequest } from '@/shared/config/msalConfig';
import * as authApi from '@/shared/lib/auth';
import { User, SignupData } from '@/shared/model/types/auth';
import { loginWithEntraIdAction, signupWithPasswordAction, getCurrentUserAction, logoutAction } from '@/shared/api/auth-actions';
import { toast } from 'sonner';

// Initialize MSAL client-side only to avoid SSR mismatches
let msalInstance: PublicClientApplication | null = null;
try {
    if (typeof window !== 'undefined') {
        // Only initialize if we have a real Client ID to avoid "sandboxed frame" navigation loops
        // caused by Microsoft rejecting "YOUR_CLIENT_ID"
        const clientId = msalConfig.auth.clientId;
        if (clientId && clientId !== 'YOUR_CLIENT_ID') {
            console.log('[AuthProvider] Initializing MSAL with Client ID:', clientId);
            msalInstance = new PublicClientApplication(msalConfig);
        } else {
            console.warn('[AuthProvider] MSAL Client ID is missing or invalid. Authentication will be disabled.');
        }
    }
} catch (error) {
    console.error('[AuthProvider] MSAL initialization failed:', error);
}

/**
 * Detect if we are running inside a popup or iframe used for authentication
 */
const isInternalAuthWindow = () => {
    if (typeof window === 'undefined') return false;

    // Check if we have auth artifacts in URL - this strongly indicates a popup/redirect return
    const url = new URL(window.location.href);
    const hasAuthArtifacts = url.hash.includes('code=') || url.hash.includes('error=') ||
        url.searchParams.has('code') || url.searchParams.has('state');

    try {
        // [FIX] More robust detection: if we have an opener or parent and auth artifacts,
        // we are almost certainly the authentication window that should not run app logic.
        if (window.opener && window.opener !== window && hasAuthArtifacts) return true;
        if (window.parent && window.parent !== window && hasAuthArtifacts) return true;

        // Classic checks as fallback
        if (window.opener && window.opener !== window) return true;
        if (window.parent && window.parent !== window) return true;
    } catch (e) {
        // Cross-origin access error usually means we are in a popup/iframe from Microsoft
        return true;
    }
    return false;
};

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

/**
 * [ARCHITECTURE] AuthProvider Strategy
 * 
 * 1. Silent Flow First: We prefer MSAL's ssoSilent/acquireTokenSilent to keep users logged in 
 *    without redirects. Popups are used only for explicit user interaction.
 * 
 * 2. Proactive Refresh: We aggressively refresh tokens in the background (every minute and on window focus)
 *    to prevent "token expired" errors during user sessions.
 * 
 * 3. Granular Contexts: To avoid re-rendering the entire app on every auth usage, we split context into:
 *    - AuthUserContext: Changes only when user object changes.
 *    - AuthStatusContext: Changes when loading/status changes.
 *    - AuthActionsContext: Never changes (stable functions).
 */

// Performance: Granular contexts prevent full-app re-renders on every session heartbeat
// ============================================================================

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
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isMsalInitializing, setIsMsalInitializing] = useState(true);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [authError, setAuthError] = useState<string | null>(null);
    const [authErrorCount, setAuthErrorCount] = useState<number>(0);
    const [authAttempts, setAuthAttempts] = useState<number[]>([]);
    const router = useRouter();

    // Rate limiting constants
    const RATE_LIMIT_WINDOW_MS = 5000; // 5 second window
    const MAX_ATTEMPTS_IN_WINDOW = 3; // Max 3 attempts in 5 seconds
    const ERROR_BACKOFF_MS = 30000; // 30 second backoff after max errors

    // Helper to check if we can attempt authentication
    const canAttemptAuth = (): boolean => {
        const now = Date.now();

        // Check if we're in error backoff period
        if (authErrorCount >= MAX_ATTEMPTS_IN_WINDOW) {
            const lastAttempt = authAttempts.length > 0 ? authAttempts[authAttempts.length - 1] : 0;
            if (now - lastAttempt < ERROR_BACKOFF_MS) {
                // console.log('[AuthProvider] In error backoff period, skipping auth attempt');
                return false;
            } else {
                // Reset error count after backoff period, but if we've had too many errors
                // in succession, clear corrupted state
                if (authErrorCount >= MAX_ATTEMPTS_IN_WINDOW * 2) {
                    clearCorruptedAuthState();
                }
                setAuthErrorCount(0);
            }
        }

        // Count attempts in the current window
        const recentAttempts = authAttempts.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW_MS);
        if (recentAttempts.length >= MAX_ATTEMPTS_IN_WINDOW) {
            // console.log('[AuthProvider] Rate limit reached (3 attempts in 5s), skipping');
            return false;
        }

        return true;
    };

    // Helper to record auth attempt
    const recordAuthAttempt = (success: boolean) => {
        const now = Date.now();
        setAuthAttempts(prev => [...prev.filter(t => now - t < RATE_LIMIT_WINDOW_MS), now]);

        if (success) {
            setAuthErrorCount(0);
            setAuthError(null);
        } else {
            setAuthErrorCount(prev => prev + 1);
        }
    };

    // Helper to clear corrupted auth state when too many errors occur
    const clearCorruptedAuthState = () => {
        // console.log('[AuthProvider] Clearing corrupted auth state after repeated errors');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        setUser(null);
        setAuthErrorCount(0);
        setIsLoading(false);

        // Also clear MSAL cache if possible
        if (msalInstance) {
            try {
                // Clear active account
                msalInstance.setActiveAccount(null);
                // Note: MSAL doesn't provide removeAccount method, but clearing active account helps
            } catch (e) {
                // console.warn('[AuthProvider] Failed to clear MSAL state:', e);
            }
        }
    };

    // Helper to check if the access token is about to expire (within 2 minutes)
    const isTokenExpiringSoon = (): boolean => {
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) return true;

            // Decode the JWT payload (base64)
            const parts = token.split('.');
            if (parts.length !== 3) return true;

            const payload = JSON.parse(atob(parts[1]));
            const exp = payload.exp;
            if (!exp) return true;

            // Check if token expires within 5 minutes (300 seconds)
            const nowSeconds = Math.floor(Date.now() / 1000);
            return (exp - nowSeconds) < 300;
        } catch (e) {
            // If we can't decode the token, assume it's expiring
            return true;
        }
    };

    // Proactive token refresh function
    const proactiveRefresh = async () => {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken || !canAttemptAuth()) return;

        // Only refresh if token is expiring soon or already expired
        if (!isTokenExpiringSoon()) return;

        // [ARCHITECTURE] Use global singleton refresh from directus.ts
        // This ensures we never have two refresh requests in flight at once
        // even if various components trigger them simultaneously.
        try {
            const { performTokenRefresh } = await import('@/shared/lib/directus');
            const success = await performTokenRefresh();

            if (success) {
                // After successful shared refresh, update the user state
                const token = localStorage.getItem('auth_token');
                if (token) {
                    const response = await authApi.fetchUserDetails(token);
                    if (response) setUser(response);
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
    };

    // Check for existing session on mount
    useEffect(() => {
        // [FIX] Prevent all side effects (refresh intervals, status checks) 
        // if we are in a popup or iframe window. This avoids session contamination.
        if (isInternalAuthWindow()) return;

        // Note: checkAuthStatus is now triggered by isMsalInitializing change 
        // to ensure MSAL is ready before we attempt recovery flows.

        // Listen for external auth expiration events
        const onAuthExpired = () => {
            // Clear stored tokens and update state
            try {
                localStorage.removeItem('auth_token');
                localStorage.removeItem('refresh_token');
            } catch (e) {
                // ignore
            }
            setUser(null);
            setIsLoading(false);
        };

        // Listen for external auth refresh events (from directusFetch)
        const onAuthRefreshed = (e: CustomEvent) => {
            const payload = e.detail;
            if (payload && payload.user) {
                // If payload includes user data, use it
                setUser(payload.user);
            } else {
                // Otherwise refresh our local state from the new token
                refreshUser();
            }
        };

        // Visibility change handler - refresh token when user comes back to tab
        const onVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                const refreshToken = localStorage.getItem('refresh_token');
                if (refreshToken && !isLoading && !isMsalInitializing && !isLoggingOut && canAttemptAuth()) {
                    // console.log('[AuthProvider] Tab became visible, checking token...');
                    proactiveRefresh();
                }
            }
        };

        window.addEventListener('auth:expired', onAuthExpired as EventListener);
        window.addEventListener('auth:refreshed', onAuthRefreshed as EventListener);
        document.addEventListener('visibilitychange', onVisibilityChange);

        // Proactive background refresh every 1 minute
        const refreshInterval = setInterval(() => {
            const refreshToken = localStorage.getItem('refresh_token');
            if (refreshToken && !isLoading && !isMsalInitializing && !isLoggingOut && canAttemptAuth()) {
                proactiveRefresh();
            }
        }, 60 * 1000);

        return () => {
            window.removeEventListener('auth:expired', onAuthExpired as EventListener);
            window.removeEventListener('auth:refreshed', onAuthRefreshed as EventListener);
            document.removeEventListener('visibilitychange', onVisibilityChange);
            clearInterval(refreshInterval);
        };
    }, []);

    // [FIX] Trigger auth check only AFTER MSAL is initialized
    useEffect(() => {
        if (!isMsalInitializing && !isInternalAuthWindow()) {
            checkAuthStatus();
        }
    }, [isMsalInitializing]);

    const checkAuthStatus = async () => {
        // Skip if we're already in an auth attempt cooldown
        if (!canAttemptAuth() && authErrorCount > 0) {
            setIsLoading(false);
            return;
        }

        try {
            // Priority: Check server-side session via HTTP-only cookie
            const userData = await getCurrentUserAction();

            if (userData) {
                // Fetch committees (public or requires bypass handled in proxy)
                try {
                    const committees = await authApi.fetchAndPersistUserCommittees(userData.id);
                    setUser({ ...userData, committees });
                } catch (e) {
                    setUser(userData);
                }
                recordAuthAttempt(true);
            } else {
                // No server session, try silent recovery via MSAL
                recordAuthAttempt(false);
                const recovered = await trySilentMsalLogin();
                if (!recovered) setUser(null);
            }
        } catch (error) {
            console.error('[AuthProvider] Auth check error:', error);
            recordAuthAttempt(false);
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    const hasProcessedRedirect = useRef(false);

    // Handle MSAL redirect promise and silent login on component mount
    useEffect(() => {
        const handleRedirect = async () => {
            if (!msalInstance) {
                // If MSAL is not available, we can't process redirects
                setIsMsalInitializing(false);
                return;
            }

            // [FIX] Prevent AuthProvider from running full logic if we are in a popup or iframe 
            // but don't have artifacts to process. This avoids infinite loops of ssoSilent.
            const url = new URL(window.location.href);
            const hasAuthArtifacts = url.hash.includes('code=') || url.hash.includes('error=') ||
                url.searchParams.has('code') || url.searchParams.has('state');

            if (isInternalAuthWindow() && !hasAuthArtifacts) {
                // console.log('[AuthProvider] Early exit for clean iframe load');
                setIsMsalInitializing(false);
                return;
            }

            if (hasProcessedRedirect.current) {
                return;
            }

            // If we already have a user from checkAuthStatus, don't try to process redirect
            // as it might cause multiple login calls and redundant toasts
            if (user) {
                setIsMsalInitializing(false);
                return;
            }

            // Check if we should skip auth attempts due to rate limiting
            if (!canAttemptAuth()) {
                setIsMsalInitializing(false);
                return;
            }

            try {
                await msalInstance.initialize();

                // Check if URL has auth artifacts that indicate a redirect return
                const url = new URL(window.location.href);
                const hasAuthArtifacts = url.hash.includes('code=') || url.hash.includes('error=') ||
                    url.searchParams.has('code') || url.searchParams.has('state');

                // Process redirect response if coming back from Microsoft
                const response = await msalInstance.handleRedirectPromise();

                if (response && response.account) {
                    if (hasProcessedRedirect.current) return;
                    hasProcessedRedirect.current = true;

                    // [FIX] Prevent AuthProvider from running full login logic if we are in a popup or iframe.
                    // MSAL's loginPopup/acquireTokenSilent handles the result in the parent window.
                    // Running this logic in the popup would cause it to navigate to /account instead of closing.
                    if (isInternalAuthWindow()) {
                        // console.log('[AuthProvider] Auth finished in popup/iframe, signaling and closing...');
                        // MSAL handles communication to opener inside handleRedirectPromise.
                        // We add a fallback close to ensure the window doesn't hang.
                        setTimeout(() => {
                            if (typeof window !== 'undefined' && window.opener) {
                                window.close();
                            }
                        }, 500);
                        return;
                    }

                    // console.log('[AuthProvider] Redirect login successful');
                    msalInstance.setActiveAccount(response.account);
                    await handleLoginSuccess(response, true);
                    recordAuthAttempt(true);
                } else if (hasAuthArtifacts) {
                    // We had auth artifacts but no response - likely an error
                    // console.warn('[AuthProvider] Auth artifacts present but no MSAL response');
                    recordAuthAttempt(false);
                    // Clean up URL artifacts
                    const cleanUrl = new URL(window.location.href);
                    cleanUrl.hash = '';
                    cleanUrl.searchParams.delete('code');
                    cleanUrl.searchParams.delete('state');
                    cleanUrl.searchParams.delete('session_state');
                    cleanUrl.searchParams.delete('error');
                    cleanUrl.searchParams.delete('error_description');
                    window.history.replaceState({}, document.title, cleanUrl.toString());

                    // [FIX] Also close if we are in an error state in a popup
                    if (isInternalAuthWindow()) {
                        setTimeout(() => {
                            if (typeof window !== 'undefined' && window.opener) {
                                window.close();
                            }
                        }, 500);
                    }
                } else {
                    // Not a redirect return - restore active account from cache
                    const accounts = msalInstance.getAllAccounts();
                    if (accounts.length > 0) {
                        const account = accounts[0];
                        msalInstance.setActiveAccount(account);
                    }

                    // Silent Login Recovery:
                    // If we don't have a Directus session but we HAVE a Microsoft session,
                    // try to login silently to Directus without a full page redirect.
                    // Only attempt this if we don't already have a user and no stored token.
                    // IMPORTANT: Only run this on the main window, never in an iframe.
                    if (!user && !isInternalAuthWindow()) {
                        const accounts = msalInstance.getAllAccounts();

                        if (accounts.length > 0) {
                            const account = accounts[0];
                            // console.log('[AuthProvider] Attempting silent MSAL token acquisition...');
                            try {
                                const silentResult = await msalInstance.acquireTokenSilent({
                                    ...loginRequest,
                                    account
                                });
                                if (silentResult) {
                                    if (hasProcessedRedirect.current) return;
                                    hasProcessedRedirect.current = true;
                                    await handleLoginSuccess(silentResult, false);
                                    recordAuthAttempt(true);
                                }
                            } catch (silentError) {
                                // console.log('[AuthProvider] Silent MSAL failed, user must login manually');
                                recordAuthAttempt(false);
                            }
                        } else {
                            // Try ssoSilent to check for existing cookies (no account in cache)
                            // But only if we haven't attempted in this session to prevent loops
                            try {
                                const ssoAttempted = sessionStorage.getItem('msal_sso_attempted');
                                if (!ssoAttempted && canAttemptAuth()) {
                                    sessionStorage.setItem('msal_sso_attempted', 'true');
                                    // console.log('[AuthProvider] No accounts in cache, trying ssoSilent...');
                                    const ssoResult = await msalInstance.ssoSilent(loginRequest);
                                    if (ssoResult) {
                                        if (hasProcessedRedirect.current) return;
                                        hasProcessedRedirect.current = true;
                                        await handleLoginSuccess(ssoResult, false);
                                        recordAuthAttempt(true);
                                    }
                                }
                            } catch (ssoError) {
                                // Expected if no active Microsoft session in browser or blocked by sandbox
                                // console.log('[AuthProvider] ssoSilent failed (expected if no session)');
                                recordAuthAttempt(false);
                            }
                        }
                    }
                }
            } catch (error: any) {
                // console.error('[AuthProvider] MSAL init/redirect error:', error);
                setAuthError(error.message || 'Authentication initialization failed');
                recordAuthAttempt(false);
            } finally {
                setIsMsalInitializing(false);
            }
        };

        handleRedirect();
    }, []); // Removed user dependency to avoid redundant executions during login flow





    const isProcessingLogin = useRef(false);

    const handleLoginSuccess = async (loginResponse: unknown, shouldRedirect: boolean = false) => {
        if (isProcessingLogin.current) return;
        isProcessingLogin.current = true;

        setIsLoading(true);
        const toastId = toast.loading('Inloggen verwerken...');

        try {
            // Get the ID token to send to backend
            const lr = loginResponse as { idToken?: string; account?: { username?: string } };
            const idToken = lr.idToken;
            const userEmail = lr.account?.username;

            // Authenticate with backend using Entra ID token via Server Action
            // This action now sets HTTP-only cookies securely
            const response = await loginWithEntraIdAction(idToken || '', userEmail || '');

            // The user object is returned from the action
            const validatedUser = response.user;

            if (!validatedUser) {
                throw new Error('Login failed: backend did not returning user details.');
            }

            // committees can still be persisted in localStorage for rapid access if needed,
            // but the session itself is in the HTTP-only cookie.
            try {
                const committees = await authApi.fetchAndPersistUserCommittees(validatedUser.id);
                setUser({ ...validatedUser, committees });
            } catch (e) {
                setUser(validatedUser);
            }

            toast.success('Inloggen geslaagd!', { id: toastId });

            if (shouldRedirect) {
                checkAndRedirect();
            } else {
                // If we are not redirecting to another page, clean up the current URL
                if (typeof window !== 'undefined') {
                    const url = new URL(window.location.href);
                    if (url.hash && (url.hash.includes('code=') || url.hash.includes('error='))) {
                        url.hash = '';
                    }
                    if (url.searchParams.has('code') || url.searchParams.has('state')) {
                        url.searchParams.delete('code');
                        url.searchParams.delete('state');
                        url.searchParams.delete('session_state');
                    }
                    window.history.replaceState({}, document.title, url.toString());
                }
            }
        } catch (error) {
            console.error('Microsoft login processing error:', error);
            toast.error('Inloggen mislukt. Probeer het opnieuw.', { id: toastId });
            throw error; // Re-throw to be handled by caller if any
        } finally {
            setIsLoading(false);
            isProcessingLogin.current = false;
        }
    };

    const checkAndRedirect = () => {
        try {
            const returnTo = localStorage.getItem('auth_return_to');
            if (returnTo) {
                localStorage.removeItem('auth_return_to');

                // Get clean current path
                const currentPath = window.location.pathname + window.location.search;

                // [FIX] Avoid redundant redirect if we are already where we want to be
                // This reduces "flickering" and satisfies "fewer redirects" request
                if (returnTo === currentPath || returnTo === '/' && currentPath === '/') {
                    // console.log('[AuthProvider] Already on target page, skipping redirect');
                    return;
                }

                // Ensure we don't redirect to external sites
                if (returnTo.startsWith('/') && !returnTo.startsWith('//')) {
                    router.replace(returnTo);
                } else {
                    router.replace('/account');
                }
            }
        } catch (e) {
            // ignore
        }
    };


    const trySilentMsalLogin = async (): Promise<boolean> => {
        if (!msalInstance || !canAttemptAuth()) return false;

        try {
            const accounts = msalInstance.getAllAccounts();
            if (accounts.length > 0) {
                const account = accounts[0];
                msalInstance.setActiveAccount(account);
                const result = await msalInstance.acquireTokenSilent({
                    ...loginRequest,
                    account
                });
                if (result) {
                    // Silent recovery - do NOT redirect
                    await handleLoginSuccess(result, false);
                    recordAuthAttempt(true);
                    return true;
                }
            }
        } catch (e) {
            // console.warn('[AuthProvider] Recovery silent login failed:', e);
            recordAuthAttempt(false);
        }
        return false;
    };

    /**
     * loginWithMicrosoft - User-initiated login
     * 
     * [ARCHITECTURE] Redirect Login
     * We use `loginRedirect` to ensure the most reliable login experience.
     * While popups are seamless, they often face issues with modern browser security,
     * popup blockers, and mobile environments. Redirects provide a consistent flow.
     */
    const loginWithMicrosoft = async () => {
        return loginWithRedirect();
    };


    /**
     * loginWithRedirect - Fallback for when popups are blocked
     * 
     * Stores the current URL (or requested return URL) in localStorage
     * so checkAndRedirect() can return the user there after the MSAL redirect dance.
     */
    const loginWithRedirect = async (returnUrl?: string) => {
        if (!msalInstance) {
            throw new Error('Microsoft login is not available.');
        }

        // Store return URL
        const target = returnUrl || (typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/account');
        localStorage.setItem('auth_return_to', target);

        try {
            await msalInstance.loginRedirect(loginRequest);
        } catch (error) {
            // console.error('[AuthProvider] Redirect login error:', error);
            throw error;
        }
    };


    const signup = async (userData: SignupData) => {
        setIsLoading(true);
        try {
            const response = await signupWithPasswordAction(userData);
            localStorage.setItem('auth_token', response.access_token);
            localStorage.setItem('refresh_token', response.refresh_token);
            try {
                const committees = await authApi.fetchAndPersistUserCommittees(response.user.id, response.access_token);
                setUser({ ...response.user, committees });
            } catch (e) {
                setUser(response.user);
            }
        } catch (error) {
            console.error('Signup error:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        setIsLoggingOut(true);

        try {
            await logoutAction();
        } catch (error) {
            console.error('Failed to logout:', error);
        }

        // Clear local session artifacts
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');

        // Clear user-specific committees cache
        if (user?.id) {
            localStorage.removeItem(`user_committees_${user.id}`);
        }

        // Thoroughly clear MSAL cache and other auth-related items from localStorage
        try {
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && (key.startsWith('msal.') || key.startsWith('user_committees_'))) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(k => localStorage.removeItem(k));
            sessionStorage.clear();
        } catch (e) {
            // ignore
        }

        // If MSAL is initialized, clear the active account
        if (msalInstance) {
            try {
                msalInstance.setActiveAccount(null);
            } catch (e) {
                // ignore
            }
        }

        setUser(null);
    };

    const refreshUser = async () => {
        const token = localStorage.getItem('auth_token');
        if (token) {
            try {
                const userData = await authApi.fetchUserDetails(token);
                if (userData) {
                    try {
                        const committees = await authApi.fetchAndPersistUserCommittees(userData.id, token);
                        setUser({ ...userData, committees });
                    } catch (e) {
                        setUser(userData);
                    }
                }
            } catch (error) {
                console.error('Failed to refresh user:', error);
                logout();
            }
        }
    };

    // Memoize action functions to keep them stable
    const authActions = {
        loginWithMicrosoft,
        logout,
        signup,
        refreshUser,
        loginWithRedirect,
    };

    const authStatus = {
        status: (!!user ? 'authenticated' : (isLoading ? 'checking' : 'unauthenticated')) as AuthStatus,
        isLoading: isLoading || (isMsalInitializing && !user),
        isLoggingOut,
        authError,
    };

    // Legacy context value for backward compatibility
    const legacyValue = {
        user,
        isAuthenticated: !!user,
        isLoading: isLoading || (isMsalInitializing && !user),
        isLoggingOut,
        loginWithMicrosoft,
        logout,
        signup,
        refreshUser,
        authError,
        loginWithRedirect,
    };

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

/**
 * useAuthUser - Subscribe only to user data changes
 * Use this when you only need user information (e.g., displaying user name, email)
 * This hook only re-renders when the user object changes
 */
export function useAuthUser() {
    const user = useContext(AuthUserContext);
    return user;
}

/**
 * useAuthStatus - Subscribe only to auth status changes
 * Use this when you only need authentication status (e.g., checking if logged in)
 * This hook only re-renders when status/loading/error changes
 */
export function useAuthStatus() {
    const context = useContext(AuthStatusContext);
    return context;
}

/**
 * useAuthActions - Get auth action functions
 * Use this when you only need to call auth functions (login, logout, etc.)
 * This hook NEVER re-renders (stable function references)
 */
export function useAuthActions() {
    const context = useContext(AuthActionsContext);
    if (context === undefined) {
        throw new Error('useAuthActions must be used within an AuthProvider');
    }
    return context;
}

/**
 * useAuth - Legacy hook for backward compatibility
 * Returns all auth state and functions
 * Use the granular hooks above for better performance
 */
export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
