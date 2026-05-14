import { getHeroBanners, getUpcomingActiviteiten, getSponsors } from '@/server/actions/public/home.actions';
import { HeroIsland } from '@/components/islands/layout/HeroIsland';
import { EventsSection } from '@/components/ui/activities/EventsSection';
import { WhySalveMundiSection } from '@/components/ui/membership/WhySalveMundiSection';
import { JoinSectionIsland } from '@/components/islands/membership/JoinSectionIsland';
import { SponsorsSection } from '@/components/ui/layout/SponsorsSection';

import { PwaInstallIsland } from '@/components/islands/layout/PwaInstallIsland';

import PublicPageShell from '@/components/ui/layout/PublicPageShell';
import { HomePreloads } from '@/components/ui/layout/HomePreloads';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Home | SV Salve Mundi',
    description: 'Dè studievereniging voor HBO-studenten in Eindhoven. Ontmoet nieuwe mensen, bouw aan je netwerk en maak het meeste van je studententijd.'
};

import { getEnrichedSession } from '@/server/auth/auth-utils';
import { connection } from 'next/server';
import { safeConsoleError } from '@/server/utils/logger';

export default async function HomePage() {
    return (
        <PublicPageShell>
            <HomePreloads />
            <HomeContent />
        </PublicPageShell>
    );
}

async function HomeContent() {
    await connection();

    const session = await getEnrichedSession().catch((error) => {
        safeConsoleError('[HomePage][HomeContent] Kon sessie niet ophalen:', error);
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
