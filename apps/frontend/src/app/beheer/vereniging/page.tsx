import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

import VerenigingManagementIsland from '@/components/islands/admin/vereniging/VerenigingManagementIsland';
import { auth } from '@/server/auth/auth';
import { getCommitteesInternal, getUniqueCommitteeMembersCountInternal } from '@/server/queries/admin-vereniging.queries';
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

    return (
        <div className="min-h-screen bg-[var(--bg-main)]">
            <VerenigingManagementIsland 
                initialCommittees={committees} 
                totalUniqueMembers={totalUniqueMembers}
            />
        </div>
    );
}
