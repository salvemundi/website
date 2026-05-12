'use client';

import { useState, useCallback, useMemo, useTransition } from 'react';
import {
    Users,
    RefreshCw
} from 'lucide-react';
import type { Committee, CommitteeMember } from '@/server/queries/admin-commissies.queries';
import {
    getCommittees,
    getCommitteeMembers,
    addCommitteeMember,
    removeCommitteeMember,
    toggleCommitteeLeader,
    updateCommitteeDetails
} from '@/server/actions/admin/admin-committees.actions';
import AdminToolbar from '@/components/ui/admin/AdminToolbar';

import CommitteeSidebar from './CommitteeSidebar';
import CommitteeDetail from './CommitteeDetail';
import AdminToast from '@/components/ui/admin/AdminToast';
import { useAdminToast } from '@/hooks/use-admin-toast';
import type { UserBasic } from '@/server/internal/user-db.utils';

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
            } catch {
                showToast('Fout bij ophalen leden', 'error');
            }
        });
    }, [showToast]);

    const handleAddMember = async (user: UserBasic) => {
        if (!selected?.azure_group_id || !user.email) return;
        setAddingMember(true);
        setAddError(null);
        const res = await addCommitteeMember(selected.azure_group_id, selected.id.toString(), user.email);
        if (!res.success) {
            setAddError(res.error ?? 'Toevoegen mislukt');
            showToast(res.error ?? 'Toevoegen mislukt', 'error');
        } else {
            setNewMemberEmail('');
            showToast(`${user.first_name} succesvol toegevoegd aan de commissie`, 'success');
            // Sync is done on server, so we can reload immediately
            handleSelectCommittee(selected);
        }
        setAddingMember(false);
    };

    const handleRemoveMember = async (member: CommitteeMember) => {
        if (!selected?.azure_group_id) return;
        if (!confirm(`Weet je zeker dat je ${member.displayName} wilt verwijderen?`)) return;

        // Optimistic UI Update
        const previousMembers = [...members];
        setMembers(prev => prev.filter(m => m.entraId !== member.entraId));
        setActionLoading(`remove-${member.entraId}`);

        const res = await removeCommitteeMember(selected!.azure_group_id!, member.entraId, member.isLeader);
        if (res.success) {
            showToast('Lid succesvol verwijderd uit de commissie', 'success');
        } else {
            setMembers(previousMembers); // Rollback
            showToast(res.error ?? 'Verwijderen mislukt', 'error');
        }
        setActionLoading(null);
    };

    const handleToggleLeader = async (member: CommitteeMember) => {
        if (!member.directusMembershipId) {
            showToast('Lidmaatschapsrecord niet gevonden.', 'error');
            return;
        }

        // Optimistic UI Update
        const previousMembers = [...members];
        setMembers(prev => prev.map(m => m.entraId === member.entraId ? { ...m, isLeader: !m.isLeader } : m));
        setActionLoading(`leader-${member.entraId}`);

        const res = await toggleCommitteeLeader(
            member.directusMembershipId,
            member.isLeader,
            selected?.azure_group_id,
            member.entraId
        );
        if (res.success) {
            showToast(`Status '${member.isLeader ? 'Lid' : 'Leider'}' succesvol bijgewerkt`, 'success');
        } else {
            setMembers(previousMembers); // Rollback
            showToast(res.error ?? 'Bijwerken mislukt', 'error');
        }
        setActionLoading(null);
    };

    const handleSaveDetail = async () => {
        if (!selected) return;
        setSavingDetail(true);
        const res = await updateCommitteeDetails(selected.id.toString(), {
            short_description: editShortDesc,
            description: editDesc
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

    const toolbarActions = (
        <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-4 bg-[var(--beheer-card-soft)] px-4 py-2 rounded-2xl border border-[var(--beheer-border)]/50 shadow-sm">
                <div className="flex flex-col items-center px-2">
                    <span className="text-[10px] font-semibold text-[var(--beheer-text-muted)] leading-none mb-1">Groepen</span>
                    <span className="text-sm font-bold text-[var(--beheer-text)] leading-none">{committees.length}</span>
                </div>
                <div className="w-px h-6 bg-[var(--beheer-border)]/20" />
                <div className="flex flex-col items-center px-2">
                    <span className="text-[10px] font-semibold text-[var(--beheer-text-muted)] leading-none mb-1">
                        {selected ? 'C. Leden' : 'Totaal Leden'}
                    </span>
                    <span className="text-sm font-bold text-[var(--beheer-text)] leading-none">
                        {selected ? members.length : totalUniqueMembers}
                    </span>
                </div>
            </div>

            <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 px-[var(--beheer-btn-px)] py-[var(--beheer-btn-py)] bg-[var(--beheer-card-bg)] border border-[var(--beheer-border)] text-[var(--beheer-text)] rounded-[var(--beheer-radius)] text-xs font-semibold hover:border-[var(--beheer-accent)]/50 transition-all active:scale-95 disabled:opacity-50"
            >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                Verversen
            </button>
        </div>
    );

    return (
        <div className="min-h-screen bg-[var(--bg-main)]">
            <AdminToolbar
                title="Commissies"
                subtitle="Beheer commissies, leden en Azure-groepen"
                backHref="/beheer"
                actions={toolbarActions}
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-8 items-start">
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
                            <h3 className="text-xl font-semibold text-[var(--beheer-text)] mb-2">Geen selectie</h3>
                            <p className="text-[var(--beheer-text-muted)] font-semibold text-xs max-w-xs mx-auto opacity-60">
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
            <AdminToast toast={toast} onClose={hideToast} />
        </div>
    );
}