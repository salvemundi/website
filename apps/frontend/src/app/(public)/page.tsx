import { getHeroBanners, getUpcomingActiviteiten, getSponsors } from '@/server/actions/public/home.actions';
import { HeroIsland } from '@/components/islands/layout/HeroIsland';
import { EventsSection } from '@/components/ui/activities/EventsSection';
import { WhySalveMundiSection } from '@/components/ui/membership/WhySalveMundiSection';
import dynamic from 'next/dynamic';
import { JoinSectionIsland } from '@/components/islands/membership/JoinSectionIsland';
const SponsorsSection = dynamic(() => import('@/components/ui/layout/SponsorsSection').then(mod => mod.SponsorsSection));

import { PwaInstallIsland } from '@/components/islands/layout/PwaInstallIsland';

import PublicPageShell from '@/components/ui/layout/PublicPageShell';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Home | SV Salve Mundi',
    description: 'Dè studievereniging voor HBO-studenten in Eindhoven. Ontmoet nieuwe mensen, bouw aan je netwerk en maak het meeste van je studententijd.'
};

import { getEnrichedSession } from '@/server/auth/auth-utils';
import { connection } from 'next/server';

export default async function HomePage() {
    return (
        <PublicPageShell>
            <HomeContent />
        </PublicPageShell>
    );
}

async function HomeContent() {
    await connection();

    const session = await getEnrichedSession().catch((error) => {
        console.error('[HomeContent] Kon sessie niet ophalen:', error);
        return null;
    });

    const [banners, heroActivities, activities, sponsors] = await Promise.all([
        getHeroBanners(),
        getUpcomingActiviteiten(1),
        getUpcomingActiviteiten(4),
        getSponsors(),
    ]);

    const user = session?.user ?? null;

    return (
        <>
            <HeroIsland banners={banners} activiteiten={heroActivities} initialSession={session} />
            <EventsSection activities={activities} />
            <WhySalveMundiSection />
            <JoinSectionIsland serverUser={user} />
            <SponsorsSection sponsors={sponsors} />
            <PwaInstallIsland />
        </>
    );
}
