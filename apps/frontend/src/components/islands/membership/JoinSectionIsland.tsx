'use client';

import React from 'react';
import Link from 'next/link';
import { authClient } from '@/lib/auth';
import type { EnrichedUser } from '@/types/auth';

interface JoinSectionIslandProps {
    serverUser?: EnrichedUser | null;
}

export const JoinSectionIsland: React.FC<JoinSectionIslandProps> = ({
    serverUser = null
}) => {
    const { data: session } = authClient.useSession();
    const user = (session?.user as unknown as EnrichedUser | null | undefined) ?? serverUser;

    if (user?.membership_status === 'active') return null;

    const isRenewal = !!user && !!user.membership_expiry && user.membership_status !== 'active';

    const title = isRenewal ? 'Lidmaatschap verlopen?' : 'Klaar om lid te worden?';
    const buttonText = isRenewal ? 'Verlengen' : 'Word nu lid';
    const description = isRenewal
        ? 'Je lidmaatschap is niet meer geldig. Verleng je lidmaatschap voor slechts €20 per jaar en behoud toegang tot alle activiteiten met korting!'
        : 'Sluit je aan bij onze community van studenten en maak het meeste van je studententijd. Voor slechts €20 per jaar krijg je toegang tot alle activiteiten met korting!';

    return (
        <section className="py-fluid-lg">
            <div className="mx-auto max-w-4xl text-center px-4 sm:px-6 lg:px-8">
                <h2 className="text-3xl font-black text-gradient sm:text-4xl md:text-5xl mb-6">
                    {title}
                </h2>
                <p className="text-lg text-(--text-muted) mb-8 max-w-2xl mx-auto leading-relaxed">
                    {description}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        href="/lidmaatschap"
                        className="inline-flex items-center justify-center gap-2 squircle bg-brand-primary dark:bg-gradient-theme px-8 py-4 text-base font-semibold text-white shadow-xl transition hover:scale-105"
                    >
                        {buttonText}
                    </Link>
                    <Link
                        href="/contact"
                        className="inline-flex items-center justify-center gap-2 squircle bg-purple-100 dark:bg-transparent px-8 py-4 text-base font-semibold text-brand-primary dark:text-purple-300 transition hover:bg-purple-200 dark:hover:bg-(--bg-card) hover:scale-105"
                    >
                        Neem contact op
                    </Link>
                </div>
            </div>
        </section>
    );
};
