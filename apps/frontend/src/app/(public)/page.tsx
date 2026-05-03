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

import { Suspense } from 'react';
import { connection } from 'next/server';

export default async function HomePage() {
    return (
        <PublicPageShell>
            <Suspense fallback={<HomeSkeleton />}>
                <HomeContent />
            </Suspense>
        </PublicPageShell>
    );
}

function HomeSkeleton() {
    return (
        <div className="animate-pulse">
            {/* Hero Skeleton */}
            <div className="h-[500px] w-full bg-[var(--bg-card)] mb-12" />
            
            <div className="max-w-app mx-auto px-4">
                {/* Events Section Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-64 bg-[var(--bg-card)] rounded-3xl" />
                    ))}
                </div>
                
                {/* Why Salve Mundi Skeleton */}
                <div className="h-96 w-full bg-[var(--bg-card)] rounded-3xl mb-16" />
            </div>
        </div>
    );
}

async function HomeContent() {
    await connection();
    
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
        <>
            <HeroIsland banners={banners} activiteiten={heroActivities} initialSession={session} />

            <EventsSection activities={activities} />

            <WhySalveMundiSection />

            <JoinSectionIsland serverUser={user} />

            <SponsorsSection sponsors={sponsors} />

            <PwaInstallToast />
        </>
    );
}
