import type { Metadata } from 'next';
import AdminPageShell from '@/components/ui/admin/AdminPageShell';
import CommitteeManagementIsland from '@/components/islands/admin/commissies/CommitteeManagementIsland';
import { getCommittees, getCommitteeMembers, countUniqueCommitteeMembers } from '@/server/queries/commissies/admin-commissies.queries';

export const metadata: Metadata = {
    title: 'Commissies Beheer | SV Salve Mundi'
};

export default async function CommissiesBeheerPage() {
    const [committees, totalUniqueMembers] = await Promise.all([
        getCommittees().catch(() => []),
        countUniqueCommitteeMembers().catch(() => 0),
    ]);
    
    const firstCommittee = committees[0] as typeof committees[0] | undefined;
    const initialMembers = firstCommittee ? await getCommitteeMembers(firstCommittee.id.toString()).catch(() => []) : [];

    return (
        <AdminPageShell
            title="Commissies"
            backHref="/beheer"
            actions={
                <div className="flex items-center gap-4">
                    <div className="hidden items-center gap-4 rounded-2xl border border-border-color/50 bg-bg-soft px-4 py-2 shadow-sm md:flex">
                        <div className="flex flex-col items-center px-2">
                            <span className="mb-1 text-[10px] leading-none font-semibold text-text-muted">Groepen</span>
                            <span className="text-sm leading-none font-bold text-text-main">{committees.length}</span>
                        </div>
                        <div className="h-6 w-px bg-border-color/20" />
                        <div className="flex flex-col items-center px-2">
                            <span className="mb-1 text-[10px] leading-none font-semibold text-text-muted">Totaal Leden</span>
                            <span className="text-sm leading-none font-bold text-text-main">{totalUniqueMembers}</span>
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
