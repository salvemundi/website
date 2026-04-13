import React, { Suspense } from 'react';
import { ProfielIsland } from '@/components/islands/account/ProfielIsland';
import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';
import { getUserEventSignups, getUserPubCrawlSignups } from '@/server/actions/profiel.actions';
import PublicPageShell from '@/components/ui/layout/PublicPageShell';

export const metadata = {
    title: 'Mijn Profiel | SV Salve Mundi',
    description: 'Beheer je lidmaatschap, bekijk je inschrijvingen en pas je gegevens aan.',
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

    return (
        <PublicPageShell title="Mijn Profiel">
            <div className="container mx-auto px-4 py-12 max-w-7xl">
                <Suspense fallback={<ProfielIsland isLoading={true} user={session?.user as any} />}>
                    <ProfielDataLoader session={session} />
                </Suspense>
            </div>
        </PublicPageShell>
    );
}

async function ProfielDataLoader({ session }: { session: any }) {
    // Parallel data fetching for premium performance
    const [eventSignups, pubCrawlSignups] = await Promise.all([
        getUserEventSignups().catch(() => []),
        getUserPubCrawlSignups().catch(() => [])
    ]);

    return (
        <ProfielIsland 
            user={session?.user as any} 
            initialSignups={eventSignups}
            pubCrawlSignups={pubCrawlSignups}
        />
    );
}
