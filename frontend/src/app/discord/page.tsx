'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/providers/auth-provider';
import ProtectedRoute from '@/components/ProtectedRoute';

/**
 * DiscordPage - Protected auth-required redirect to Discord
 * 
 * Flow: ProtectedRoute ensures auth → checks membership → redirects to Discord or /lidmaatschap
 */
export default function DiscordPage() {
    return (
        <ProtectedRoute requireAuth>
            <DiscordContent />
        </ProtectedRoute>
    );
}

function DiscordContent() {
    const { user, isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (isLoading) return;

        // Auth is guaranteed by ProtectedRoute
        // Check membership and redirect accordingly
        if (user?.membership_status === 'active' || user?.is_member) {
            // Wel lid -> naar Discord
            window.location.href = 'https://discord.com/invite/TQ8K9ZSbdW';
        } else {
            // Wel ingelogd, geen lid -> naar lidmaatschap pagina
            router.replace('/lidmaatschap');
        }
    }, [isAuthenticated, isLoading, user, router]);

    return (
        <div className="flex min-h-[60vh] w-full items-center justify-center">
            <div className="text-center">
                <h1 className="mb-2 text-2xl font-bold text-theme-purple">Verbinding controleren...</h1>
                <p className="text-gray-600 dark:text-gray-300">
                    Een moment geduld, we controleren je lidmaatschap en sturen je door naar Discord.
                </p>
                <div className="mt-4 flex justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-theme-purple border-t-transparent"></div>
                </div>
            </div>
        </div>
    );
}
