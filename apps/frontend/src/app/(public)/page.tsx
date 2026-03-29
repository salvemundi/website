export const dynamic = 'force-dynamic';
import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getHeroBanners, getUpcomingActiviteiten, getSponsors } from '@/server/actions/home.actions';
import { HeroIsland } from '@/components/islands/layout/HeroIsland';
import { EventsSection } from '@/components/ui/activities/EventsSection';
import { WhySalveMundiSection } from '@/components/ui/membership/WhySalveMundiSection';
import { JoinSectionIsland } from '@/components/islands/membership/JoinSectionIsland';
import { SponsorsSection } from '@/components/ui/layout/SponsorsSection';
import { HeroSkeleton, EventsSkeleton, SponsorsSkeleton } from '@/components/ui/layout/HomePageSkeleton';

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
        getUpcomingActiviteiten(1), // Alleen nodig voor 'next event' kaart
    ]);
    return <HeroIsland banners={banners} activiteiten={activiteiten} />;
}

/**
 * Async wrapper voor de Events sectie.
 */
async function AsyncEvents() {
    const activiteiten = await getUpcomingActiviteiten(4);
    return <EventsSection activiteiten={activiteiten} />;
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
 * Onderdelen worden onafhankelijk gestreamed via granulaire Suspense (PPR).
 */
export default function HomePage() {
    return (
        <main>
            {/* Hero Section - Onafhankelijk laden */}
            <Suspense fallback={<HeroSkeleton />}>
                <AsyncHero />
            </Suspense>

            {/* Aankomende activiteiten - Onafhankelijk laden */}
            <Suspense fallback={<EventsSkeleton />}>
                <AsyncEvents />
            </Suspense>

            {/* Statische "Waarom Salve Mundi?" sectie - Wordt direct getoond */}
            <WhySalveMundiSection />

            {/* Conditioneel lid-worden CTA - Client Island (interne auth check) */}
            <JoinSectionIsland />

            {/* Scrollende sponsorbalk - Onafhankelijk laden */}
            <Suspense fallback={<SponsorsSkeleton />}>
                <AsyncSponsors />
            </Suspense>
        </main>
    );
}

