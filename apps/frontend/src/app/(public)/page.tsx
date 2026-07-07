import { getHeroBanners, getUpcomingActiviteiten, getSponsors } from '@/server/actions/public/home.actions';
import { HeroIsland } from '@/components/islands/layout/HeroIsland';
import { ActiviteitenSection } from '@/components/ui/activiteiten/ActiviteitenSection';
import { WhySalveMundiSection } from '@/components/ui/membership/WhySalveMundiSection';
import { JoinSectionIsland } from '@/components/islands/membership/JoinSectionIsland';
import { SponsorsSection } from '@/components/ui/layout/SponsorsSection';

import { PwaInstallIsland } from '@/components/islands/layout/PwaInstallIsland';

import PublicPageShell from '@/components/ui/layout/PublicPageShell';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Home | Salve Mundi',
    description: 'Dè studievereniging voor HBO-studenten in Eindhoven. Ontmoet nieuwe mensen, bouw aan je netwerk en maak het meeste van je studententijd.'
};

import { getEnrichedSession } from '@/server/auth/auth-utils';
import { connection } from 'next/server';
import { safeConsoleError } from '@/server/utils/logger';

export default async function HomePage() {
    return (
        <PublicPageShell>
            <HomeContent />
        </PublicPageShell>
    );
}

async function HomeContent() {
    await connection();

    let session: Awaited<ReturnType<typeof getEnrichedSession>> | null = null;
    let banners: Awaited<ReturnType<typeof getHeroBanners>> = [];
    let heroActivities: Awaited<ReturnType<typeof getUpcomingActiviteiten>> = [];
    let activities: Awaited<ReturnType<typeof getUpcomingActiviteiten>> = [];
    let sponsors: Awaited<ReturnType<typeof getSponsors>> = [];

    try {
        session = await getEnrichedSession().catch((error) => {
            safeConsoleError('[page.tsx][HomeContent] Kon sessie niet ophalen:', error);
            return null;
        });

        [banners, heroActivities, activities, sponsors] = await Promise.all([
            getHeroBanners(),
            getUpcomingActiviteiten(1),
            getUpcomingActiviteiten(4),
            getSponsors(),
        ]);
    } catch (error) {
        safeConsoleError('[page.tsx][HomeContent] Critical data fetch error:', error);
        
        let errorMessage = 'Er is een onverwachte fout opgetreden bij het laden van de homepagina. Probeer het later opnieuw.';
        if (error instanceof Error) {
            errorMessage = error.message;
        } else if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
            errorMessage = error.message;
        }
        
        throw new Error(errorMessage);
    }

    const user = session?.user ?? null;

    return (
        <>
            <HeroIsland banners={banners} activiteiten={heroActivities} initialSession={session} />
            <ActiviteitenSection activities={activities} />
            <WhySalveMundiSection />
            <JoinSectionIsland serverUser={user} />
            <SponsorsSection sponsors={sponsors} />
            <PwaInstallIsland />
        </>
    );
}
