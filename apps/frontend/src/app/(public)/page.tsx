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
import type { Metadata } from 'next';


export const metadata: Metadata = {
    title: 'Home | SV Salve Mundi',
    description: 'Dè studievereniging voor HBO-studenten in Eindhoven. Ontmoet nieuwe mensen, bouw aan je netwerk en maak het meeste van je studententijd.',
};

export default async function HomePage() {
    // All-or-Nothing Data Fetching at the top level
    const [banners, heroActivities, activities, sponsors, session] = await Promise.all([
        getHeroBanners(),
        getUpcomingActiviteiten(1),
        getUpcomingActiviteiten(4),
        getSponsors(),
        auth.api.getSession({ headers: await headers() })
    ]);

    const user = session?.user ?? null;

    return (
        <PublicPageShell>
            <HeroIsland banners={banners} activiteiten={heroActivities} initialSession={session} />

            <EventsSection activities={activities as any} />

            <WhySalveMundiSection />

            <JoinSectionIsland serverUser={user} />

            <SponsorsSection sponsors={sponsors} />

            <PwaInstallToast />
        </PublicPageShell>
    );
}
