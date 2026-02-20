'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { getMsalInstance, isInternalAuthWindow } from '../providers/msal-client';
import { loginRequest } from '@/shared/config/msalConfig';
import { AuthenticationResult, EventType, EventMessage } from '@azure/msal-browser';

interface UseMsalAuthResult {
    isInitializing: boolean;
    error: Error | null;
    handleRedirectPromise: () => Promise<AuthenticationResult | null>;
    loginWithRedirect: (returnUrl?: string) => Promise<void>;
    trySilentLogin: () => Promise<AuthenticationResult | null>;
    logoutMsal: () => Promise<void>;
}

export function useMsalAuth(canAttemptAuth: () => boolean): UseMsalAuthResult {
    const [isInitializing, setIsInitializing] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const hasProcessedRedirect = useRef(false);

    // Initialize MSAL and setup event listeners if needed
    useEffect(() => {
        let isMounted = true;

        const init = async () => {
            try {
                const instance = await getMsalInstance();
                if (isMounted) {
                    setIsInitializing(false);
                }
            } catch (err) {
                if (isMounted) {
                    setError(err instanceof Error ? err : new Error('Failed to initialize MSAL'));
                    setIsInitializing(false);
                }
            }
        };

        init();

        return () => {
            isMounted = false;
        };
    }, []);

    const handleRedirectPromise = useCallback(async (): Promise<AuthenticationResult | null> => {
        const instance = await getMsalInstance();
        if (!instance) {
            setIsInitializing(false);
            return null;
        }

        const url = new URL(window.location.href);
        const hasAuthArtifacts = url.hash.includes('code=') || url.hash.includes('error=') ||
            url.searchParams.has('code') || url.searchParams.has('state');

        if (isInternalAuthWindow() && !hasAuthArtifacts) {
            setIsInitializing(false);
            return null;
        }

        if (hasProcessedRedirect.current) {
            return null;
        }

        if (!canAttemptAuth()) {
            setIsInitializing(false);
            return null;
        }

        try {
            const response = await instance.handleRedirectPromise();

            if (response && response.account) {
                if (hasProcessedRedirect.current) return null;
                hasProcessedRedirect.current = true;

                if (isInternalAuthWindow()) {
                    setTimeout(() => {
                        if (typeof window !== 'undefined' && window.opener) {
                            window.close();
                        }
                    }, 500);
                    return null;
                }

                instance.setActiveAccount(response.account);
                return response;

            } else if (hasAuthArtifacts) {
                // We had auth artifacts but no response - likely an error
                // Clean up URL artifacts
                const cleanUrl = new URL(window.location.href);
                cleanUrl.hash = '';
                cleanUrl.searchParams.delete('code');
                cleanUrl.searchParams.delete('state');
                cleanUrl.searchParams.delete('session_state');
                cleanUrl.searchParams.delete('error');
                cleanUrl.searchParams.delete('error_description');
                window.history.replaceState({}, document.title, cleanUrl.toString());

                if (isInternalAuthWindow()) {
                    setTimeout(() => {
                        if (typeof window !== 'undefined' && window.opener) {
                            window.close();
                        }
                    }, 500);
                }
                return null;
            } else {
                // Not a redirect return - restore active account from cache
                const accounts = instance.getAllAccounts();
                if (accounts.length > 0) {
                    const account = accounts[0];
                    instance.setActiveAccount(account);
                }
                return null;
            }
        } catch (err: any) {
            setError(err instanceof Error ? err : new Error(err?.message || 'Authentication initialization failed'));
            return null;
        } finally {
            setIsInitializing(false);
        }
    }, [canAttemptAuth]);


    const trySilentLogin = useCallback(async (): Promise<AuthenticationResult | null> => {
        const instance = await getMsalInstance();
        if (!instance || !canAttemptAuth()) return null;

        try {
            const accounts = instance.getAllAccounts();
            if (accounts.length > 0) {
                const account = accounts[0];
                instance.setActiveAccount(account);
                const result = await instance.acquireTokenSilent({
                    ...loginRequest,
                    account
                });
                if (result) {
                    return result;
                }
            } else if (!isInternalAuthWindow()) {
                const ssoAttempted = sessionStorage.getItem('msal_sso_attempted');
                if (!ssoAttempted) {
                    sessionStorage.setItem('msal_sso_attempted', 'true');
                    const ssoResult = await instance.ssoSilent(loginRequest);
                    if (ssoResult) {
                        if (hasProcessedRedirect.current) return null;
                        hasProcessedRedirect.current = true;
                        return ssoResult;
                    }
                }
            }
        } catch (e) {
            // Expected if no active Microsoft session/consent or interaction required
        }
        return null;
    }, [canAttemptAuth]);


    const loginWithRedirect = useCallback(async (returnUrl?: string) => {
        const instance = await getMsalInstance();
        if (!instance) {
            throw new Error('Microsoft login is not available.');
        }

        const target = returnUrl || (typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/account');
        localStorage.setItem('auth_return_to', target);

        try {
            await instance.loginRedirect(loginRequest);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Redirect login error'));
            throw err;
        }
    }, []);

    const logoutMsal = useCallback(async () => {
        const instance = await getMsalInstance();
        if (instance) {
            try {
                instance.setActiveAccount(null);
                const keysToRemove = [];
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.startsWith('msal.')) {
                        keysToRemove.push(key);
                    }
                }
                keysToRemove.forEach(k => localStorage.removeItem(k));
                sessionStorage.removeItem('msal_sso_attempted');
            } catch (e) {
                // ignore
            }
        }
    }, []);

    return {
        isInitializing,
        error,
        handleRedirectPromise,
        loginWithRedirect,
        trySilentLogin,
        logoutMsal
    };
}
