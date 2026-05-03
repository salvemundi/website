'use client';

import { authClient } from '@/lib/auth';

/**
 * Toont de WhatsApp-link alleen voor ingelogde leden.
 * Auth-controle gebeurt client-side via Better Auth useSession hook.
 * Gescheiden als island zodat page.tsx een pure server-component blijft.
 */
import { MessageCircle } from 'lucide-react';

/**
 * Toont de WhatsApp-link alleen voor ingelogde leden.
 * Auth-controle gebeurt client-side via Better Auth useSession hook.
 * De isLoggedIn prop wordt gebruikt voor de initiële SSR-render om hydration mismatches te voorkomen.
 */
export default function WhatsAppLink({ isLoggedIn }: { isLoggedIn: boolean }) {
    const { data: session, isPending } = authClient.useSession();

    // Gebruik de prop tijdens de initiële render/hydration. 
    // Na hydration gebruiken we de live session status.
    const activeIsLoggedIn = isPending ? isLoggedIn : !!session?.user;

    // Niet renderen als de gebruiker niet ingelogd is
    if (!activeIsLoggedIn) return null;

    return (
        <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[var(--color-purple-50)] text-[var(--color-purple-500)] flex items-center justify-center flex-shrink-0 shadow-sm">
                <MessageCircle className="h-6 w-6" />
            </div>
            <div>
                <a
                    href="https://wa.me/31624827777"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--text-main)] text-xl font-bold hover:text-[var(--color-purple-500)] transition-colors"
                >
                    WhatsApp
                </a>
            </div>
        </div>
    );
}
