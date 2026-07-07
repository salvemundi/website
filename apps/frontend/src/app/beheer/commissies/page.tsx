import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getEnrichedSession } from '@/server/auth/auth-utils';
import AdminPageShell from '@/components/ui/admin/AdminPageShell';
import AdminUnauthorized from '@/components/ui/admin/AdminUnauthorized';
import { getPermissions } from '@/shared/lib/permissions';

import CommitteeManagementIsland from '@/components/islands/admin/commissies/CommitteeManagementIsland';
import { getCommittees, getCommitteeMembers, countUniqueCommitteeMembers } from '@/server/queries/commissies/admin-commissies.queries';

export const metadata: Metadata = {
    title: 'Commissies Beheer | SV Salve Mundi' };

export default async function CommissiesBeheerPage() {
    const session = await getEnrichedSession();
    if (!session?.user) redirect('/?needLogin=true');

    const permissions = getPermissions(session.user.committees);
    if (!permissions.includes('commissies')) {
        return <AdminUnauthorized title="Commissies Beheer" backHref="/beheer" />;
    }

    const [committees, totalUniqueMembers] = await Promise.all([
        getCommittees().catch(() => []),
        countUniqueCommitteeMembers().catch(() => 0),
    ]);
    
    const firstCommittee = committees[0] as typeof committees[0] | undefined;
    const initialMembers = firstCommittee ? await getCommitteeMembers(firstCommittee.id.toString()).catch(() => []) : [];

    return (
        <AdminPageShell
            title="Commissies"
            subtitle="Beheer commissies, leden en Azure-groepen"
            backHref="/beheer"
            actions={
                <div className="flex items-center gap-4">
                    <div className="hidden md:flex items-center gap-4 bg-bg-soft px-4 py-2 rounded-2xl border border-border-color/50 shadow-sm">
                        <div className="flex flex-col items-center px-2">
                            <span className="text-[10px] font-semibold text-text-muted leading-none mb-1">Groepen</span>
                            <span className="text-sm font-bold text-text-main leading-none">{committees.length}</span>
                        </div>
                        <div className="w-px h-6 bg-border-color/20" />
                        <div className="flex flex-col items-center px-2">
                            <span className="text-[10px] font-semibold text-text-muted leading-none mb-1">Totaal Leden</span>
                            <span className="text-sm font-bold text-text-main leading-none">{totalUniqueMembers}</span>
                        </div>
                    </div>
                </div>
            }
        >
            <CommitteeManagementIsland 
                initialCommittees={committees} 
                initialMembers={initialMembers}
            />
        </AdminPageShell>
    );
}
