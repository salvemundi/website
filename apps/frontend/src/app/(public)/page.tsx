import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getHeroBanners, getUpcomingActiviteiten, getSponsors } from '@/server/actions/home.actions';
import { HeroIsland } from '@/components/islands/layout/HeroIsland';
import { EventsSection } from '@/components/ui/activities/EventsSection';
import { WhySalveMundiSection } from '@/components/ui/membership/WhySalveMundiSection';
import { JoinSectionIsland } from '@/components/islands/membership/JoinSectionIsland';
import { SponsorsSection } from '@/components/ui/layout/SponsorsSection';
import { PwaInstallToast } from '@/components/ui/layout/PwaInstallToast';
import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';
import PublicPageShell from '@/components/ui/layout/PublicPageShell';

export const metadata: Metadata = {
    title: 'Home | SV Salve Mundi',
    description: 'Dè studievereniging voor HBO-studenten in Eindhoven. Ontmoet nieuwe mensen, bouw aan je netwerk en maak het meeste van je studententijd.',
};

/**
 * Async wrapper voor de Hero sectie.
 */
async function AsyncHero() {
    const [banners, activiteiten] = await Promise.all([
        getHeroBanners(),
        getUpcomingActiviteiten(1),
    ]);
    return <HeroIsland banners={banners} activiteiten={activiteiten} />;
}

/**
 * Async wrapper voor de Events sectie.
 */
async function AsyncEvents() {
    const activiteiten = await getUpcomingActiviteiten(4);
    return <EventsSection activities={activiteiten as any} />;
}

/**
 * Async wrapper voor de Sponsors sectie.
 */
async function AsyncSponsors() {
    const sponsors = await getSponsors();
    return <SponsorsSection sponsors={sponsors} />;
}

/**
 * HomePage — Pure Server Component.
 * Modernized: Wrapped in PublicPageShell. Uses Masked Fallbacks (Zero-Drift).
 */
export default async function HomePage() {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    
    const user = session?.user ?? null;

    return (
        <PublicPageShell>
            <main>
                {/* Hero Section - Zero-Drift loading via mask */}
                <Suspense fallback={<HeroIsland isLoading />}>
                    <AsyncHero />
                </Suspense>

                {/* Aankomende activiteiten - Zero-Drift loading via mask */}
                <Suspense fallback={<EventsSection isLoading />}>
                    <AsyncEvents />
                </Suspense>

                {/* Statische sectie - Wordt direct getoond */}
                <WhySalveMundiSection />

                {/* Identity Aware CTA */}
                <JoinSectionIsland serverUser={user} />

                {/* Sponsoren - Zero-Drift loading via mask */}
                <Suspense fallback={<SponsorsSection isLoading />}>
                    <AsyncSponsors />
                </Suspense>

                <PwaInstallToast />
            </main>
        </PublicPageShell>
    );
}
