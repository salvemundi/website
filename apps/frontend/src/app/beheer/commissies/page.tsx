import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getEnrichedSession } from '@/server/auth/auth-utils';
import AdminPageShell from '@/components/ui/admin/AdminPageShell';

import CommitteeManagementIsland from '@/components/islands/admin/commissies/CommitteeManagementIsland';
import { getCommittees, getCommitteeMembers, countUniqueCommitteeMembers } from '@/server/queries/admin-commissies.queries';

export const metadata: Metadata = {
    title: 'Commissies Beheer | SV Salve Mundi' };

export default async function CommissiesBeheerPage() {
    const session = await getEnrichedSession();
    if (!session?.user) redirect('/?needLogin=true');

    // NUCLEAR SSR: Fetch all data before flushing any part of the page content
    const [committees, totalUniqueMembers] = await Promise.all([
        getCommittees().catch(() => []),
        countUniqueCommitteeMembers().catch(() => 0),
    ]);
    
    const firstCommittee = committees[0];
    const initialMembers = firstCommittee ? await getCommitteeMembers(firstCommittee.id.toString()).catch(() => []) : [];

    return (
        <AdminPageShell
            title="Commissies"
            subtitle="Beheer commissies, leden en Azure-groepen"
            backHref="/beheer"
            hideToolbar={true}
        >
            <CommitteeManagementIsland 
                initialCommittees={committees} 
                totalUniqueMembers={totalUniqueMembers}
                initialMembers={initialMembers}
            />
        </AdminPageShell>
    );
}
