import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

import CommitteeManagementIsland from '@/components/islands/admin/commissies/CommitteeManagementIsland';
import { auth } from '@/server/auth/auth';
import { getCommittees, getCommitteeMembers, countUniqueCommitteeMembers } from '@/server/queries/admin-commissies.queries';

export const metadata: Metadata = {
    title: 'Commissies Beheer | SV Salve Mundi',
};

export default async function CommissiesBeheerPage() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) redirect('/login');

    // NUCLEAR SSR: Fetch all data before flushing any part of the page content
    const [committees, totalUniqueMembers] = await Promise.all([
        getCommittees().catch(() => []),
        countUniqueCommitteeMembers().catch(() => 0),
    ]);
    
    // Predeterministic first committee fetching to avoid skeleton jitter
    const firstCommittee = committees[0];
    const initialMembers = firstCommittee ? await getCommitteeMembers(firstCommittee.id.toString()).catch(() => []) : [];

    return (
        <main className="min-h-screen bg-[var(--bg-main)]">
            <CommitteeManagementIsland 
                initialCommittees={committees} 
                totalUniqueMembers={totalUniqueMembers}
                initialMembers={initialMembers}
            />
        </main>
    );
}
