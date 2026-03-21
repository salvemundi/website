import { Suspense } from 'react';
import PageHeader from '@/components/ui/layout/PageHeader';
import { getAdminActivities } from '@/server/actions/activiteiten.actions';
import { AdminActivitiesSkeleton } from '@/components/ui/admin/activities/AdminActivitiesSkeleton';
import AdminActivitiesIsland from '@/components/islands/admin/activities/AdminActivitiesIsland';
import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';

export default async function AdminActiviteitenPage({ 
    searchParams 
}: { 
    searchParams: Promise<{ q?: string; filter?: string }> 
}) {
    const sParams = await searchParams;

    // Hoisted static header for LCP
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
            <PageHeader
                title="Beheer Activiteiten"
                description="Bekijk, bewerk en verwijder activiteiten"
                backLink="/beheer"
                className="mb-0"
                contentPadding="pt-0 pb-2 sm:pt-0 sm:pb-2"
                titleClassName="text-sm sm:text-base md:text-xl"
            />
            
            <Suspense fallback={<AdminActivitiesSkeleton />}>
                <ActivitiesDataLoader searchParams={sParams} />
            </Suspense>
        </div>
    );
}

async function ActivitiesDataLoader({ searchParams }: { searchParams: { q?: string; filter?: string } }) {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    
    // Fetch data server-side so the client island hydrates immediately with data
    const initialEvents = await getAdminActivities(
        searchParams.q, 
        (searchParams.filter as any) || 'all'
    ).catch(() => []);
    
    return (
        <AdminActivitiesIsland 
            initialEvents={initialEvents as any} 
            userId={session?.user?.id}
            userCommittees={(session?.user as any)?.committees || []}
            initialSearch={searchParams.q}
            initialFilter={(searchParams.filter as any) || 'all'}
        />
    );
}
