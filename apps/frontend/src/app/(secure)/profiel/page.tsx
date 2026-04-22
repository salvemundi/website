import React from 'react';
import { ProfielIsland } from '@/components/islands/account/ProfielIsland';
import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';
import { getUserEventSignups, getUserPubCrawlSignups } from '@/server/actions/profiel.actions';
import { fetchUserMetadataDb } from '@/server/actions/user-db.utils';
import PublicPageShell from '@/components/ui/layout/PublicPageShell';

export const metadata = {
    title: 'Mijn Profiel | SV Salve Mundi',
    description: 'Beheer je lidmaatschap, bekijk je aanmeldingen en pas je gegevens aan.',
};

/**
 * ProfielPage: Ultra-PPR Modernization.
 * Wrapped in PublicPageShell for consistent header/footer and zero-drift loading.
 * Uses ProfielIsland with masked fallback.
 */
export default async function ProfielPage() {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    // NUCLEAR SSR: Fetch all data before flushing any part of the page content
    const [eventSignups, pubCrawlSignups, freshMetadata] = await Promise.all([
        getUserEventSignups().catch(() => []),
        getUserPubCrawlSignups().catch(() => []),
        session?.user?.id ? fetchUserMetadataDb(session.user.id).catch(() => null) : null
    ]);

    // Merge fresh metadata into session user to bypass Better Auth stale cache
    const enrichedUser = session?.user ? {
        ...session.user,
        ...(freshMetadata || {})
    } : null;

    return (
        <PublicPageShell title="Mijn Profiel">
            <div className="container mx-auto px-4 py-12 max-w-7xl">
                <ProfielIsland 
                    user={enrichedUser as any} 
                    initialSignups={eventSignups}
                    pubCrawlSignups={pubCrawlSignups}
                />
            </div>
        </PublicPageShell>
    );
}

