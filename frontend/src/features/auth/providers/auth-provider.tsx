'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
        // console.log('MSAL runtime config', {
        //     clientId: process.env.NEXT_PUBLIC_ENTRA_CLIENT_ID,
        //     tenantId: process.env.NEXT_PUBLIC_ENTRA_TENANT_ID,
        //     redirectUri: process.env.NEXT_PUBLIC_AUTH_REDIRECT_URI,
        //     directusAPI: process.env.NEXT_PUBLIC_DIRECTUS_API_KEY,
        // });
    }
} catch (error) {
    console.warn('⚠️ MSAL initialization failed. Microsoft login will be disabled.');
    console.warn('💡 Tip: MSAL requires HTTPS or "localhost" (not IP addresses like 192.168.x.x).');
    console.warn('   Over LAN, expose the dev server over HTTPS and set NEXT_PUBLIC_AUTH_REDIRECT_URI to that HTTPS origin, also adding it in the Entra app.');
    console.error('Error details:', error);
}

export interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    loginWithMicrosoft: () => Promise<void>;
    logout: () => void;
    signup: (userData: SignupData) => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

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

        window.addEventListener('auth:expired', onAuthExpired as EventListener);
        return () => {
            window.removeEventListener('auth:expired', onAuthExpired as EventListener);
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
                        setUser(userData);
                    } else {
                        // Token was invalid/expired and was cleared by fetchUserDetails
                        // Try refresh if we still have a refresh token
                        if (refreshToken) {
                            try {
                                const response = await authApi.refreshAccessToken(refreshToken);
                                localStorage.setItem('auth_token', response.access_token);
                                localStorage.setItem('refresh_token', response.refresh_token);
                                setUser(response.user);
                            } catch (refreshError) {
                                // Refresh failed, clear storage
                                localStorage.removeItem('auth_token');
                                localStorage.removeItem('refresh_token');
                                setUser(null);
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
                            setUser(null);
                        }
                    } else {
                        localStorage.removeItem('auth_token');
                        setUser(null);
                    }
                }
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            localStorage.removeItem('auth_token');
            localStorage.removeItem('refresh_token');
        } finally {
            setIsLoading(false);
        }
    };

    // Handle MSAL redirect promise on component mount
    useEffect(() => {
        const handleRedirect = async () => {
            if (!msalInstance) return;

            try {
                await msalInstance.initialize();
                const response = await msalInstance.handleRedirectPromise();

                if (response && response.account) {
                    msalInstance.setActiveAccount(response.account);
                    await handleLoginSuccess(response);
                }
            } catch (error) {
                console.error('Error handling redirect promise:', error);
            }
        };

        handleRedirect();
    }, []);

    const handleLoginSuccess = async (loginResponse: any) => {
        setIsLoading(true);
        const toastId = toast.loading('Inloggen verwerken...');

        try {
            // Get the ID token to send to backend
            const idToken = loginResponse.idToken;
            const userEmail = loginResponse.account.username;

            // Authenticate with backend using Entra ID token
            const response = await authApi.loginWithEntraId(idToken, userEmail);

            // Validate the returned access token before persisting it. If the
            // token is invalid, do not store it (prevents other components from
            // making requests with a bad token immediately after login).
            let validatedUser = null;
            try {
                validatedUser = await authApi.fetchUserDetails(response.access_token);
            } catch (e) {
                console.warn('Could not validate access token returned from Entra login:', e);
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
            setUser(validatedUser);
            toast.success('Inloggen geslaagd!', { id: toastId });
        } catch (error) {
            console.error('Microsoft login processing error:', error);
            toast.error('Inloggen mislukt. Probeer het opnieuw.', { id: toastId });
            throw error; // Re-throw to be handled by caller if any
        } finally {
            setIsLoading(false);
        }
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
            setUser(response.user);
        } catch (error) {
            console.error('Signup error:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
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
        setUser(null);
    };

    const refreshUser = async () => {
        const token = localStorage.getItem('auth_token');
        if (token) {
            try {
                const userData = await authApi.fetchUserDetails(token);
                setUser(userData);
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
                isLoading,
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
