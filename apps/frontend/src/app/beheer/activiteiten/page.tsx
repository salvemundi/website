import { Suspense } from 'react';
import type { Metadata } from 'next';
import AnimatedBeheerHeader from '@/components/ui/admin/AnimatedBeheerHeader';
import { getAdminActivities } from '@/server/actions/activiteiten.actions';
import AdminDashboardSkeleton from '@/components/ui/admin/AdminDashboardSkeleton';
import AdminActivitiesIsland from '@/components/islands/admin/activities/AdminActivitiesIsland';
import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';
import { Calendar } from 'lucide-react';

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
            <AnimatedBeheerHeader 
                title="Beheer Activiteiten"
                subtitle="Bekijk, bewerk en verwijder activiteiten van SV Salve Mundi."
                backLink="/beheer"
                icon={<Calendar className="h-10 w-10" />}
            />
            
            <div className="pb-20">
                <Suspense fallback={<AdminDashboardSkeleton />}>
                    <ActivitiesDataLoader searchParams={sParams} />
                </Suspense>
            </div>
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

