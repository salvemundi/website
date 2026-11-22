'use client';

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Users } from 'lucide-react';
import { Box, Grid, Paper, Stack, Text, Title } from '@mantine/core';
import type { Committee, CommitteeMember } from '@/server/queries/commissies/beheer-commissies.queries';
import {
    getCommitteeMembers,
    addCommitteeMember,
    removeCommitteeMember,
    toggleCommitteeLeader,
    updateCommitteeDetails
} from '@/server/actions/beheer/committees/beheer-committees.actions';

import CommitteeSidebar, { cleanCommitteeName, type GroupCategory } from './CommitteeSidebar';
import CommitteeDetail from './CommitteeDetail';
import { useAdminToast } from '@/hooks/use-beheer-toast';
import { isCommitteeGroup, isTeamGroup } from '@/shared/lib/permissions';
import { COMMITTEES } from '@/shared/lib/permissions-config';
import { type UserBasic } from '@salvemundi/validations';

function sortGroups(items: Committee[], category: GroupCategory): Committee[] {
    return [...items]
        .filter((c) => (category === 'commissies' ? isCommitteeGroup(c) : isTeamGroup(c)))
        .sort((a, b) => {
            if (category === 'commissies') {
                const aIsBestuur = a.azure_group_id === COMMITTEES.BESTUUR || cleanCommitteeName(a.name).toLowerCase() === 'bestuur';
                const bIsBestuur = b.azure_group_id === COMMITTEES.BESTUUR || cleanCommitteeName(b.name).toLowerCase() === 'bestuur';
                if (aIsBestuur && !bIsBestuur) return -1;
                if (!aIsBestuur && bIsBestuur) return 1;
            }
            return cleanCommitteeName(a.name).localeCompare(cleanCommitteeName(b.name), 'nl');
        });
}

interface Props {
    initialCommittees: Committee[];
    initialMembers?: CommitteeMember[];
    initialSelectedId?: number | null;
}

export default function CommitteeManagementIsland({
    initialCommittees,
    initialMembers = [],
    initialSelectedId = null,
}: Props) {
    const { showToast } = useAdminToast();
    const [committees, setCommittees] = useState<Committee[]>(initialCommittees);
    const [category, setCategory] = useState<GroupCategory>(() =>
        initialCommittees.some(isCommitteeGroup) ? 'commissies' : 'teams'
    );

    const initialSelected: Committee | null = useMemo(() => {
        if (initialSelectedId !== null) {
            const match = initialCommittees.find((c) => c.id === initialSelectedId);
            if (match) return match;
        }
        return sortGroups(initialCommittees, initialCommittees.some(isCommitteeGroup) ? 'commissies' : 'teams').at(0) ?? null;
    }, [initialCommittees, initialSelectedId]);

    const [selected, setSelected] = useState<Committee | null>(initialSelected);
    const [members, setMembers] = useState<CommitteeMember[]>(initialMembers);
    const [membersLoading, setMembersLoading] = useState(false);

    const activeCommitteeIdRef = useRef<number | null>(initialSelected?.id ?? null);
    const didRestoreRef = useRef(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const [addingMember, setAddingMember] = useState(false);
    const [addError, setAddError] = useState<string | null>(null);

    const [editingDetail, setEditingDetail] = useState(false);
    const [editShortDesc, setEditShortDesc] = useState(initialSelected?.short_description || '');
    const [editDesc, setEditDesc] = useState(initialSelected?.description || '');
    const [savingDetail, setSavingDetail] = useState(false);

    const filteredItems = useMemo(() => sortGroups(committees, category), [committees, category]);

    const handleSelectCommittee = useCallback(async (c: Committee) => {
        activeCommitteeIdRef.current = c.id;
        setMembersLoading(true);
        setSelected(c);
        setMembers([]);
        setEditingDetail(false);
        setEditShortDesc(c.short_description || '');
        setEditDesc(c.description || '');
        setAddError(null);

        try {
            localStorage.setItem('sm_admin_comm_selected_id', c.id.toString());
        } catch {
            // Ignore storage/security errors
        }

        try {
            const m = await getCommitteeMembers(c.id.toString());
            if (activeCommitteeIdRef.current === c.id) {
                setMembers(m);
                setMembersLoading(false);
            }
        } catch {
            if (activeCommitteeIdRef.current === c.id) {
                showToast('Fout bij ophalen leden', 'error');
                setMembersLoading(false);
            }
        }
    }, [showToast]);

    const handleCategoryChange = useCallback((nextCategory: GroupCategory) => {
        setCategory(nextCategory);
        const nextItems = sortGroups(committees, nextCategory);
        const firstItem = nextItems.at(0) ?? null;

        if (firstItem) {
            void handleSelectCommittee(firstItem);
        } else {
            activeCommitteeIdRef.current = null;
            setSelected(null);
            setMembers([]);
            setEditingDetail(false);
            setAddError(null);
        }
    }, [committees, handleSelectCommittee]);

    useEffect(() => {
        if (didRestoreRef.current) return;
        didRestoreRef.current = true;

        try {
            const savedSelectedId = localStorage.getItem('sm_admin_comm_selected_id');
            if (savedSelectedId !== null) {
                const idNum = Number(savedSelectedId);
                const found = initialCommittees.find((c) => c.id === idNum);
                if (found) {
                    setCategory(isTeamGroup(found) ? 'teams' : 'commissies');
                    if (found.id !== activeCommitteeIdRef.current) {
                        void handleSelectCommittee(found);
                    }
                }
            }
        } catch {
            // Ignore storage/security errors
        }
    }, [initialCommittees, handleSelectCommittee]);

    const handleAddMember = async (user: UserBasic) => {
        if (!selected?.azure_group_id || !user.email) return;
        setAddingMember(true);
        setAddError(null);
        const res = await addCommitteeMember(selected.azure_group_id, selected.id.toString(), user.email);
        if (!res.success) {
            setAddError(res.error ?? 'Toevoegen mislukt');
            showToast(res.error ?? 'Toevoegen mislukt', 'error');
        } else {
            const displayLabel = user.first_name || user.email;
            showToast(`${displayLabel} succesvol toegevoegd`, 'success');
            void handleSelectCommittee(selected);
        }
        setAddingMember(false);
    };

    const handleRemoveMember = async (member: CommitteeMember) => {
        if (!selected?.azure_group_id) return;
        if (!confirm(`Weet je zeker dat je ${member.displayName} wilt verwijderen?`)) return;

        const previousMembers = [...members];
        setMembers(prev => prev.filter(m => m.entraId !== member.entraId));
        setActionLoading(`remove-${member.entraId}`);

        const res = await removeCommitteeMember(selected.azure_group_id, member.entraId, member.isLeader);
        if (res.success) {
            showToast('Lid succesvol verwijderd', 'success');
        } else {
            setMembers(previousMembers);
            showToast(res.error ?? 'Verwijderen mislukt', 'error');
        }
        setActionLoading(null);
    };

    const handleToggleLeader = async (member: CommitteeMember) => {
        if (!member.directusMembershipId) {
            showToast('Lidmaatschapsrecord niet gevonden.', 'error');
            return;
        }

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
            setMembers(previousMembers);
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
            setCommittees(prev =>
                prev.map(c =>
                    c.id === selected.id
                        ? { ...c, short_description: editShortDesc, description: editDesc }
                        : c
                )
            );
            setSelected(prev => prev ? { ...prev, short_description: editShortDesc, description: editDesc } : prev);
            setEditingDetail(false);
            showToast('Commissie details succesvol bijgewerkt', 'success');
        } else {
            showToast(res.error ?? 'Opslaan mislukt', 'error');
        }
        setSavingDetail(false);
    };

    return (
        <Box w="100%">
            <Grid gap="lg" align="stretch">
                <Grid.Col span={{ base: 12, lg: 4 }}>
                    <Box pos={{ lg: 'sticky' }} top={{ lg: 100 }}>
                        <CommitteeSidebar
                            committees={filteredItems}
                            selectedId={selected?.id ?? null}
                            onSelect={(c) => { void handleSelectCommittee(c); }}
                            category={category}
                            onCategoryChange={handleCategoryChange}
                        />
                    </Box>
                </Grid.Col>

                <Grid.Col span={{ base: 12, lg: 8 }}>
                    {!selected ? (
                        <Paper withBorder p="xl" ta="center" style={{ borderStyle: 'dashed' }}>
                            <Stack align="center" gap="xs" py="xl">
                                <Users size={48} opacity={0.25} />
                                <Title order={3} size="h4">Geen selectie</Title>
                                <Text size="xs" fw={600} c="dimmed" maw={280}>
                                    Kies een commissie of team uit de lijst om de leden te beheren.
                                </Text>
                            </Stack>
                        </Paper>
                    ) : (
                        <CommitteeDetail
                            selected={selected}
                            members={members}
                            isUpdating={membersLoading}
                            actionLoading={actionLoading}
                            editingDetail={editingDetail}
                            onToggleEditing={() => setEditingDetail(!editingDetail)}
                            editShortDesc={editShortDesc}
                            onShortDescChange={setEditShortDesc}
                            editDesc={editDesc}
                            onDescChange={setEditDesc}
                            onSaveDetail={() => { void handleSaveDetail(); }}
                            savingDetail={savingDetail}
                            onAddMember={(user) => { void handleAddMember(user); }}
                            addingMember={addingMember}
                            addError={addError}
                            onRemoveMember={(member) => { void handleRemoveMember(member); }}
                            onToggleLeader={(member) => { void handleToggleLeader(member); }}
                        />
                    )}
                </Grid.Col>
            </Grid>
        </Box>
    );
}
