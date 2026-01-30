'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isMsalInitializing, setIsMsalInitializing] = useState(true);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

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
        if (!refreshToken) return;

        // Only refresh if token is expiring soon or already expired
        if (!isTokenExpiringSoon()) return;

        console.log('[AuthProvider] Proactively refreshing token (expiring soon)...');
        try {
            const response = await authApi.refreshAccessToken(refreshToken);
            localStorage.setItem('auth_token', response.access_token);
            localStorage.setItem('refresh_token', response.refresh_token);
            setUser(response.user);
            console.log('[AuthProvider] Token refreshed successfully');
        } catch (e) {
            console.error('[AuthProvider] Proactive refresh failed:', e);
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
                if (refreshToken && !isLoading && !isMsalInitializing && !isLoggingOut) {
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
            if (refreshToken && !isLoading && !isMsalInitializing && !isLoggingOut) {
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
                        } catch (e) {
                            setUser(userData);
                        }
                    } else {
                        // Token was invalid/expired and was cleared by fetchUserDetails
                        // Try refresh if we still have a refresh token
                        if (refreshToken) {
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
                            } catch (refreshError) {
                                // Refresh failed, clear storage
                                localStorage.removeItem('auth_token');
                                localStorage.removeItem('refresh_token');
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
                    // Attempt refresh flow
                    if (refreshToken) {
                        try {
                            const response = await authApi.refreshAccessToken(refreshToken);
                            localStorage.setItem('auth_token', response.access_token);
                            localStorage.setItem('refresh_token', response.refresh_token);
                            setUser(response.user);
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
            // Try silent recovery as last resort
            await trySilentMsalLogin();
        } finally {
            setIsLoading(false);
        }
    };

    // Handle MSAL redirect promise on component mount
    useEffect(() => {
        const handleRedirect = async () => {
            if (!msalInstance) {
                setIsMsalInitializing(false);
                return;
            }

            // Check if noAuto is in the URL - if so, skip MSAL redirect processing
            // to prevent auto-login after explicit logout
            if (typeof window !== 'undefined') {
                const urlParams = new URLSearchParams(window.location.search);
                if (urlParams.get('noAuto') === 'true') {
                    setIsMsalInitializing(false);
                    return;
                }
            }

            try {
                await msalInstance.initialize();
                const response = await msalInstance.handleRedirectPromise();

                if (response && response.account) {
                    msalInstance.setActiveAccount(response.account);
                    await handleLoginSuccess(response);
                } else {
                    // Proactively restore active account from cache if nothing was returned by redirect
                    const accounts = msalInstance.getAllAccounts();

                    if (accounts.length > 0) {
                        const account = accounts[0];
                        msalInstance.setActiveAccount(account);
                    }

                    // If we are not currently authenticated with Directus, attempt silent login
                    if (!user && !localStorage.getItem('auth_token')) {
                        if (accounts.length > 0) {
                            const account = accounts[0];
                            console.log('[AuthProvider] Active MSAL account found, attempting silent login...');
                            try {
                                const silentResult = await msalInstance.acquireTokenSilent({
                                    ...loginRequest,
                                    account: account
                                });
                                if (silentResult) {
                                    await handleLoginSuccess(silentResult);
                                }
                            } catch (silentError) {
                                console.warn('[AuthProvider] Silent MSAL token acquisition failed:', silentError);
                            }
                        } else {
                            // No cached account, try ssoSilent to check for existing Microsoft session cookie
                            try {
                                console.log('[AuthProvider] No cached account, attempting ssoSilent...');
                                const ssoResult = await msalInstance.ssoSilent(loginRequest);
                                if (ssoResult) {
                                    console.log('[AuthProvider] ssoSilent success');
                                    await handleLoginSuccess(ssoResult);
                                }
                            } catch (ssoError) {
                                console.log('[AuthProvider] ssoSilent failed (expected if not logged in):', ssoError);
                            }
                        }
                    }
                }
            } catch (error) {
                console.error('Error handling MSAL initialization:', error);
            } finally {
                setIsMsalInitializing(false);
            }
        };

        handleRedirect();
    }, []);

    const trySilentMsalLogin = async (): Promise<boolean> => {
        if (!msalInstance) return false;
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
                    await handleLoginSuccess(result);
                    return true;
                }
            }
        } catch (e) {
            console.warn('[AuthProvider] Recovery silent login failed:', e);
        }
        return false;
    };

    import { useRouter } from 'next/navigation';
    // ... (existing imports)

    // ...

    const router = useRouter();

    // ... (existing helper functions)

    const handleLoginSuccess = async (loginResponse: unknown, shouldRedirect: boolean = false) => {
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
            }
        } catch (error) {
            console.error('Microsoft login processing error:', error);
            toast.error('Inloggen mislukt. Probeer het opnieuw.', { id: toastId });
            throw error; // Re-throw to be handled by caller if any
        } finally {
            setIsLoading(false);
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

    // Handle MSAL redirect promise on component mount
    useEffect(() => {
        const handleRedirect = async () => {
            if (!msalInstance) {
                setIsMsalInitializing(false);
                return;
            }

            // Check if noAuto is in the URL - if so, skip MSAL redirect processing
            // to prevent auto-login after explicit logout
            if (typeof window !== 'undefined') {
                const urlParams = new URLSearchParams(window.location.search);
                if (urlParams.get('noAuto') === 'true') {
                    setIsMsalInitializing(false);
                    return;
                }
            }

            try {
                await msalInstance.initialize();
                const response = await msalInstance.handleRedirectPromise();

                if (response && response.account) {
                    msalInstance.setActiveAccount(response.account);
                    // This is the interactive return - we SHOULD redirect
                    await handleLoginSuccess(response, true);
                } else {
                    // Proactively restore active account from cache if nothing was returned by redirect
                    const accounts = msalInstance.getAllAccounts();

                    if (accounts.length > 0) {
                        const account = accounts[0];
                        msalInstance.setActiveAccount(account);
                    }

                    // If we are not currently authenticated with Directus, attempt silent login
                    if (!user && !localStorage.getItem('auth_token')) {
                        if (accounts.length > 0) {
                            const account = accounts[0];
                            console.log('[AuthProvider] Active MSAL account found, attempting silent login...');
                            try {
                                const silentResult = await msalInstance.acquireTokenSilent({
                                    ...loginRequest,
                                    account: account
                                });
                                if (silentResult) {
                                    // Silent recovery - do NOT redirect
                                    await handleLoginSuccess(silentResult, false);
                                }
                            } catch (silentError) {
                                console.warn('[AuthProvider] Silent MSAL token acquisition failed:', silentError);
                            }
                        } else {
                            // No cached account, try ssoSilent to check for existing Microsoft session cookie
                            try {
                                console.log('[AuthProvider] No cached account, attempting ssoSilent...');
                                const ssoResult = await msalInstance.ssoSilent(loginRequest);
                                if (ssoResult) {
                                    console.log('[AuthProvider] ssoSilent success');
                                    // SSO Silent - do NOT redirect (we are already on the page we want, or will be handled by route)
                                    await handleLoginSuccess(ssoResult, false);
                                }
                            } catch (ssoError) {
                                console.log('[AuthProvider] ssoSilent failed (expected if not logged in):', ssoError);
                            }
                        }
                    }
                }
            } catch (error) {
                console.error('Error handling MSAL initialization:', error);
            } finally {
                setIsMsalInitializing(false);
            }
        };

        handleRedirect();
    }, []);

    const trySilentMsalLogin = async (): Promise<boolean> => {
        if (!msalInstance) return false;
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
                    return true;
                }
            }
        } catch (e) {
            console.warn('[AuthProvider] Recovery silent login failed:', e);
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
                isLoading: isLoading || isMsalInitializing,
                isLoggingOut,
                loginWithMicrosoft,
                logout,
                signup,
                refreshUser,
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
