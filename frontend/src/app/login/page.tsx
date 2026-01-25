'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/features/auth/providers/auth-provider';

function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { loginWithMicrosoft, isLoading, isAuthenticated } = useAuth();
    const [error, setError] = useState('');

    // Get the returnTo URL from query parameters, fallback to '/account'
    const returnTo = searchParams.get('returnTo') || '/account';
    const noAuto = searchParams.get('noAuto') === 'true';
    const [isAutoRedirecting, setIsAutoRedirecting] = useState(false);

    // If the user is already authenticated, redirect to the intended page.
    useEffect(() => {
        if (!isLoading && isAuthenticated) {
            // Priority: URL query param (if not default) -> localStorage -> default /account
            const stored = localStorage.getItem('auth_return_to');
            let target = returnTo;

            if (target === '/account' && stored) {
                target = stored;
            }

            // Clear stored URL to avoid unexpected redirects later
            localStorage.removeItem('auth_return_to');

            // Ensure target is an internal path
            const safeTarget = target.startsWith('/') ? target : '/account';
            router.replace(safeTarget);
        }
    }, [isLoading, isAuthenticated, router, returnTo]);

    // Automate SSO Login
    useEffect(() => {
        const triggerAutoLogin = async () => {
            // Check if we're in an MSAL callback flow (hash or code in URL)
            // If so, we should definitely NOT trigger another login attempt.
            const isCallback = typeof window !== 'undefined' && (window.location.hash || window.location.search.includes('code='));
            if (isCallback) return;

            if (!isLoading && !isAuthenticated && !error && !noAuto && !isAutoRedirecting) {
                setIsAutoRedirecting(true);
                try {
                    // Store the returnTo URL in localStorage to persist across MSAL redirect
                    localStorage.setItem('auth_return_to', returnTo);
                    await loginWithMicrosoft();
                } catch (err: any) {
                    // Ignore transient interaction errors that will be resolved by handleRedirectPromise
                    if (err?.name === 'BrowserAuthError' && err?.errorCode === 'interaction_in_progress') {
                        setIsAutoRedirecting(false);
                        return;
                    }

                    setError('Microsoft login failed. Please try again.');
                    setIsAutoRedirecting(false);
                    console.error(err);
                }
            }
        };

        triggerAutoLogin();
    }, [isLoading, isAuthenticated, error, noAuto, isAutoRedirecting, loginWithMicrosoft, returnTo]);

    const handleMicrosoftLogin = async () => {
        setError('');

        try {
            // Store the returnTo URL in localStorage to persist across MSAL redirect
            localStorage.setItem('auth_return_to', returnTo);
            await loginWithMicrosoft();
            // Note: MSAL redirect will happen, handleRedirectPromise is in AuthProvider.
        } catch (err) {
            setError('Microsoft login failed. Please try again.');
            console.error(err);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--bg-main)]">
            <div className="container mx-auto px-4 py-16">
                <div className="max-w-md mx-auto">
                    <div className="bg-[var(--bg-card)] dark:border dark:border-white/10 rounded-3xl shadow-2xl p-8">
                        <h1 className="text-3xl font-bold text-gradient mb-2 text-center">
                            {isAutoRedirecting ? 'Redirecting...' : 'Welcome Back'}
                        </h1>
                        <p className="text-theme-muted text-center mb-8">
                            {isAutoRedirecting
                                ? 'Logging you in automatically via SSO'
                                : 'Login to your account'}
                        </p>

                        {error && (
                            <div className="mb-6 p-4 bg-theme-purple/5 rounded-lg">
                                <p className="text-theme-purple text-sm">{error}</p>
                            </div>
                        )}

                        {/* Microsoft Login Button */}
                        <button
                            onClick={handleMicrosoftLogin}
                            disabled={isLoading || isAutoRedirecting}
                            className="w-full mb-6 flex items-center justify-center gap-3 px-6 py-3 bg-gradient-theme text-theme-white rounded-full shadow-lg shadow-theme-purple/30 transition-transform hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 23 23" fill="none">
                                <path fill="#f25022" d="M0 0h11v11H0z" />
                                <path fill="#00a4ef" d="M12 0h11v11H12z" />
                                <path fill="#7fba00" d="M0 12h11v11H0z" />
                                <path fill="#ffb900" d="M12 12h11v11H12z" />
                            </svg>
                            <span>
                                {isLoading || isAutoRedirecting ? 'Logging in...' : 'Login with Microsoft'}
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-theme-purple/20 border-t-theme-purple" />
            </div>
        }>
            <LoginContent />
        </Suspense>
    );
}
