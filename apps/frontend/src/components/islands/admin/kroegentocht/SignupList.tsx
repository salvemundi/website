'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { downloadCSV } from '@/lib/utils/export';
import { type PubCrawlSignup } from '@salvemundi/validations/schema/pub-crawl.zod';
import { safeConsoleError } from '@/server/utils/logger';
import {
    savePubCrawlGroupsAssignment,
    updatePubCrawlEventGroups
} from '@/server/actions/admin/admin-kroegentocht.actions';

import StatsToolbar from './signup-list/StatsToolbar';
import SignupTableView from './signup-list/SignupTableView';
import SignupGroupsView from './signup-list/SignupGroupsView';
import DistributionPreviewModal from './signup-list/DistributionPreviewModal';

interface Participant {
    name: string;
    initial: string;
}

interface ExtendedSignup extends PubCrawlSignup {
    participants?: Participant[];
    created_at?: string | Date;
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

const getFilenameTimestamp = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}_${String(d.getHours()).padStart(2, '0')}-${String(d.getMinutes()).padStart(2, '0')}-${String(d.getSeconds()).padStart(2, '0')}`;
};

function getParticipants(signup: ExtendedSignup): Participant[] {
    const raw = signup.participants as unknown;
    if (typeof raw === 'string') {
        try {
            const parsed = JSON.parse(raw) as unknown;
            if (Array.isArray(parsed)) {
                return parsed as Participant[];
            }
        } catch (error) {
            safeConsoleError('[SignupList][getParticipants] JSON parse error', error);
        }
        return [];
    }
    return Array.isArray(raw) ? (raw as Participant[]) : [];
}

export default function SignupList({
    signups,
    eventId,
    eventName,
    onDelete,
    onEdit,
    eventGroups = [],
    onUpdateGroup,
    onRefresh
}: SignupListProps) {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'table' | 'groups'>('groups');
    const [isPending, startTransition] = useTransition();

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
    const totalAssociationsCount = [...new Set(paidSignups.map(s => s.association).filter(Boolean))].length;

    const handleOpenDistributionPreview = () => {
        if (groupNames.length === 0) {
            alert('Geen groepen gedefinieerd voor dit event. Voeg eerst groepen toe in de event details.');
            return;
        }
        if (paidSignups.length === 0) {
            alert('Geen betaalde aanmeldingen gevonden om te verdelen.');
            return;
        }

        const sortedSignups = [...paidSignups].sort((a, b) => b.amount_tickets - a.amount_tickets);

        type GroupEntry = { signupId: number; name: string; amountTickets: number; oldGroup: string | null };
        const ticketCounts = new Map<string, number>(groupNames.map(n => [n, 0]));
        const groupSignups = new Map<string, GroupEntry[]>(groupNames.map(n => [n, []]));

        const assignmentsList: { signupId: number; groupName: string }[] = [];

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
        const matchesSearch =
            s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.association.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = s.payment_status === 'paid';

        let matchesGroup = false;
        if (!s.group_name) {
            matchesGroup = enabledGroups.includes('unassigned');
        } else {
            matchesGroup = enabledGroups.includes(s.group_name);
        }

        return matchesSearch && matchesStatus && matchesGroup;
    });

    const exportToCSV = () => {
        const rows: Record<string, string | number>[] = [];
        filteredSignups.forEach((signup) => {
            const registrationDate = signup.created_at ? new Date(signup.created_at).toLocaleString('nl-NL', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }) : '-';

            const participants = getParticipants(signup);
            const groupName = signup.group_name || 'Niet ingedeeld';

            if (participants.length > 0) {
                participants.forEach((p) => {
                    rows.push({
                        'Naam': `${p.name} ${p.initial}.`.trim(),
                        'Vereniging': signup.association || '-',
                        'Inschrijfdatum': registrationDate,
                        'Groep': groupName
                    });
                });
            } else {
                rows.push({
                    'Naam': signup.name,
                    'Vereniging': signup.association || '-',
                    'Inschrijfdatum': registrationDate,
                    'Groep': groupName
                });
                for (let i = 1; i < signup.amount_tickets; i++) {
                    rows.push({
                        'Naam': `Deelnemer ${i + 1} (${signup.name})`,
                        'Vereniging': signup.association || '-',
                        'Inschrijfdatum': registrationDate,
                        'Groep': groupName
                    });
                }
            }
        });

        const filename = `kroegentocht-${eventName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${getFilenameTimestamp()}.csv`;
        downloadCSV(rows, filename);
    };

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
                groupNames={groupNames}
                isPending={isPending}
                onAutoDistribute={handleOpenDistributionPreview}
                onExportCSV={exportToCSV}
                hasSignups={filteredSignups.length > 0}
            />

            {viewMode === 'table' ? (
                <SignupTableView
                    filteredSignups={filteredSignups}
                    groupNames={groupNames}
                    groupConfigs={groupConfigs}
                    onUpdateGroup={onUpdateGroup}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    getParticipants={getParticipants}
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
        </div>
    );
}