'use client';

import { authClient } from '@/lib/auth';
import { getLoginCallbackURL } from '@/lib/utils/login-redirect';
import type { EnrichedUser } from '@/types/auth';

/**
 * Enhanced useAuth hook that leverages Better Auth session.
 * Replaces previous stub to provide real authentication and membership state.
 */
export function useAuth() {
    const { data: session, isPending, error } = authClient.useSession();
    const user: EnrichedUser | null = session?.user ?? null;

    return {
        isAuthenticated: !!session,
        user,
        isPending,
        error
    };
}

/**
 * Compatibility hook (if needed by some components)
 */
export function useAuthActions() {
    return {
        login: (callbackURL?: string) => authClient.signIn.social({ 
            provider: 'microsoft',
            callbackURL: getLoginCallbackURL(callbackURL)
        }),
        logout: () => authClient.signOut() };
}
