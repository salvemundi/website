'use client';

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { getAssociationStats, signupMatchesSearch } from '@/lib/utils/kroegentocht-signups';
import { type PubCrawlSignup } from '@salvemundi/validations/schema/pub-crawl.zod';
import { safeConsoleError } from '@/server/utils/logger';
import {
    savePubCrawlGroupsAssignment,
    updatePubCrawlEventGroups,
    createManualPubCrawlSignup,
    syncPubCrawlGoogleSheet
} from '@/server/actions/beheer/kroegentocht/beheer-kroegentocht-core.actions';
import StatsToolbar from './signup-list/StatsToolbar';
import SignupTableView from './signup-list/SignupTableView';
import SignupGroupsView from './signup-list/SignupGroupsView';
import SignupAssociationsView from './signup-list/SignupAssociationsView';
import DistributionPreviewModal from './signup-list/DistributionPreviewModal';
import AddParticipantModal from './signup-list/AddParticipantModal';

interface Participant {
    name: string;
    initial: string;
}

interface ExtendedSignup extends PubCrawlSignup {
    participants?: Participant[];
    created_at: string;
}

interface GroupLeader {
    name: string;
    signupId?: number | null;
}

interface GroupConfig {
    name: string;
    leaders?: GroupLeader[];
}

interface SignupListProps {
    signups: ExtendedSignup[];
    eventId: number | string;
    eventName: string;
    onDelete: (id: number | string) => void;
    onEdit: (id: number | string) => void;
    eventGroups?: unknown[];
    onUpdateGroup?: (signupId: number, newGroupName: string | null) => Promise<void>;
    onRefresh?: () => void;
}

function getParticipants(signup: ExtendedSignup): Participant[] {
    const raw = signup.participants as unknown;
    if (typeof raw === 'string') {
        try {
            const parsed = JSON.parse(raw) as unknown;
            if (Array.isArray(parsed)) {
                return parsed as Participant[];
            }
        } catch (error) {
            safeConsoleError('[SignupList.tsx][getParticipants] JSON parse error', error);
        }
        return [];
    }
    return Array.isArray(raw) ? (raw as Participant[]) : [];
}

export default function SignupList({
    signups,
    eventId,
    onDelete,
    onEdit,
    eventGroups = [],
    onUpdateGroup,
    onRefresh
}: SignupListProps) {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'table' | 'groups' | 'associations'>('groups');
    const [isPending, startTransition] = useTransition();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const [enabledGroups, setEnabledGroups] = useState<string[]>(() => {
        const initialGroups = eventGroups.map((g: unknown): string => {
            if (typeof g === 'string') return g;
            const obj = g && typeof g === 'object' ? (g as { name?: unknown }) : {};
            return typeof obj.name === 'string' ? obj.name : '';
        }).filter(Boolean);
        return [...initialGroups, 'unassigned'];
    });

    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [previewData, setPreviewData] = useState<{
        assignments: { signupId: number; groupName: string }[];
        groups: { name: string; signups: { signupId: number; name: string; amountTickets: number; oldGroup: string | null }[]; ticketCount: number }[];
    } | null>(null);

    const groupConfigs: GroupConfig[] = eventGroups.map((g: unknown): GroupConfig => {
        if (typeof g === 'string') {
            return { name: g, leaders: [] };
        }
        if (g && typeof g === 'object') {
            const obj = g as { name?: unknown; leaders?: unknown };
            const name = typeof obj.name === 'string' ? obj.name : '';
            const leaders = Array.isArray(obj.leaders)
                ? (obj.leaders as GroupLeader[])
                : [];
            return { name, leaders };
        }
        return { name: '', leaders: [] };
    }).filter(g => g.name !== '');

    const groupNames = groupConfigs.map(g => g.name);

    const paidSignups = signups.filter(s => s.payment_status === 'paid');
    const totalTicketsCount = paidSignups.reduce((sum, s) => sum + (s.amount_tickets || 0), 0);
    const totalAssociationsCount = getAssociationStats(paidSignups).length;

    const handleAddParticipant = async (data: {
        name: string;
        email: string;
        association: string;
        initial: string;
        group_name: string | null;
    }) => {
        const res = await createManualPubCrawlSignup(Number(eventId), data);
        if (res.success) {
            onRefresh?.();
            router.refresh();
        }
    };

    const handleOpenDistributionPreview = () => {
        if (groupNames.length === 0) {
            alert('Geen groepen gedefinieerd voor dit event. Voeg eerst groepen toe in de event details.');
            return;
        }
        if (paidSignups.length === 0) {
            alert('Geen betaalde aanmeldingen gevonden om te verdelen.');
            return;
        }

        type GroupEntry = { signupId: number; name: string; amountTickets: number; oldGroup: string | null };
        // Externe groepsleiders tellen mee als persoon in hun groep.
        const ticketCounts = new Map<string, number>(groupConfigs.map(g => [g.name, (g.leaders || []).filter(l => !l.signupId).length]));
        const groupSignups = new Map<string, GroupEntry[]>(groupNames.map(n => [n, []]));

        const assignmentsList: { signupId: number; groupName: string }[] = [];

        // Inschrijvingen met een groepsleider blijven vast in de groep van die leider.
        const leaderGroupOf = (signupId: number) =>
            groupConfigs.find(g => (g.leaders || []).some(l => l.signupId === signupId))?.name;
        const pinned = paidSignups.filter(s => s.id && leaderGroupOf(Number(s.id)));
        for (const signup of pinned) {
            const group = leaderGroupOf(Number(signup.id)) as string;
            groupSignups.get(group)?.push({
                signupId: Number(signup.id),
                name: signup.name,
                amountTickets: signup.amount_tickets,
                oldGroup: signup.group_name || null
            });
            ticketCounts.set(group, (ticketCounts.get(group) ?? 0) + signup.amount_tickets);
            assignmentsList.push({ signupId: Number(signup.id), groupName: group });
        }

        const sortedSignups = paidSignups
            .filter(s => !pinned.includes(s))
            .sort((a, b) => b.amount_tickets - a.amount_tickets);

        for (const signup of sortedSignups) {
            if (!signup.id) continue;

            let bestGroup = groupNames[0];
            let minTickets = Infinity;

            for (const name of groupNames) {
                const count = ticketCounts.get(name) ?? 0;
                if (count < minTickets) {
                    minTickets = count;
                    bestGroup = name;
                }
            }

            groupSignups.get(bestGroup)?.push({
                signupId: Number(signup.id),
                name: signup.name,
                amountTickets: signup.amount_tickets,
                oldGroup: signup.group_name || null
            });
            ticketCounts.set(bestGroup, (ticketCounts.get(bestGroup) ?? 0) + signup.amount_tickets);

            assignmentsList.push({ signupId: Number(signup.id), groupName: bestGroup });
        }

        setPreviewData({
            assignments: assignmentsList,
            groups: groupNames.map(name => ({
                name,
                signups: groupSignups.get(name) ?? [],
                ticketCount: ticketCounts.get(name) ?? 0
            }))
        });
        setIsPreviewOpen(true);
    };

    const handleSaveAutoDistribution = () => {
        if (!previewData || previewData.assignments.length === 0) return;

        startTransition(async () => {
            try {
                const res = await savePubCrawlGroupsAssignment(Number(eventId), previewData.assignments);
                if (res.success) {
                    setIsPreviewOpen(false);
                    onRefresh?.();
                    router.refresh();
                }
            } catch (error) {
                alert('Fout bij opslaan indeling: ' + String(error));
            }
        });
    };

    const handleAddLeader = (groupName: string, name: string, signupId: number | null) => {
        void (async () => {
            try {
                const currentGroups = groupConfigs.map(g => ({
                    name: g.name,
                    leaders: g.leaders || []
                }));

                const groupObj = currentGroups.find(g => g.name === groupName);
                if (groupObj) {
                    const newLeader = {
                        name,
                        signupId
                    };
                    groupObj.leaders = [...groupObj.leaders, newLeader];
                }

                await updatePubCrawlEventGroups(Number(eventId), currentGroups);
                onRefresh?.();
                router.refresh();
            } catch (error) {
                alert('Fout bij toevoegen leider: ' + String(error));
            }
        })();
    };

    const handleRemoveLeader = (groupName: string, leaderToRemove: GroupLeader) => {
        if (!confirm(`Weet je zeker dat je ${leaderToRemove.name} wilt verwijderen als groepsleider?`)) return;

        void (async () => {
            try {
                const currentGroups = groupConfigs.map(g => ({
                    name: g.name,
                    leaders: g.leaders || []
                }));

                const groupObj = currentGroups.find(g => g.name === groupName);
                if (groupObj) {
                    groupObj.leaders = groupObj.leaders.filter((l) =>
                        !(l.name === leaderToRemove.name && l.signupId === (leaderToRemove.signupId || null))
                    );
                }

                await updatePubCrawlEventGroups(Number(eventId), currentGroups);
                onRefresh?.();
                router.refresh();
            } catch (error) {
                alert('Fout bij verwijderen leider: ' + String(error));
            }
        })();
    };

    const filteredSignups = signups.filter(s => {
        if (s.payment_status !== 'paid') return false;
        if (!signupMatchesSearch(s, searchQuery)) return false;
        return s.group_name ? enabledGroups.includes(s.group_name) : enabledGroups.includes('unassigned');
    });

    // --- Google Sheet sync ---
    type SyncState = { status: 'idle' | 'syncing' | 'ok' | 'error'; at?: Date; message?: string; url?: string | null };
    const [syncState, setSyncState] = useState<SyncState>({ status: 'idle' });
    const syncingRef = useRef(false);

    const syncSheet = useCallback(async () => {
        if (syncingRef.current) return;
        syncingRef.current = true;
        setSyncState(prev => ({ ...prev, status: 'syncing' }));
        try {
            const res = await syncPubCrawlGoogleSheet(Number(eventId));
            setSyncState(res.success
                ? { status: 'ok', at: new Date(), url: res.url }
                : { status: 'error', message: res.error, url: res.url });
        } catch (error) {
            safeConsoleError('[SignupList.tsx][syncSheet]', error);
            setSyncState({ status: 'error', message: 'Synchroniseren mislukt' });
        } finally {
            syncingRef.current = false;
        }
    }, [eventId]);

    // Automatisch: bij openen/wijzigen van de data en daarna elke 5 minuten
    // (zodat nieuwe betaalde aanmeldingen ook in de sheet komen).
    useEffect(() => {
        void syncSheet();
        const interval = setInterval(() => { void syncSheet(); }, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [syncSheet, signups]);

    return (
        <div className="space-y-6">
            <StatsToolbar
                viewMode={viewMode}
                setViewMode={setViewMode}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                enabledGroups={enabledGroups}
                setEnabledGroups={setEnabledGroups}
                totalTicketsCount={totalTicketsCount}
                totalAssociationsCount={totalAssociationsCount}
                syncState={syncState}
                onSyncSheet={() => { void syncSheet(); }}
                groupNames={groupNames}
                isPending={isPending}
                onAutoDistribute={handleOpenDistributionPreview}
                onAddParticipant={() => setIsAddModalOpen(true)}
                hasSignups={filteredSignups.length > 0}
            />

            {viewMode === 'associations' ? (
                <SignupAssociationsView signups={paidSignups} />
            ) : viewMode === 'table' ? (
                <SignupTableView
                    filteredSignups={filteredSignups}
                    groupNames={groupNames}
                    groupConfigs={groupConfigs}
                    onUpdateGroup={onUpdateGroup}
                    onEdit={onEdit}
                    onDelete={onDelete}
                />
            ) : (
                <SignupGroupsView
                    filteredSignups={filteredSignups}
                    groupConfigs={groupConfigs}
                    groupNames={groupNames}
                    enabledGroups={enabledGroups}
                    onUpdateGroup={onUpdateGroup}
                    onAddLeader={handleAddLeader}
                    onRemoveLeader={handleRemoveLeader}
                    getParticipants={getParticipants}
                />
            )}

            <DistributionPreviewModal
                isOpen={isPreviewOpen}
                onClose={() => setIsPreviewOpen(false)}
                previewData={previewData}
                isPending={isPending}
                onSave={handleSaveAutoDistribution}
            />

            <AddParticipantModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                groupNames={groupNames}
                onAdd={handleAddParticipant}
            />
        </div>
    );
}
