'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { PublicClientApplication } from '@azure/msal-browser';
import { msalConfig, loginRequest } from '@/shared/config/msalConfig';
import * as authApi from '@/shared/lib/auth';
import { User, SignupData } from '@/shared/model/types/auth';
import { toast } from 'sonner';

// Initialize MSAL instance with error handling
let msalInstance: PublicClientApplication | null = null;
try {
    if (typeof window !== 'undefined') {
        msalInstance = new PublicClientApplication(msalConfig);
    }
} catch (error) {
    // MSAL initialization failed
}

export interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    loginWithMicrosoft: () => Promise<void>;
    logout: () => void;
    signup: (userData: SignupData) => Promise<void>;
    refreshUser: () => Promise<void>;
    isLoggingOut: boolean;
    authError: string | null;
}

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
                console.log('[AuthProvider] In error backoff period, skipping auth attempt');
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
            console.log('[AuthProvider] Rate limit reached (3 attempts in 5s), skipping');
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
        console.log('[AuthProvider] Clearing corrupted auth state after repeated errors');
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
                console.warn('[AuthProvider] Failed to clear MSAL state:', e);
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

        console.log('[AuthProvider] Proactively refreshing token (expiring soon)...');
        try {
            const response = await authApi.refreshAccessToken(refreshToken);
            localStorage.setItem('auth_token', response.access_token);
            localStorage.setItem('refresh_token', response.refresh_token);
            setUser(response.user);
            recordAuthAttempt(true);
            console.log('[AuthProvider] Token refreshed successfully');
        } catch (e) {
            console.error('[AuthProvider] Proactive refresh failed:', e);
            recordAuthAttempt(false);
            // If refresh fails, try silent recovery via MSAL to keep session alive
            await trySilentMsalLogin();
        }
    };

    // Check for existing session on mount
    useEffect(() => {
        checkAuthStatus();

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
                    console.log('[AuthProvider] Tab became visible, checking token...');
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

    const checkAuthStatus = async () => {
        // Skip if we're already in an auth attempt cooldown
        if (!canAttemptAuth() && authErrorCount > 0) {
            console.log('[AuthProvider] Skipping checkAuthStatus due to rate limiting');
            setIsLoading(false);
            return;
        }

        try {
            const token = localStorage.getItem('auth_token');
            const refreshToken = localStorage.getItem('refresh_token');

            if (token) {
                try {
                    const userData = await authApi.fetchUserDetails(token);
                    if (userData) {
                        try {
                            const committees = await authApi.fetchAndPersistUserCommittees(userData.id, token || undefined);
                            setUser({ ...userData, committees });
                            recordAuthAttempt(true);
                        } catch (e) {
                            setUser(userData);
                            recordAuthAttempt(true);
                        }
                    } else {
                        // Token was invalid/expired and was cleared by fetchUserDetails
                        // Try refresh if we still have a refresh token
                        if (refreshToken && canAttemptAuth()) {
                            try {
                                const response = await authApi.refreshAccessToken(refreshToken);
                                localStorage.setItem('auth_token', response.access_token);
                                localStorage.setItem('refresh_token', response.refresh_token);
                                try {
                                    const committees = await authApi.fetchAndPersistUserCommittees(response.user.id, response.access_token);
                                    setUser({ ...response.user, committees });
                                } catch (e) {
                                    setUser(response.user);
                                }
                                recordAuthAttempt(true);
                            } catch (refreshError) {
                                // Refresh failed, clear storage
                                localStorage.removeItem('auth_token');
                                localStorage.removeItem('refresh_token');
                                recordAuthAttempt(false);
                                // Try silent recovery before giving up
                                const recovered = await trySilentMsalLogin();
                                if (!recovered) {
                                    setUser(null);
                                }
                            }
                        } else {
                            setUser(null);
                        }
                    }
                } catch (error) {
                    // An unexpected error occurred while fetching details
                    console.error('Auth check failed (fetch user):', error);
                    recordAuthAttempt(false);
                    // Attempt refresh flow
                    if (refreshToken && canAttemptAuth()) {
                        try {
                            const response = await authApi.refreshAccessToken(refreshToken);
                            localStorage.setItem('auth_token', response.access_token);
                            localStorage.setItem('refresh_token', response.refresh_token);
                            setUser(response.user);
                            recordAuthAttempt(true);
                        } catch (refreshError) {
                            localStorage.removeItem('auth_token');
                            localStorage.removeItem('refresh_token');
                            const recovered = await trySilentMsalLogin();
                            if (!recovered) {
                                setUser(null);
                            }
                        }
                    } else {
                        localStorage.removeItem('auth_token');
                        const recovered = await trySilentMsalLogin();
                        if (!recovered) {
                            setUser(null);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            localStorage.removeItem('auth_token');
            localStorage.removeItem('refresh_token');
            recordAuthAttempt(false);
            // Try silent recovery as last resort
            await trySilentMsalLogin();
        } finally {
            setIsLoading(false);
        }
    };

    const hasProcessedRedirect = useRef(false);

    // Handle MSAL redirect promise and silent login on component mount
    useEffect(() => {
        const handleRedirect = async () => {
            if (!msalInstance || hasProcessedRedirect.current) {
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

                    console.log('[AuthProvider] Redirect login successful');
                    msalInstance.setActiveAccount(response.account);
                    await handleLoginSuccess(response, true);
                    recordAuthAttempt(true);
                } else if (hasAuthArtifacts) {
                    // We had auth artifacts but no response - likely an error
                    console.warn('[AuthProvider] Auth artifacts present but no MSAL response');
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
                    // Only attempt this if we don't already have a user and no stored token
                    if (!user && !localStorage.getItem('auth_token') && accounts.length > 0) {
                        const account = accounts[0];
                        console.log('[AuthProvider] Attempting silent MSAL token acquisition...');
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
                            console.log('[AuthProvider] Silent MSAL failed, user must login manually');
                            recordAuthAttempt(false);
                        }
                    } else if (!user && !localStorage.getItem('auth_token') && accounts.length === 0) {
                        // Try ssoSilent to check for existing cookies (no account in cache)
                        // But only if we haven't attempted recently
                        try {
                            console.log('[AuthProvider] No accounts in cache, trying ssoSilent...');
                            const ssoResult = await msalInstance.ssoSilent(loginRequest);
                            if (ssoResult) {
                                if (hasProcessedRedirect.current) return;
                                hasProcessedRedirect.current = true;
                                await handleLoginSuccess(ssoResult, false);
                                recordAuthAttempt(true);
                            }
                        } catch (ssoError) {
                            // Expected if no active Microsoft session in browser
                            console.log('[AuthProvider] ssoSilent failed (expected if no session)');
                            recordAuthAttempt(false);
                        }
                    }
                }
            } catch (error: any) {
                console.error('[AuthProvider] MSAL init/redirect error:', error);
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

            // Authenticate with backend using Entra ID token
            const response = await authApi.loginWithEntraId(idToken || '', userEmail || '');

            // Validate the returned access token before persisting it. If the
            // token is invalid, do not store it (prevents other components from
            // making requests with a bad token immediately after login).
            let validatedUser = null;
            try {
                validatedUser = await authApi.fetchUserDetails(response.access_token);
            } catch (e) {
                // access token validation failed (log removed)
            }

            if (!validatedUser) {
                // Attempt to refresh using provided refresh token once as a fallback
                if (response.refresh_token) {
                    try {
                        const refreshed = await authApi.refreshAccessToken(response.refresh_token);
                        // Persist refreshed tokens and user
                        localStorage.setItem('auth_token', refreshed.access_token);
                        localStorage.setItem('refresh_token', refreshed.refresh_token);
                        setUser(refreshed.user);
                        toast.success('Inloggen geslaagd!', { id: toastId });
                        if (shouldRedirect) checkAndRedirect();
                        return;
                    } catch (refreshErr) {
                        console.error('Refresh after failed validation also failed:', refreshErr);
                    }
                }

                throw new Error('Login failed: received an invalid access token from the backend.');
            }

            // Persist tokens and set user after successful validation
            localStorage.setItem('auth_token', response.access_token);
            localStorage.setItem('refresh_token', response.refresh_token);
            try {
                const committees = await authApi.fetchAndPersistUserCommittees(validatedUser.id, response.access_token);
                setUser({ ...validatedUser, committees });
            } catch (e) {
                setUser(validatedUser);
            }
            toast.success('Inloggen geslaagd!', { id: toastId });

            if (shouldRedirect) {
                checkAndRedirect();
            } else {
                // If we are not redirecting to another page, clean up the current URL
                // to remove any auth artifacts like #code=... or ?code=...
                if (typeof window !== 'undefined') {
                    const url = new URL(window.location.href);
                    // Clear hash if it looks like an MSAL artifact
                    if (url.hash && (url.hash.includes('code=') || url.hash.includes('error='))) {
                        url.hash = '';
                    }
                    // Clear search params if they contain code/state
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
            console.warn('[AuthProvider] Recovery silent login failed:', e);
            recordAuthAttempt(false);
        }
        return false;
    };

    const loginWithMicrosoft = async () => {
        if (!msalInstance) {
            throw new Error('Microsoft login is not available. Use HTTPS with a redirect URI that matches your Entra app (set NEXT_PUBLIC_AUTH_REDIRECT_URI for LAN/IP testing).');
        }

        try {
            // Initialize MSAL if needed (though useEffect should have handled it)
            await msalInstance.initialize();

            // Attempt silent login first? No, loginRedirect handles the flow.

            // Login with redirect
            await msalInstance.loginRedirect(loginRequest);
            // Unlike loginPopup, this promise resolves only after the redirect is initiated.
            // The actual result is handled in handleRedirectPromise on return.
        } catch (error) {
            console.error('Microsoft login error:', error);
            throw error;
        }
    };

    const signup = async (userData: SignupData) => {
        setIsLoading(true);
        try {
            const response = await authApi.signupWithPassword(userData);
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
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
            try {
                await authApi.logout(refreshToken);
            } catch (error) {
                console.error('Failed to logout from Directus:', error);
            }
        }

        // Only clear local session, don't logout from Microsoft
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');

        // Clear user-specific committees cache
        if (user?.id) {
            localStorage.removeItem(`user_committees_${user.id}`);
        }

        // Thoroughly clear MSAL cache and other auth-related items from localStorage
        // to prevent automatic re-login loops.
        try {
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && (key.startsWith('msal.') || key.startsWith('user_committees_'))) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(k => localStorage.removeItem(k));

            // Also clear session storage
            sessionStorage.clear();
        } catch (e) {
            // ignore localStorage/sessionStorage access errors
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
        // We keep isLoggingOut true until the page is reloaded or redirected
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

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: !!user,
                // Only wait for MSAL if we don't have a user yet and we are still initializing
                isLoading: isLoading || (isMsalInitializing && !user),
                isLoggingOut,
                loginWithMicrosoft,
                logout,
                signup,
                refreshUser,
                authError,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
