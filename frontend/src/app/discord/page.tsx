'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/providers/auth-provider';

export default function DiscordPage() {
    const { user, isAuthenticated, isLoading, loginWithMicrosoft } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (isLoading) return;

        if (!isAuthenticated) {
            // Niet ingelogd -> naar login
            // Niet ingelogd -> naar login (via Microsoft)
            localStorage.setItem('auth_return_to', '/discord');
            loginWithMicrosoft();
            return;
        }

        // Check if user has active membership
        // We check mostly for membership_status === 'active', but fail-safe if is_member is true
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
