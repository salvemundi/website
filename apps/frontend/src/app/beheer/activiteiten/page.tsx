import { Suspense } from 'react';
import type { Metadata } from 'next';
import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';
import AdminDashboardSkeleton from '@/components/ui/admin/AdminDashboardSkeleton';
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

