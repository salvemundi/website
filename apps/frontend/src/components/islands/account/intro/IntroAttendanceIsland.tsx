'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Trash2, Check, Home, LogOut, MoonStar, HelpCircle, Pencil, MessageSquarePlus, ChevronDown, History, Search, X } from 'lucide-react';
import {
    ActionIcon,
    Badge,
    Box,
    Button,
    Card,
    Center,
    Divider,
    Group,
    Loader,
    Paper,
    Stack,
    Text,
    TextInput,
    Title,
} from '@mantine/core';
import { DateInput, TimeInput } from '@mantine/dates';
import type { IntroGroupWithDetails, IntroGroupMemberWithAttendance, IntroGroupAttendanceStatus, IntroGroupMemberNoteWithAuthor, IntroGroupAttendanceLogWithAuthor } from '@salvemundi/validations/schema/intro.zod';
import {
    getGroupAttendanceForDate,
    getAttendanceSummaryForDate,
    addGroupMember,
    removeGroupMember,
    setMemberStatus,
    getMemberNotes,
    addMemberNote,
    deleteMemberNote,
    getMemberAttendanceLog
} from '@/server/actions/public/intro-attendance.actions';
import { formatDate } from '@/shared/lib/utils/date';
import { useAdminToast } from '@/hooks/use-beheer-toast';

interface Props {
    groups: IntroGroupWithDetails[];
    isCrew: boolean;
    initialGroupId?: number | null;
}

const todayIso = () => new Date().toISOString().split('T')[0];

const parseNlDate = (input: string): string | null => {
    const trimmed = input.trim();
    const nlMatch = /^(\d{1,2})-(\d{1,2})-(\d{4})$/.exec(trimmed);
    if (nlMatch) {
        const day = nlMatch[1].padStart(2, '0');
        const month = nlMatch[2].padStart(2, '0');
        return `${nlMatch[3]}-${month}-${day}`;
    }
    const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
    return isoMatch ? trimmed : null;
};

const formatTime = (iso: string) => new Intl.DateTimeFormat('nl-NL', {
    timeZone: 'Europe/Amsterdam',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
}).format(new Date(iso));

const STATUS_OPTIONS: { value: IntroGroupAttendanceStatus; label: string; icon: typeof HelpCircle }[] = [
    { value: 'not_reported', label: 'Niet gemeld', icon: HelpCircle },
    { value: 'present', label: 'Aanwezig', icon: Check },
    { value: 'went_home', label: 'Onderweg naar huis', icon: LogOut },
    { value: 'staying_out', label: 'Blijft na 22:00', icon: MoonStar }
];

function getStatusSinceLabel(status: IntroGroupAttendanceStatus): string {
    switch (status) {
        case 'present': return 'Aanwezig sinds';
        case 'went_home': return 'Onderweg sinds';
        case 'home': return 'Thuis sinds';
        case 'staying_out': return 'Buiten sinds';
        default: return '';
    }
}

function getStatusLabel(status: IntroGroupAttendanceStatus): string {
    switch (status) {
        case 'present': return 'Aanwezig';
        case 'went_home': return 'Onderweg naar huis';
        case 'home': return 'Thuis';
        case 'staying_out': return 'Blijft na 22:00';
        default: return 'Niet gemeld';
    }
}

function getStatusColor(status: IntroGroupAttendanceStatus): string {
    switch (status) {
        case 'present': return 'brand';
        case 'went_home': return 'accent';
        case 'home': return 'success';
        case 'staying_out': return 'lightPurple';
        default: return 'dimmed';
    }
}

function getStatusAccentCssVar(status: IntroGroupAttendanceStatus): string | null {
    switch (status) {
        case 'present': return 'var(--mantine-color-brand-filled)';
        case 'went_home': return 'var(--mantine-color-accent-filled)';
        case 'home': return 'var(--mantine-color-success-filled)';
        case 'staying_out': return 'var(--mantine-color-purple-filled)';
        default: return null;
    }
}

function getStatusIcon(status: IntroGroupAttendanceStatus): typeof HelpCircle {
    switch (status) {
        case 'present': return Check;
        case 'went_home': return LogOut;
        case 'home': return Home;
        case 'staying_out': return MoonStar;
        default: return HelpCircle;
    }
}

function getSummaryCount(summary: Record<IntroGroupAttendanceStatus, number> | null, status: IntroGroupAttendanceStatus): number {
    if (!summary) return 0;
    switch (status) {
        case 'present': return summary.present;
        case 'went_home': return summary.went_home;
        case 'home': return summary.home;
        case 'staying_out': return summary.staying_out;
        default: return summary.not_reported;
    }
}

function updateSummaryOnRemove(
    prev: Record<IntroGroupAttendanceStatus, number> | null,
    removedStatus: IntroGroupAttendanceStatus
): Record<IntroGroupAttendanceStatus, number> | null {
    if (!prev) return null;
    const next = { ...prev };
    switch (removedStatus) {
        case 'present': next.present = Math.max(0, next.present - 1); break;
        case 'went_home': next.went_home = Math.max(0, next.went_home - 1); break;
        case 'home': next.home = Math.max(0, next.home - 1); break;
        case 'staying_out': next.staying_out = Math.max(0, next.staying_out - 1); break;
        case 'not_reported': next.not_reported = Math.max(0, next.not_reported - 1); break;
    }
    return next;
}

function updateSummaryOnStatusChange(
    prev: Record<IntroGroupAttendanceStatus, number> | null,
    prevStatus: IntroGroupAttendanceStatus,
    newStatus: IntroGroupAttendanceStatus
): Record<IntroGroupAttendanceStatus, number> | null {
    if (!prev) return null;
    const next = { ...prev };
    switch (prevStatus) {
        case 'present': next.present = Math.max(0, next.present - 1); break;
        case 'went_home': next.went_home = Math.max(0, next.went_home - 1); break;
        case 'home': next.home = Math.max(0, next.home - 1); break;
        case 'staying_out': next.staying_out = Math.max(0, next.staying_out - 1); break;
        case 'not_reported': next.not_reported = Math.max(0, next.not_reported - 1); break;
    }
    switch (newStatus) {
        case 'present': next.present++; break;
        case 'went_home': next.went_home++; break;
        case 'home': next.home++; break;
        case 'staying_out': next.staying_out++; break;
        case 'not_reported': next.not_reported++; break;
    }
    return next;
}

const STATUS_ORDER: IntroGroupAttendanceStatus[] = ['not_reported', 'present', 'went_home', 'home', 'staying_out'];

export default function IntroAttendanceIsland({ groups, isCrew, initialGroupId }: Props) {
    const { showToast } = useAdminToast();
    const initialValid = initialGroupId !== null && initialGroupId !== undefined && groups.some(g => g.id === initialGroupId);
    const [selectedGroupId, setSelectedGroupId] = useState<number | null>(initialValid ? initialGroupId : (groups[0]?.id ?? null));
    const [selectedDate, setSelectedDate] = useState(todayIso());
    const [members, setMembers] = useState<IntroGroupMemberWithAttendance[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<IntroGroupAttendanceStatus | null>(null);
    const [showAddInput, setShowAddInput] = useState(false);
    const [newName, setNewName] = useState('');
    const [addingMember, setAddingMember] = useState(false);
    const [pendingMemberId, setPendingMemberId] = useState<number | null>(null);
    const [justUpdatedId, setJustUpdatedId] = useState<number | null>(null);

    const [editingTimeMemberId, setEditingTimeMemberId] = useState<number | null>(null);
    const [editingTimeValue, setEditingTimeValue] = useState('');

    const [expandedDetailsIds, setExpandedDetailsIds] = useState<number[]>([]);

    const [notesByMember, setNotesByMember] = useState<Map<number, IntroGroupMemberNoteWithAuthor[]>>(new Map());
    const [loadingNotesId, setLoadingNotesId] = useState<number | null>(null);
    const [newNoteByMember, setNewNoteByMember] = useState<Map<number, string>>(new Map());
    const [addingNoteId, setAddingNoteId] = useState<number | null>(null);

    const [logByMember, setLogByMember] = useState<Map<string, IntroGroupAttendanceLogWithAuthor[]>>(new Map());
    const [loadingLogId, setLoadingLogId] = useState<number | null>(null);

    const [totalSummary, setTotalSummary] = useState<Record<IntroGroupAttendanceStatus, number> | null>(null);
    const [loadingSummary, setLoadingSummary] = useState(false);

    useEffect(() => {
        if (!isCrew) return;
        let cancelled = false;
        setLoadingSummary(true);
        getAttendanceSummaryForDate(selectedDate)
            .then(summary => { if (!cancelled) setTotalSummary(summary); })
            .catch(() => { if (!cancelled) showToast('Kon totaaloverzicht niet ophalen', 'error'); })
            .finally(() => { if (!cancelled) setLoadingSummary(false); });
        return () => { cancelled = true; };
    }, [isCrew, selectedDate, showToast]);

    const loadAttendance = useCallback(async (groupId: number, date: string) => {
        setLoading(true);
        try {
            const data = await getGroupAttendanceForDate(groupId, date);
            setMembers(data);
        } catch {
            showToast('Kon aanwezigheid niet ophalen', 'error');
        }
        setLoading(false);
    }, [showToast]);

    useEffect(() => {
        if (selectedGroupId !== null) {
            void loadAttendance(selectedGroupId, selectedDate);
        }
    }, [selectedGroupId, selectedDate, loadAttendance]);

    if (groups.length === 0 || selectedGroupId === null) {
        return (
            <Center py="xl">
                <Text fw={600} c="dimmed">
                    Je bent nog niet gekoppeld aan een groepje.
                </Text>
            </Center>
        );
    }

    const selectedGroup = groups.find(g => g.id === selectedGroupId);
    const filteredMembers = members
        .filter(m => !searchQuery.trim() || m.name.toLowerCase().includes(searchQuery.trim().toLowerCase()))
        .filter(m => !statusFilter || (m.attendance?.status ?? 'not_reported') === statusFilter);
    const statusCounts = new Map<IntroGroupAttendanceStatus, number>();
    for (const member of members) {
        const s = member.attendance?.status ?? 'not_reported';
        statusCounts.set(s, (statusCounts.get(s) ?? 0) + 1);
    }

    const handleAddMember = async () => {
        const trimmed = newName.trim();
        if (!trimmed) return;
        setAddingMember(true);
        const res = await addGroupMember(selectedGroupId, trimmed);
        if (res.success && res.data) {
            const newMember = res.data;
            setMembers(prev => [...prev, { ...newMember, attendance: null }].sort((a, b) => a.name.localeCompare(b.name)));
            setNewName('');
            showToast('Toegevoegd', 'success');
            if (isCrew) {
                setTotalSummary(prev => prev && { ...prev, not_reported: prev.not_reported + 1 });
            }
        } else {
            showToast(res.error || 'Toevoegen mislukt', 'error');
        }
        setAddingMember(false);
    };

    const handleRemoveMember = async (memberId: number, name: string) => {
        if (!confirm(`"${name}" verwijderen uit dit groepje?`)) return;
        const removedStatus = members.find(m => m.id === memberId)?.attendance?.status ?? 'not_reported';
        setPendingMemberId(memberId);
        const res = await removeGroupMember(memberId);
        if (res.success) {
            setMembers(prev => prev.filter(m => m.id !== memberId));
            showToast('Verwijderd', 'success');
            if (isCrew) {
                setTotalSummary(prev => updateSummaryOnRemove(prev, removedStatus));
            }
        } else {
            showToast(res.error || 'Verwijderen mislukt', 'error');
        }
        setPendingMemberId(null);
    };

    const invalidateLog = (memberId: number) => {
        const key = `${memberId}:${selectedDate}`;
        setLogByMember(prev => {
            if (!prev.has(key)) return prev;
            const next = new Map(prev);
            next.delete(key);
            return next;
        });
    };

    const handleSetStatus = async (member: IntroGroupMemberWithAttendance, status: IntroGroupAttendanceStatus) => {
        const previousStatus = member.attendance?.status ?? 'not_reported';
        setPendingMemberId(member.id);
        const res = await setMemberStatus(member.id, selectedDate, status);
        if (res.success && res.data) {
            const attendance = res.data;
            setMembers(prev => prev.map(m => m.id === member.id ? { ...m, attendance } : m));
            invalidateLog(member.id);
            setJustUpdatedId(member.id);
            setTimeout(() => setJustUpdatedId(prev => prev === member.id ? null : prev), 500);
            if (isCrew && previousStatus !== status) {
                setTotalSummary(prev => updateSummaryOnStatusChange(prev, previousStatus, status));
            }
        } else {
            showToast(res.error || 'Bijwerken mislukt', 'error');
        }
        setPendingMemberId(null);
    };

    const startEditTime = (member: IntroGroupMemberWithAttendance) => {
        setEditingTimeMemberId(member.id);
        setEditingTimeValue(member.attendance?.status_at ? formatTime(member.attendance.status_at) : '');
    };

    const handleSaveTime = async (member: IntroGroupMemberWithAttendance) => {
        if (!editingTimeValue || !member.attendance) return;
        const combined = new Date(`${selectedDate}T${editingTimeValue}:00`);
        if (Number.isNaN(combined.getTime())) {
            showToast('Ongeldige tijd', 'error');
            return;
        }
        setPendingMemberId(member.id);
        const res = await setMemberStatus(member.id, selectedDate, member.attendance.status, combined.toISOString());
        if (res.success && res.data) {
            const attendance = res.data;
            setMembers(prev => prev.map(m => m.id === member.id ? { ...m, attendance } : m));
            invalidateLog(member.id);
            showToast('Tijd aangepast', 'success');
        } else {
            showToast(res.error || 'Bijwerken mislukt', 'error');
        }
        setPendingMemberId(null);
        setEditingTimeMemberId(null);
    };

    const loadNotesIfNeeded = async (memberId: number) => {
        if (notesByMember.has(memberId)) return;
        setLoadingNotesId(memberId);
        try {
            const notes = await getMemberNotes(memberId);
            setNotesByMember(prev => new Map(prev).set(memberId, notes));
        } catch {
            showToast('Kon notities niet ophalen', 'error');
        }
        setLoadingNotesId(null);
    };

    const handleAddNote = async (memberId: number) => {
        const text = (newNoteByMember.get(memberId) || '').trim();
        if (!text) return;
        setAddingNoteId(memberId);
        const res = await addMemberNote(memberId, text);
        if (res.success) {
            const notes = await getMemberNotes(memberId);
            setNotesByMember(prev => new Map(prev).set(memberId, notes));
            setNewNoteByMember(prev => new Map(prev).set(memberId, ''));
            showToast('Notitie toegevoegd', 'success');
        } else {
            showToast(res.error || 'Toevoegen mislukt', 'error');
        }
        setAddingNoteId(null);
    };

    const handleDeleteNote = async (memberId: number, noteId: number) => {
        if (!confirm('Deze notitie verwijderen?')) return;
        const res = await deleteMemberNote(noteId);
        if (res.success) {
            setNotesByMember(prev => new Map(prev).set(memberId, (prev.get(memberId) || []).filter(n => n.id !== noteId)));
            showToast('Notitie verwijderd', 'success');
        } else {
            showToast(res.error || 'Verwijderen mislukt', 'error');
        }
    };

    const loadLogIfNeeded = async (memberId: number) => {
        const key = `${memberId}:${selectedDate}`;
        if (logByMember.has(key)) return;
        setLoadingLogId(memberId);
        try {
            const log = await getMemberAttendanceLog(memberId, selectedDate);
            setLogByMember(prev => new Map(prev).set(key, log));
        } catch {
            showToast('Kon logboek niet ophalen', 'error');
        }
        setLoadingLogId(null);
    };

    const toggleDetails = (memberId: number) => {
        const isExpanded = expandedDetailsIds.includes(memberId);
        if (isExpanded) {
            setExpandedDetailsIds(prev => prev.filter(id => id !== memberId));
            return;
        }
        setExpandedDetailsIds(prev => [...prev, memberId]);
        void loadNotesIfNeeded(memberId);
        if (isCrew) void loadLogIfNeeded(memberId);
    };

    return (
        <Stack gap="md">
            {isCrew && (
                <Card padding="sm" withBorder>
                    <Stack gap="xs">
                        <Text size="xs" fw={600} tt="uppercase" c="dimmed">
                            Totaal alle groepjes &middot; {formatDate(selectedDate, 'd MMMM')}
                        </Text>
                        {loadingSummary && !totalSummary ? (
                            <Center py="xs">
                                <Loader size="xs" />
                            </Center>
                        ) : totalSummary && (
                            <Group gap="xs" wrap="wrap">
                                <Text size="xs" fw={700} mr={4}>
                                    {STATUS_ORDER.reduce((sum, s) => sum + getSummaryCount(totalSummary, s), 0)} kiddos
                                </Text>
                                {STATUS_ORDER.filter(s => getSummaryCount(totalSummary, s) > 0).map(s => {
                                    const Icon = getStatusIcon(s);
                                    const color = getStatusColor(s);
                                    return (
                                        <Badge
                                            key={s}
                                            variant={color === 'dimmed' ? 'default' : 'light'}
                                            color={color === 'dimmed' ? undefined : color}
                                            size="sm"
                                            leftSection={<Icon size={12} />}
                                        >
                                            {getSummaryCount(totalSummary, s)} {getStatusLabel(s)}
                                        </Badge>
                                    );
                                })}
                            </Group>
                        )}
                    </Stack>
                </Card>
            )}

            {groups.length > 1 && (
                <Stack gap="xs">
                    <Text size="xs" fw={600} tt="uppercase" c="dimmed">
                        Kies een groepje
                    </Text>
                    <Group gap="xs" wrap="nowrap" style={{ overflowX: 'auto' }} pb={4}>
                        {groups.map(g => (
                            <Button
                                key={g.id}
                                type="button"
                                size="sm"
                                variant={selectedGroupId === g.id ? 'filled' : 'default'}
                                onClick={() => setSelectedGroupId(g.id)}
                                style={{ flexShrink: 0 }}
                            >
                                {g.name}
                            </Button>
                        ))}
                    </Group>
                </Stack>
            )}

            <Stack gap={4}>
                {selectedGroup && (
                    <Text size="xs" fw={600} tt="uppercase" c="dimmed">
                        Je bekijkt
                    </Text>
                )}
                <Group justify="space-between" align="center" wrap="wrap" gap="sm">
                    {selectedGroup && (
                        <Title order={2} size="h3" c="brand">
                            {selectedGroup.name}
                        </Title>
                    )}
                    <DateInput
                        value={selectedDate}
                        onChange={(val) => { if (val) setSelectedDate(val); }}
                        valueFormat="DD-MM-YYYY"
                        dateParser={parseNlDate}
                        aria-label="Datum selecteren"
                        w={{ base: '100%', sm: 'auto' }}
                    />
                </Group>
            </Stack>

            {members.length > 0 && (
                <Group gap="xs" wrap="wrap">
                    {STATUS_ORDER.filter(s => (statusCounts.get(s) ?? 0) > 0).map(s => {
                        const Icon = getStatusIcon(s);
                        const isActive = statusFilter === s;
                        const color = getStatusColor(s);
                        return (
                            <Button
                                key={s}
                                type="button"
                                size="compact-xs"
                                variant={isActive ? 'filled' : color === 'dimmed' ? 'default' : 'light'}
                                color={color === 'dimmed' ? undefined : color}
                                leftSection={<Icon size={12} />}
                                onClick={() => setStatusFilter(prev => prev === s ? null : s)}
                            >
                                {statusCounts.get(s)} {getStatusLabel(s)}
                            </Button>
                        );
                    })}
                    {statusFilter && (
                        <Button
                            type="button"
                            size="compact-xs"
                            leftSection={<X size={12} />}
                            onClick={() => setStatusFilter(null)}
                        >
                            Filter wissen
                        </Button>
                    )}
                </Group>
            )}

            <TextInput
                value={searchQuery}
                onChange={e => setSearchQuery(e.currentTarget.value)}
                placeholder="Zoek op naam..."
                leftSection={<Search size={16} />}
            />

            {showAddInput ? (
                <Group gap="xs" align="stretch" wrap="nowrap">
                    <TextInput
                        value={newName}
                        onChange={e => setNewName(e.currentTarget.value)}
                        onKeyDown={e => { if (e.key === 'Enter') void handleAddMember(); }}
                        placeholder="Naam van kiddo..."
                        autoFocus
                        style={{ flex: 1 }}
                    />
                    <ActionIcon
                        type="button"
                        size={36}
                        onClick={() => { void handleAddMember(); }}
                        disabled={!newName.trim() || addingMember}
                        loading={addingMember}
                        title="Toevoegen"
                        aria-label="Toevoegen"
                    >
                        <Plus size={16} />
                    </ActionIcon>
                    <ActionIcon
                        type="button"
                        size={36}
                        onClick={() => { setShowAddInput(false); setNewName(''); }}
                        title="Annuleren"
                        aria-label="Annuleren"
                    >
                        <X size={16} />
                    </ActionIcon>
                </Group>
            ) : (
                <Box>
                    <Button
                        type="button"
                        onClick={() => setShowAddInput(true)}
                        leftSection={<Plus size={16} />}
                        w={{ base: '100%', sm: 'auto' }}
                    >
                        Kiddo toevoegen
                    </Button>
                </Box>
            )}

            {loading ? (
                <Center py="xl">
                    <Loader size="md" />
                </Center>
            ) : members.length === 0 ? (
                <Center py="xl">
                    <Text fw={600} c="dimmed">
                        Nog geen kiddos in dit groepje.
                    </Text>
                </Center>
            ) : filteredMembers.length === 0 ? (
                <Center py="xl">
                    <Text fw={600} c="dimmed" ta="center">
                        {searchQuery.trim() && statusFilter
                            ? <>Geen kiddo gevonden voor &quot;{searchQuery}&quot; met status &quot;{getStatusLabel(statusFilter)}&quot;.</>
                            : searchQuery.trim()
                                ? <>Geen kiddo gevonden voor &quot;{searchQuery}&quot;.</>
                                : <>Geen kiddo met status &quot;{statusFilter ? getStatusLabel(statusFilter) : ''}&quot;.</>}
                    </Text>
                </Center>
            ) : (
                <Stack gap="xs">
                    {filteredMembers.map(member => {
                        const isPending = pendingMemberId === member.id;
                        const status = member.attendance?.status ?? 'not_reported';
                        const statusAt = member.attendance?.status_at;
                        const isEditingTime = editingTimeMemberId === member.id;
                        const detailsExpanded = expandedDetailsIds.includes(member.id);
                        const notes = notesByMember.get(member.id) || [];
                        const accentVar = getStatusAccentCssVar(status);

                        return (
                            <Paper
                                key={member.id}
                                p="sm"
                                withBorder
                                style={{
                                    backgroundColor: accentVar ? `color-mix(in srgb, ${accentVar} 10%, transparent)` : undefined,
                                    borderColor: accentVar ? `color-mix(in srgb, ${accentVar} 35%, transparent)` : undefined,
                                    boxShadow: justUpdatedId === member.id ? '0 0 0 2px var(--mantine-color-brand-filled)' : undefined,
                                }}
                            >
                                <Stack gap="xs">
                                    <Group justify="space-between" align="center" wrap="nowrap" gap="xs">
                                        <Group gap="xs" wrap="nowrap" style={{ minWidth: 0 }}>
                                            <Text size="sm" fw={600} truncate>
                                                {member.name}
                                            </Text>
                                            {status === 'home' && (
                                                <Badge
                                                    size="xs"
                                                    color="success"
                                                    leftSection={<Home size={10} />}
                                                    style={{ flexShrink: 0 }}
                                                >
                                                    Thuis
                                                </Badge>
                                            )}
                                        </Group>
                                        <Button
                                            type="button"
                                            size="compact-xs"
                                            onClick={() => toggleDetails(member.id)}
                                            rightSection={
                                                <ChevronDown
                                                    size={12}
                                                    style={{
                                                        transform: detailsExpanded ? 'rotate(180deg)' : undefined,
                                                        transition: 'transform 150ms ease',
                                                    }}
                                                />
                                            }
                                        >
                                            Details{notes.length > 0 ? ` · ${notes.length}` : ''}
                                        </Button>
                                    </Group>

                                    <Group gap={6} wrap="wrap">
                                        {STATUS_OPTIONS.map(opt => (
                                            <Button
                                                key={opt.value}
                                                type="button"
                                                size="compact-xs"
                                                variant={status === opt.value ? 'filled' : 'default'}
                                                disabled={isPending}
                                                leftSection={<opt.icon size={12} />}
                                                onClick={() => { void handleSetStatus(member, opt.value); }}
                                            >
                                                {opt.label}
                                            </Button>
                                        ))}
                                        {status === 'went_home' && (
                                            <Button
                                                type="button"
                                                size="compact-xs"
                                                color="success"
                                                disabled={isPending}
                                                leftSection={<Home size={12} />}
                                                onClick={() => { void handleSetStatus(member, 'home'); }}
                                            >
                                                Thuis
                                            </Button>
                                        )}
                                    </Group>

                                    {detailsExpanded && (
                                        <>
                                            <Divider />
                                            <Stack gap="sm">
                                                {status !== 'not_reported' && statusAt && (
                                                    <Group gap="xs" align="center">
                                                        {isEditingTime ? (
                                                            <>
                                                                <TimeInput
                                                                    size="xs"
                                                                    value={editingTimeValue}
                                                                    onChange={e => setEditingTimeValue(e.currentTarget.value)}
                                                                />
                                                                <Button
                                                                    type="button"
                                                                    size="compact-xs"
                                                                    disabled={isPending}
                                                                    onClick={() => { void handleSaveTime(member); }}
                                                                >
                                                                    Opslaan
                                                                </Button>
                                                                <Button
                                                                    type="button"
                                                                    size="compact-xs"
                                                                    onClick={() => setEditingTimeMemberId(null)}
                                                                >
                                                                    Annuleren
                                                                </Button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Text size="xs" c="dimmed">
                                                                    {getStatusSinceLabel(status)} {formatTime(statusAt)}
                                                                </Text>
                                                                <ActionIcon
                                                                    type="button"
                                                                    size="xs"
                                                                    onClick={() => startEditTime(member)}
                                                                    title="Tijd aanpassen"
                                                                    aria-label="Tijd aanpassen"
                                                                >
                                                                    <Pencil size={12} />
                                                                </ActionIcon>
                                                            </>
                                                        )}
                                                    </Group>
                                                )}

                                                <Stack gap="xs">
                                                    <Group gap={6}>
                                                        <MessageSquarePlus size={14} />
                                                        <Text size="xs" fw={600}>
                                                            Notities
                                                        </Text>
                                                    </Group>
                                                    {loadingNotesId === member.id ? (
                                                        <Center py="sm">
                                                            <Loader size="xs" />
                                                        </Center>
                                                    ) : (
                                                        <Stack gap="xs">
                                                            {notes.length === 0 ? (
                                                                <Text size="xs" c="dimmed">
                                                                    Nog geen notities.
                                                                </Text>
                                                            ) : (
                                                                notes.map(note => (
                                                                    <Paper key={note.id} p="xs" withBorder>
                                                                        <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                                                                            {note.note}
                                                                        </Text>
                                                                        <Group justify="space-between" mt={4}>
                                                                            <Text size="xs" c="dimmed">
                                                                                {formatDate(note.created_at, 'd MMMM yyyy HH:mm')}{note.author_name ? ` · ${note.author_name}` : ''}
                                                                            </Text>
                                                                            <Button
                                                                                type="button"
                                                                                size="compact-xs"
                                                                                color="error"
                                                                                onClick={() => { void handleDeleteNote(member.id, note.id); }}
                                                                            >
                                                                                Verwijderen
                                                                            </Button>
                                                                        </Group>
                                                                    </Paper>
                                                                ))
                                                            )}
                                                            <Group gap="xs" wrap="nowrap">
                                                                <TextInput
                                                                    size="xs"
                                                                    value={newNoteByMember.get(member.id) || ''}
                                                                    onChange={e => {
                                                                        const val = e.currentTarget.value;
                                                                        setNewNoteByMember(prev => new Map(prev).set(member.id, val));
                                                                    }}
                                                                    onKeyDown={e => { if (e.key === 'Enter') void handleAddNote(member.id); }}
                                                                    placeholder="Notitie toevoegen..."
                                                                    style={{ flex: 1 }}
                                                                />
                                                                <Button
                                                                    type="button"
                                                                    size="xs"
                                                                    disabled={!(newNoteByMember.get(member.id) || '').trim() || addingNoteId === member.id}
                                                                    loading={addingNoteId === member.id}
                                                                    onClick={() => { void handleAddNote(member.id); }}
                                                                >
                                                                    Toevoegen
                                                                </Button>
                                                            </Group>
                                                        </Stack>
                                                    )}
                                                </Stack>

                                                {isCrew && (
                                                    <Stack gap="xs">
                                                        <Group gap={6}>
                                                            <History size={14} />
                                                            <Text size="xs" fw={600}>
                                                                Logboek
                                                            </Text>
                                                        </Group>
                                                        {loadingLogId === member.id ? (
                                                            <Center py="sm">
                                                                <Loader size="xs" />
                                                            </Center>
                                                        ) : (() => {
                                                            const log = logByMember.get(`${member.id}:${selectedDate}`) || [];
                                                            return log.length === 0 ? (
                                                                <Text size="xs" c="dimmed">
                                                                    Nog geen wijzigingen op deze dag.
                                                                </Text>
                                                            ) : (
                                                                <Stack gap={4}>
                                                                    {log.map(entry => (
                                                                        <Group key={entry.id} justify="space-between" gap="xs">
                                                                            <Text size="xs" fw={600}>
                                                                                {getStatusLabel(entry.status)}
                                                                            </Text>
                                                                            <Text size="xs" c="dimmed">
                                                                                {entry.status_at ? formatTime(entry.status_at) : '-'} · {entry.author_name || 'onbekend'}
                                                                            </Text>
                                                                        </Group>
                                                                    ))}
                                                                </Stack>
                                                            );
                                                        })()}
                                                    </Stack>
                                                )}

                                                <Divider />
                                                <Box>
                                                    <Button
                                                        type="button"
                                                        size="compact-xs"
                                                        color="error"
                                                        disabled={isPending}
                                                        loading={isPending && !isEditingTime}
                                                        leftSection={<Trash2 size={14} />}
                                                        onClick={() => { void handleRemoveMember(member.id, member.name); }}
                                                    >
                                                        Kiddo verwijderen
                                                    </Button>
                                                </Box>
                                            </Stack>
                                        </>
                                    )}
                                </Stack>
                            </Paper>
                        );
                    })}
                </Stack>
            )}
        </Stack>
    );
}
