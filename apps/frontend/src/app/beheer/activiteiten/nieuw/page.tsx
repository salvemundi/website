import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';
import AdminUnauthorized from '@/components/ui/admin/AdminUnauthorized';
import { getSystemDirectus } from '@/lib/directus';
import { readItems } from '@directus/sdk';
import ActiviteitNieuwIsland from '@/components/islands/admin/activities/ActiviteitNieuwIsland';
import AdminPageShell from '@/components/ui/admin/AdminPageShell';

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
        return [];
    }
}

export default async function ActivityCreatePage() {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session || !session.user) {
        return (
            <AdminUnauthorized 
                title="Activiteit Aanmaken"
                description="Je moet ingelogd zijn met een Salve Mundi account om activiteiten te kunnen aanmaken."
            />
        );
    }

    // NUCLEAR SSR: Fetch all data before flushing any part of the page content
    const committees = await getCommittees(session.user);

    return (
        <AdminPageShell
            title="Activiteit Aanmaken"
            subtitle="Publiceer een nieuwe activiteit op de website."
            backHref="/beheer/activiteiten"
        >
            <main className="min-h-screen bg-[var(--bg-main)] pb-20">
                <ActiviteitNieuwIsland committees={committees as any} />
            </main>
        </AdminPageShell>
    );
}
