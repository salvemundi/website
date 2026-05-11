import React from 'react';
import { ProfielIsland } from '@/components/islands/account/ProfielIsland';
import { getUserEventSignups, getUserPubCrawlSignups } from '@/server/actions/profiel.actions';
import PublicPageShell from '@/components/ui/layout/PublicPageShell';

export const metadata = {
    title: 'Mijn Profiel | SV Salve Mundi',
    description: 'Beheer je lidmaatschap, bekijk je aanmeldingen en pas je gegevens aan.' };

import { checkAdminAccess } from '@/server/actions/admin-utils.actions';

/**
 * ProfielPage: Ultra-PPR Modernization.
 * Wrapped in PublicPageShell for consistent header/footer and zero-drift loading.
 * Uses ProfielIsland with masked fallback.
 */
export default async function ProfielPage() {
    // NUCLEAR SSR: Fetch all data before flushing any part of the page content
    const [eventSignups, pubCrawlSignups, { user: enrichedUser }] = await Promise.all([
        getUserEventSignups(),
        getUserPubCrawlSignups(),
        checkAdminAccess()
    ]);

    return (
        <PublicPageShell title="Mijn Profiel">
            <div className="container mx-auto px-4 py-12 max-w-7xl">
                {enrichedUser && (
                    <ProfielIsland 
                        user={enrichedUser} 
                        initialSignups={eventSignups}
                        pubCrawlSignups={pubCrawlSignups}
                    />
                )}
            </div>
        </PublicPageShell>
    );
}

