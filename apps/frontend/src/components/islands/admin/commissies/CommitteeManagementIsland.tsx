'use client';

import { useState, useCallback, useMemo, useTransition } from 'react';
import {
    Users, 
    RefreshCw, 
} from 'lucide-react';
import type { Committee, CommitteeMember } from '@/server/queries/admin-commissies.queries';
import {
    getCommittees,
    getCommitteeMembers,
    addCommitteeMember,
    removeCommitteeMember,
    toggleCommitteeLeader,
    updateCommitteeDetails,
} from '@/server/actions/admin-committees.actions';
import AdminToolbar from '@/components/ui/admin/AdminToolbar';
import AdminStatsBar from '@/components/ui/admin/AdminStatsBar';

import CommitteeSidebar from './CommitteeSidebar';
import CommitteeDetail from './CommitteeDetail';
import AdminToast from '@/components/ui/admin/AdminToast';
import { useAdminToast } from '@/hooks/use-admin-toast';

const STANDARD_COMMITTEES = [
    'feestcommissie', 'mediacommissie', 'introcommissie', 'kascommissie',
    'ict-commissie', 'ictcommissie', 'kampcommissie', 'activiteitencommissie',
    'studiecommissie', 'reiscommissie', 'marketingcommissie',
];

const normalizeName = (name: string) =>
    name.toLowerCase().replace(/\s*(\|\||\|)\s*salve mundi/gi, '').trim();

interface Props {
    initialCommittees: Committee[];
    totalUniqueMembers: number;
    initialMembers?: CommitteeMember[];
}

export default function CommitteeManagementIsland({ initialCommittees, totalUniqueMembers, initialMembers = [] }: Props) {
    const { toast, showToast, hideToast } = useAdminToast();
    const [committees, setCommittees] = useState<Committee[]>(initialCommittees);
    
    // NUCLEAR SSR: Default to the first committee to avoid empty mount states
    const [selected, setSelected] = useState<Committee | null>(initialCommittees[0] || null);
    const [members, setMembers] = useState<CommitteeMember[]>(initialMembers);

    const [searchQuery, setSearchQuery] = useState('');
    const [showAll, setShowAll] = useState(false);

    const [isPending, startTransition] = useTransition();
    const [refreshing, setRefreshing] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const [newMemberEmail, setNewMemberEmail] = useState('');
    const [addingMember, setAddingMember] = useState(false);
    const [addError, setAddError] = useState<string | null>(null);

    const [editingDetail, setEditingDetail] = useState(false);
    const [editShortDesc, setEditShortDesc] = useState('');
    const [editDesc, setEditDesc] = useState('');
    const [savingDetail, setSavingDetail] = useState(false);

    // Filtering logic
    const filteredCommittees = useMemo(() => {
        const sorted = [...committees]
            .map(c => ({ ...c, isStandard: STANDARD_COMMITTEES.includes(normalizeName(c.name)) }))
            .sort((a, b) => {
                if (a.isStandard && !b.isStandard) return -1;
                if (!a.isStandard && b.isStandard) return 1;
                return a.name.localeCompare(b.name);
            });

        return sorted.filter(c => {
            if (!c.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
            return showAll ? true : c.isStandard;
        });
    }, [committees, searchQuery, showAll]);

    const handleRefresh = async () => {
        setRefreshing(true);
        const fresh = await getCommittees().catch(() => committees);
        setCommittees(fresh);
        setRefreshing(false);
    };

    const handleSelectCommittee = useCallback(async (c: Committee) => {
        startTransition(async () => {
            setSelected(c);
            setEditingDetail(false);
            setEditShortDesc(c.short_description || '');
            setEditDesc(c.description || '');
            setAddError(null);
            setNewMemberEmail('');
            
            try {
                const m = await getCommitteeMembers(c.id.toString()).catch(() => []);
                setMembers(m);
            } catch (err) {
                showToast('Fout bij ophalen leden', 'error');
            }
        });
    }, []);

    const handleAddMember = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selected?.azure_group_id || !newMemberEmail) return;
        setAddingMember(true);
        setAddError(null);
        const res = await addCommitteeMember(selected.azure_group_id, selected.id.toString(), newMemberEmail);
        if (!res.success) {
            setAddError(res.error ?? 'Toevoegen mislukt');
            showToast(res.error ?? 'Toevoegen mislukt', 'error');
        } else {
            setNewMemberEmail('');
            showToast('Lid succesvol toegevoegd aan de commissie', 'success');
            // Sync is done on server, so we can reload immediately
            handleSelectCommittee(selected);
        }
        setAddingMember(false);
    };

    const handleRemoveMember = async (member: CommitteeMember) => {
        if (!selected?.azure_group_id) return;
        if (!confirm(`Weet je zeker dat je ${member.displayName} wilt verwijderen?`)) return;
        setActionLoading(`remove-${member.entraId}`);
        const res = await removeCommitteeMember(selected.azure_group_id, member.entraId, member.isLeader);
        if (res.success) {
            setMembers(prev => prev.filter(m => m.entraId !== member.entraId));
            showToast('Lid succesvol verwijderd uit de commissie', 'success');
        } else {
            showToast(res.error ?? 'Verwijderen mislukt', 'error');
        }
        setActionLoading(null);
    };

    const handleToggleLeader = async (member: CommitteeMember) => {
        if (!member.directusMembershipId) {
            showToast('Lidmaatschapsrecord niet gevonden.', 'error');
            return;
        }
        setActionLoading(`leader-${member.entraId}`);
        const res = await toggleCommitteeLeader(
            member.directusMembershipId,
            member.isLeader,
            selected?.azure_group_id,
            member.entraId
        );
        if (res.success) {
            setMembers(prev => prev.map(m => m.entraId === member.entraId ? { ...m, isLeader: !m.isLeader } : m));
            showToast(`Status '${member.isLeader ? 'Lid' : 'Leider'}' succesvol bijgewerkt`, 'success');
        } else {
            showToast(res.error ?? 'Bijwerken mislukt', 'error');
        }
        setActionLoading(null);
    };

    const handleSaveDetail = async () => {
        if (!selected) return;
        setSavingDetail(true);
        const res = await updateCommitteeDetails(selected.id.toString(), {
            short_description: editShortDesc,
            description: editDesc,
        });
        if (res.success) {
            setSelected(prev => prev ? { ...prev, short_description: editShortDesc, description: editDesc } : prev);
            setEditingDetail(false);
            showToast('Commissie details succesvol bijgewerkt', 'success');
        } else {
            showToast(res.error ?? 'Opslaan mislukt', 'error');
        }
        setSavingDetail(false);
    };

    const adminStats = useMemo(() => [
        { 
            label: selected ? 'Commissie Leden' : 'Actieve Leden', 
            value: selected ? members.length : totalUniqueMembers, 
            icon: Users, 
            theme: 'indigo' 
        },
    ], [selected, members.length, totalUniqueMembers]);

    return (
        <div className="min-h-screen bg-[var(--bg-main)]">
            <AdminToolbar 
                title="Commissies"
                subtitle="Beheer commissies, leden en Azure-groepen"
                backHref="/beheer"
                actions={
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="flex items-center gap-2 px-[var(--beheer-btn-px)] py-[var(--beheer-btn-py)] bg-[var(--beheer-card-bg)] border border-[var(--beheer-border)] text-[var(--beheer-text)] rounded-[var(--beheer-radius)] text-[10px] font-black uppercase tracking-widest hover:border-[var(--beheer-accent)]/50 transition-all active:scale-95 disabled:opacity-50"
                    >
                        <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                        Verversen
                    </button>
                }
            />

            <div className="container mx-auto px-4 py-8 max-w-7xl animate-in fade-in duration-700">
                <AdminStatsBar stats={adminStats} />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    <div className="lg:col-span-4">
                        <CommitteeSidebar 
                            committees={filteredCommittees}
                            selectedId={selected?.id || null}
                            onSelect={handleSelectCommittee}
                            searchQuery={searchQuery}
                            onSearchChange={setSearchQuery}
                            showAll={showAll}
                            onShowAllChange={setShowAll}
                        />
                    </div>

                    <div className="lg:col-span-8">
                        {!selected ? (
                            <div className="bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] shadow-sm ring-1 ring-[var(--beheer-border)] p-24 text-center border-2 border-dashed border-[var(--beheer-border)] opacity-60">
                                <Users className="h-16 w-16 text-[var(--beheer-text-muted)] mx-auto mb-6 opacity-20" />
                                <h3 className="text-xl font-black text-[var(--beheer-text)] uppercase tracking-tight mb-2">Geen selectie</h3>
                                <p className="text-[var(--beheer-text-muted)] font-black uppercase tracking-widest text-[10px] max-w-xs mx-auto opacity-60">
                                    Kies een groep uit de lijst om de details en leden te beheren.
                                </p>
                            </div>
                        ) : (
                            <CommitteeDetail 
                                selected={selected}
                                members={members}
                                isUpdating={isPending}
                                actionLoading={actionLoading}
                                editingDetail={editingDetail}
                                onToggleEditing={() => setEditingDetail(!editingDetail)}
                                editShortDesc={editShortDesc}
                                onShortDescChange={setEditShortDesc}
                                editDesc={editDesc}
                                onDescChange={setEditDesc}
                                onSaveDetail={handleSaveDetail}
                                savingDetail={savingDetail}
                                newMemberEmail={newMemberEmail}
                                onNewMemberEmailChange={setNewMemberEmail}
                                onAddMember={handleAddMember}
                                addingMember={addingMember}
                                addError={addError}
                                onRemoveMember={handleRemoveMember}
                                onToggleLeader={handleToggleLeader}
                            />
                        )}
                    </div>
                </div>
            </div>
            <AdminToast toast={toast} onClose={hideToast} />
        </div>
    );
}
