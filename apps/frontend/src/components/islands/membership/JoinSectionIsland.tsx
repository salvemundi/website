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
            <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
                <h2 className="text-gradient mb-6 text-3xl font-black sm:text-4xl md:text-5xl">
                    {title}
                </h2>
                <p className="mx-auto mb-8 max-w-2xl text-lg leading-relaxed text-(--text-muted)">
                    {description}
                </p>
                <div className="flex flex-col justify-center gap-4 sm:flex-row">
                    <Link
                        href="/lidmaatschap"
                        className="squircle dark:bg-gradient-theme inline-flex items-center justify-center gap-2 bg-brand-primary px-8 py-4 text-base font-semibold text-white shadow-xl transition hover:scale-105"
                    >
                        {buttonText}
                    </Link>
                    <Link
                        href="/contact"
                        className="squircle inline-flex items-center justify-center gap-2 bg-purple-100 px-8 py-4 text-base font-semibold text-brand-primary transition hover:scale-105 hover:bg-purple-200 dark:bg-transparent dark:text-purple-300 dark:hover:bg-(--bg-card)"
                    >
                        Neem contact op
                    </Link>
                </div>
            </div>
        </section>
    );
};
