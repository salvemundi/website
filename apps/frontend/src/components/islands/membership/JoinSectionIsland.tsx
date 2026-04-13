'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { authClient } from '@/lib/auth';

interface JoinSectionIslandProps {
    isLoading?: boolean;
    serverUser?: any | null; // Optional server-side user status
}

/**
 * UI Component voor de "Lid worden" sectie.
 * Hybride loading-state om CLS te voorkomen tijdens sessie-checks.
 */
export const JoinSectionIsland: React.FC<JoinSectionIslandProps> = ({ 
    isLoading = false,
    serverUser = undefined 
}) => {
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);

    // Try client-side hook if serverUser isn't provided
    const { data: session, isPending: clientPending } = authClient.useSession();
    
    // Resolve identity: Use serverUser if passed, else fallback to client session
    const user = serverUser !== undefined 
        ? serverUser 
        : (session?.user as any ?? null);

    // Identity-aware loading logic
    const isReallyLoading = isLoading || !mounted || (serverUser === undefined && clientPending);

    // Loading state: toon skeleton om CLS te voorkomen
    if (isReallyLoading) {
        return (
            <section className="px-6 py-8 sm:py-10 md:py-12 bg-[var(--bg-main)] skeleton-active" aria-busy="true">
                <div className="mx-auto max-w-4xl text-center">
                    <div className="mx-auto mb-6 h-12 w-80 max-w-full bg-slate-200 dark:bg-slate-800/20 rounded-full" />
                    <div className="space-y-3 mb-10">
                        <div className="mx-auto h-4 w-96 max-w-full bg-slate-200 dark:bg-slate-800/10 rounded-full" />
                        <div className="mx-auto h-4 w-64 max-w-full bg-slate-200 dark:bg-slate-800/10 rounded-full" />
                    </div>
                    <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                        <div className="h-14 w-44 bg-theme-purple/20 rounded-full" />
                        <div className="h-14 w-44 bg-slate-200 dark:bg-slate-800/10 rounded-full" />
                    </div>
                </div>
            </section>
        );
    }

    // Actieve leden zien de sectie niet
    if (user?.membership_status === 'active') return null;

    // Verlopen lidmaatschap: gebruiker is ingelogd maar niet meer actief lid
    const isRenewal = !!user && !!user.membership_expiry && user.membership_status !== 'active';

    const title = isRenewal ? 'Lidmaatschap verlopen?' : 'Klaar om lid te worden?';
    const buttonText = isRenewal ? 'Verlengen' : 'Word nu lid';
    const description = isRenewal
        ? 'Je lidmaatschap is niet meer geldig. Verleng je lidmaatschap voor slechts €20 per jaar en behoud toegang tot alle activiteiten met korting!'
        : 'Sluit je aan bij onze community van studenten en maak het meeste van je studententijd. Voor slechts €20 per jaar krijg je toegang tot alle activiteiten met korting!';

    return (
        <section className="px-6 py-8 sm:py-10 md:py-12 bg-[var(--bg-main)]">
            <div className="mx-auto max-w-4xl text-center animate-fade-in-up">
                <h2 className="text-3xl font-black text-gradient sm:text-4xl md:text-5xl mb-6">
                    {title}
                </h2>

                <p className="text-lg text-[var(--text-muted)] mb-8 max-w-2xl mx-auto leading-relaxed">
                    {description}
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    {/* Primaire CTA-knop — bg-gradient-theme conform legacy JoinSection */}
                    <Link
                        href="/lidmaatschap"
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-theme px-8 py-4 text-base font-semibold text-[var(--color-purple-700)] dark:text-white shadow-xl transition hover:scale-105"
                    >
                        {buttonText}
                    </Link>

                    {/* Secundaire contact-knop */}
                    <Link
                        href="/contact"
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-transparent px-8 py-4 text-base font-semibold text-[var(--color-purple-300)] transition hover:bg-[var(--bg-card)] hover:scale-105"
                    >
                        Neem contact op
                    </Link>
                </div>
            </div>
        </section>
    );
}
