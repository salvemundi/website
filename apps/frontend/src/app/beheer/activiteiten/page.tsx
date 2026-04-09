import { Suspense } from 'react';
import type { Metadata } from 'next';
import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';
import { AdminActivitiesSkeleton } from '@/components/ui/admin/activities/AdminActivitiesSkeleton';
import AdminActivitiesIsland from '@/components/islands/admin/activities/AdminActivitiesIsland';
import { getAdminActivities } from '@/server/actions/activiteiten.actions';
import { getCommittees } from '@/server/actions/committees.actions';

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
    const session = await auth.api.getSession({
        headers: await headers()
    });

    return (
        <main className="min-h-screen bg-[var(--bg-main)]">
            <Suspense fallback={<AdminActivitiesIsland isLoading={true} />}>
                <ActivitiesDataLoader searchParams={sParams} session={session} />
            </Suspense>
        </main>
    );
}

async function ActivitiesDataLoader({ 
    searchParams, 
    session 
}: { 
    searchParams: { q?: string; filter?: string };
    session: any;
}) {
    // Fetch ALL data server-side so the client island handles the rest for maximum speed
    const [initialEvents, committees] = await Promise.all([
        getAdminActivities(undefined, 'all').catch(() => []),
        getCommittees().catch(() => [])
    ]);
    
    return (
        <AdminActivitiesIsland 
            initialEvents={initialEvents as any} 
            committees={committees as any}
            userId={session?.user?.id}
            userCommittees={(session?.user as any)?.committees || []}
        />
    );
}

