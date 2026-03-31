import { Suspense } from 'react';
import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';
import { ShieldAlert } from 'lucide-react';
import { getSystemDirectus } from '@/lib/directus';
import { readItems } from '@directus/sdk';
import ActiviteitNieuwIsland from '@/components/islands/admin/activities/ActiviteitNieuwIsland';
import ActiviteitNieuwSkeleton from '@/components/ui/admin/activities/ActiviteitNieuwSkeleton';

export const experimental_ppr = true;

async function getCommittees(user: any) {
    const memberships = user.committees || [];
    const isPowerful = memberships.some((c: any) => {
        const name = (c?.name || '').toString().toLowerCase();
        return name.includes('bestuur') || name.includes('ict') || name.includes('kandi');
    });

    try {
        if (isPowerful) {
            // Power users see all committees
            return await getSystemDirectus().request(
                readItems<any, any, any>('committees', {
                    fields: ['id', 'name'],
                    sort: ['name'],
                    limit: -1
                })
            );
        } else {
            // Regular members see only their own committees
            if (memberships.length === 0) return [];
            
            // Map the IDs from session memberships
            const committeeIds = memberships.map((m: any) => m.id).filter(Boolean);
            
            if (committeeIds.length === 0) return [];

            return await getSystemDirectus().request(
                readItems<any, any, any>('committees', {
                    fields: ['id', 'name'],
                    filter: {
                        id: { _in: committeeIds }
                    },
                    sort: ['name'],
                    limit: -1
                })
            );
        }
    } catch (error) {
        console.error("Failed to fetch committees for activity creation:", error);
        return [];
    }
}

export default async function ActivityCreatePage() {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session || !session.user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
                <ShieldAlert className="h-16 w-16 text-red-500 mb-4" />
                <h1 className="text-2xl font-bold mb-2">Toegang Geweigerd</h1>
                <p className="text-slate-500">Je moet ingelogd zijn om deze pagina te bekijken.</p>
            </div>
        );
    }

    const committees = await getCommittees(session.user);

    return (
        <main className="min-h-screen bg-[var(--bg-main)] pb-20">
            <Suspense fallback={<ActiviteitNieuwSkeleton />}>
                <ActiviteitNieuwIsland committees={committees as any} />
            </Suspense>
        </main>
    );
}
