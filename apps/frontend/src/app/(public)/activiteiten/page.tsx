import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import ActivitiesBannerIsland from '@/components/islands/activiteiten/ActivitiesBannerIsland';
import ActivitiesProviderIsland from '@/components/islands/activiteiten/ActivitiesProviderIsland';
import { getActivities } from '@/server/actions/events/activiteiten/activiteiten-public.actions';
import { getEnrichedSession } from '@/server/auth/auth-utils';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
    title: 'Activiteiten | Salve Mundi',
    description: 'Bekijk alle komende en afgelopen activiteiten van studievereniging Salve Mundi.'
};

export default async function ActivitiesPage() {
    const session = await getEnrichedSession();
    const email = session?.user.email;
    const cookieStore = await cookies();
    const viewModeCookie = cookieStore.get('activities_view_mode')?.value;
    const initialViewMode = (viewModeCookie === 'list' || viewModeCookie === 'grid' || viewModeCookie === 'calendar')
        ? viewModeCookie
        : 'list';

    const events = await getActivities(email);
    const serverTime = new Date().toISOString();

    return (
        <div className="min-h-screen">
            <h1 className="sr-only">Activiteiten Salve Mundi</h1>

            <div className="w-full px-4 py-4 md:py-8 flex justify-center">
                <ActivitiesBannerIsland events={events} serverTime={serverTime} />
            </div>

            <main className="w-full px-4 py-4 sm:py-6 md:py-8 max-w-7xl mx-auto">
                <ActivitiesProviderIsland events={events} serverTime={serverTime} initialViewMode={initialViewMode} />
            </main>
        </div>
    );
}
