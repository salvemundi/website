'use client';

import { authClient } from '@/lib/auth';

/**
 * Enhanced useAuth hook that leverages Better Auth session.
 * Replaces previous stub to provide real authentication and membership state.
 */
export function useAuth() {
    const { data: session, isPending, error } = authClient.useSession();

    return {
        isAuthenticated: !!session,
        user: session?.user ?? null,
        isPending,
        error
    };
}

/**
 * Legacy compatibility hook (if needed by some components)
 */
export function useAuthActions() {
    return {
        login: () => authClient.signIn.social({ 
            provider: 'microsoft'
        }),
        logout: () => authClient.signOut(),
    };
}
