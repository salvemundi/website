'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { authClient } from '@/lib/auth';
import type { EnrichedUser } from '@/types/auth';

interface JoinSectionIslandProps {
    serverUser?: EnrichedUser | null;
}

/**
 * JoinSectionIsland: Identity-aware membership CTA.
 */
export const JoinSectionIsland: React.FC<JoinSectionIslandProps> = ({
    serverUser = undefined
}) => {
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);

    const { data: session, isPending: clientPending } = authClient.useSession();

    const user = serverUser !== undefined
        ? serverUser
        : (session?.user as unknown as EnrichedUser ?? null);

    const isAuthenticating = serverUser === undefined && clientPending;

    if (!mounted || isAuthenticating || user?.membership_status === 'active') return null;

    const isRenewal = !!user && !!user.membership_expiry && user.membership_status !== 'active';

    const title = isRenewal ? 'Lidmaatschap verlopen?' : 'Klaar om lid te worden?';
    const buttonText = isRenewal ? 'Verlengen' : 'Word nu lid';
    const description = isRenewal
        ? 'Je lidmaatschap is niet meer geldig. Verleng je lidmaatschap voor slechts €20 per jaar en behoud toegang tot alle activiteiten met korting!'
        : 'Sluit je aan bij onze community van studenten en maak het meeste van je studententijd. Voor slechts €20 per jaar krijg je toegang tot alle activiteiten met korting!';

    return (
        <section className="px-6 py-8 sm:py-10 md:py-12 bg-[var(--bg-main)]">
            <div className="mx-auto max-w-4xl text-center">
                <h2 className="text-3xl font-black text-gradient sm:text-4xl md:text-5xl mb-6">
                    {title}
                </h2>
                <p className="text-lg text-[var(--text-muted)] mb-8 max-w-2xl mx-auto leading-relaxed">
                    {description}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        href="/lidmaatschap"
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-theme px-8 py-4 text-base font-semibold text-[var(--color-purple-700)] dark:text-white shadow-xl transition hover:scale-105"
                    >
                        {buttonText}
                    </Link>
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