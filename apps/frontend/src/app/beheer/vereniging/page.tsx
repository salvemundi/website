import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

import VerenigingManagementIsland from '@/components/islands/admin/vereniging/VerenigingManagementIsland';
import { auth } from '@/server/auth/auth';
import { getCommitteesInternal, getUniqueCommitteeMembersCountInternal, getCommitteeMembersInternal } from '@/server/queries/admin-vereniging.queries';
import { ChevronLeft } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Vereniging Beheer | SV Salve Mundi',
};

export default async function BeheerVerenigingPage() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) redirect('/login');

    const [committees, totalUniqueMembers] = await Promise.all([
        getCommitteesInternal().catch(() => []),
        getUniqueCommitteeMembersCountInternal().catch(() => 0),
    ]);

    // NUCLEAR SSR: Pre-fetch members for the first committee by default
    const firstCommittee = committees?.[0];
    const initialMembers = firstCommittee 
        ? await getCommitteeMembersInternal(firstCommittee.id.toString()).catch(() => []) 
        : [];

    return (
        <div className="min-h-screen bg-[var(--bg-main)]">
            <VerenigingManagementIsland 
                initialCommittees={committees} 
                totalUniqueMembers={totalUniqueMembers}
                initialMembers={initialMembers}
            />
        </div>
    );
}
