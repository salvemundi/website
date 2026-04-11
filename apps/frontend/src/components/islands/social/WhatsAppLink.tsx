'use client';

import { authClient } from '@/lib/auth';

/**
 * Toont de WhatsApp-link alleen voor ingelogde leden.
 * Auth-controle gebeurt client-side via Better Auth useSession hook.
 * Gescheiden als island zodat page.tsx een pure server-component blijft.
 */
export default function WhatsAppLink() {
    const { data: session } = authClient.useSession();

    // Niet renderen als de gebruiker niet ingelogd is
    if (!session?.user) return null;

    return (
        <div className="flex items-start items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[var(--color-purple-100)] flex items-center justify-center flex-shrink-0">
                <span className="text-2xl" aria-hidden="true">💬</span>
            </div>
            <div>
                <a
                    href="https://wa.me/31624827777"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--text-main)] text-[1.3rem] font-bold hover:opacity-80 transition-opacity"
                >
                    WhatsApp
                </a>
            </div>
        </div>
    );
}
