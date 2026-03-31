import { Suspense } from 'react';
import type { Metadata } from 'next';
import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';
import AdminDashboardSkeleton from '@/components/ui/admin/AdminDashboardSkeleton';
import AdminActivitiesIsland from '@/components/islands/admin/activities/AdminActivitiesIsland';
import { getAdminActivities } from '@/server/actions/activiteiten.actions';

export const metadata: Metadata = {
    title: 'Beheer Activiteiten | SV Salve Mundi',
    description: 'Beheer alle activiteiten van SV Salve Mundi.',
};

export default async function AdminActiviteitenPage({ 
    searchParams 
}: { 
    searchParams: Promise<{ q?: string; filter?: string }> 
}) {
    const sParams = await searchParams;

    return (
        <main className="min-h-screen bg-[var(--bg-main)]">
            <Suspense fallback={<AdminDashboardSkeleton />}>
                <ActivitiesDataLoader searchParams={sParams} />
            </Suspense>
        </main>
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

