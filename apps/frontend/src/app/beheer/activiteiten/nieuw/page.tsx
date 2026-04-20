import type { Metadata } from 'next';
import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';
import AdminUnauthorized from '@/components/ui/admin/AdminUnauthorized';
import { getSystemDirectus } from '@/lib/directus';
import { readItems } from '@directus/sdk';
import ActiviteitNieuwIsland from '@/components/islands/admin/activities/ActiviteitNieuwIsland';

export const metadata: Metadata = {
    title: 'Activiteit Aanmaken | SV Salve Mundi',
};

async function getCommittees(user: any) {
    const memberships = user.committees || [];
    const isPowerful = memberships.some((c: any) => {
        const name = (c?.name || '').toString().toLowerCase();
        return name.includes('bestuur') || name.includes('ict') || name.includes('kandi');
    });

    try {
        if (isPowerful) {
            return await getSystemDirectus().request(
                readItems<any, any, any>('committees', {
                    fields: ['id', 'name'],
                    sort: ['name'],
                    limit: -1
                })
            );
        } else {
            if (memberships.length === 0) return [];
            
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

    const committees = await getCommittees(session.user);

    return (
        <div className="pb-20">
            <ActiviteitNieuwIsland committees={committees as any} />
        </div>
    );
}
