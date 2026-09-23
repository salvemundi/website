'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Trash2, Check, Home, LogOut, MoonStar, HelpCircle, Loader2, Pencil, MessageSquarePlus, ChevronDown, History, Search, X } from 'lucide-react';
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
import AdminToast from '@/components/ui/admin/AdminToast';
import { useAdminToast } from '@/hooks/use-admin-toast';

interface Props {
    groups: IntroGroupWithDetails[];
    isCrew: boolean;
    initialGroupId?: number | null;
}

const todayIso = () => new Date().toISOString().split('T')[0];

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

function getStatusCardStyle(status: IntroGroupAttendanceStatus): string {
    switch (status) {
        case 'present': return 'bg-sky-500/10 border-sky-500/30';
        case 'went_home': return 'bg-amber-500/10 border-amber-500/30';
        case 'home': return 'bg-emerald-500/10 border-emerald-500/30';
        case 'staying_out': return 'bg-purple-500/10 border-purple-500/30';
        default: return 'bg-(--bg-card) border-(--border-color)';
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

function getStatusBadgeStyle(status: IntroGroupAttendanceStatus): string {
    switch (status) {
        case 'present': return 'bg-sky-500/15 text-sky-600 dark:text-sky-400';
        case 'went_home': return 'bg-amber-500/15 text-amber-600 dark:text-amber-400';
        case 'home': return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400';
        case 'staying_out': return 'bg-purple-500/15 text-purple-600 dark:text-purple-400';
        default: return 'bg-(--bg-soft) text-(--text-muted)';
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
    const { toast, showToast, hideToast } = useAdminToast();
    const initialValid = initialGroupId !== null && initialGroupId !== undefined && groups.some(g => g.id === initialGroupId);
    const [selectedGroupId, setSelectedGroupId] = useState<number | null>(initialValid ? (initialGroupId as number) : (groups[0]?.id ?? null));
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isCrew, selectedDate]);

    const loadAttendance = useCallback(async (groupId: number, date: string) => {
        setLoading(true);
        try {
            const data = await getGroupAttendanceForDate(groupId, date);
            setMembers(data);
        } catch {
            showToast('Kon aanwezigheid niet ophalen', 'error');
        }
        setLoading(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (selectedGroupId !== null) {
            void loadAttendance(selectedGroupId, selectedDate);
        }
    }, [selectedGroupId, selectedDate, loadAttendance]);

    if (groups.length === 0 || selectedGroupId === null) {
        return (
            <div className="py-16 text-center text-(--text-muted)">
                <p className="font-semibold">Je bent nog niet gekoppeld aan een groepje.</p>
            </div>
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
        <div>
            {isCrew && (
                <div className="mb-4 rounded-xl border border-(--border-color) bg-(--bg-card) p-3">
                    <p className="mb-2 text-xs font-semibold tracking-wide text-(--text-muted) uppercase">
                        Totaal alle groepjes &middot; {formatDate(selectedDate, 'd MMMM')}
                    </p>
                    {loadingSummary && !totalSummary ? (
                        <div className="flex justify-center py-2">
                            <Loader2 className="size-4 animate-spin text-theme-purple" />
                        </div>
                    ) : totalSummary && (
                        <div className="flex flex-wrap items-center gap-1.5">
                            <span className="mr-1 text-xs font-bold text-(--text-main)">
                                {STATUS_ORDER.reduce((sum, s) => sum + getSummaryCount(totalSummary, s), 0)} kiddos
                            </span>
                            {STATUS_ORDER.filter(s => getSummaryCount(totalSummary, s) > 0).map(s => {
                                const Icon = getStatusIcon(s);
                                return (
                                    <span
                                        key={s}
                                        className={`flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold ${getStatusBadgeStyle(s)}`}
                                    >
                                        <Icon className="size-3" />
                                        {getSummaryCount(totalSummary, s)} {getStatusLabel(s)}
                                    </span>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {groups.length > 1 && (
                <div className="mb-4">
                    <p className="mb-2 text-xs font-semibold tracking-wide text-(--text-muted) uppercase">Kies een groepje</p>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                        {groups.map(g => (
                            <button
                                key={g.id}
                                onClick={() => setSelectedGroupId(g.id)}
                                className={`form-button shrink-0 rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap transition-all ${selectedGroupId === g.id ? 'bg-theme-purple text-white shadow-md' : 'border border-(--border-color) bg-(--bg-card) text-(--text-muted) hover:text-(--text-main)'}`}
                            >
                                {g.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {selectedGroup && (
                <div className="mb-1 flex items-center gap-2">
                    <span className="text-xs font-semibold tracking-wide text-(--text-muted) uppercase">Je bekijkt</span>
                </div>
            )}

            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                {selectedGroup && (
                    <h2 className="text-xl font-bold text-theme-purple">{selectedGroup.name}</h2>
                )}
                <input
                    type="date"
                    value={selectedDate}
                    onChange={e => setSelectedDate(e.target.value)}
                    className="form-input w-full rounded-xl border border-(--border-color) bg-(--bg-card) px-4 py-2.5 text-sm font-semibold text-(--text-main) outline-none focus:ring-2 focus:ring-theme-purple sm:ml-auto sm:w-auto"
                />
            </div>

            {members.length > 0 && (
                <div className="mb-4 flex flex-wrap items-center gap-1.5">
                    {STATUS_ORDER.filter(s => (statusCounts.get(s) ?? 0) > 0).map(s => {
                        const Icon = getStatusIcon(s);
                        const isActive = statusFilter === s;
                        return (
                            <button
                                key={s}
                                onClick={() => setStatusFilter(prev => prev === s ? null : s)}
                                className={`form-button flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold transition-all active:scale-90 ${getStatusBadgeStyle(s)} ${isActive ? 'scale-105 ring-2 ring-theme-purple ring-offset-1 ring-offset-(--bg-main)' : 'opacity-80 hover:opacity-100'}`}
                            >
                                <Icon className="size-3" />
                                {statusCounts.get(s)} {getStatusLabel(s)}
                            </button>
                        );
                    })}
                    {statusFilter && (
                        <button
                            onClick={() => setStatusFilter(null)}
                            className="form-button flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold text-(--text-muted) transition-colors hover:text-(--text-main)"
                        >
                            <X className="size-3" />
                            Filter wissen
                        </button>
                    )}
                </div>
            )}

            <div className="mb-3 flex items-center gap-3 rounded-xl border border-(--border-color) bg-(--bg-card) px-4 py-2.5 transition-all focus-within:ring-2 focus-within:ring-theme-purple">
                <Search className="size-4 shrink-0 text-(--text-muted)" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Zoek op naam..."
                    className="form-input w-full border-none bg-transparent p-0 text-sm font-semibold text-(--text-main) outline-none placeholder:text-(--text-muted)/50"
                />
            </div>

            {showAddInput ? (
                <div className="mb-6 flex items-stretch gap-2">
                    <input
                        type="text"
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') void handleAddMember(); }}
                        placeholder="Naam van kiddo..."
                        autoFocus
                        className="form-input flex-1 rounded-xl border border-(--border-color) bg-(--bg-card) px-4 py-3 text-sm font-semibold text-(--text-main) outline-none placeholder:text-(--text-muted)/50 focus:ring-2 focus:ring-theme-purple"
                    />
                    <button
                        onClick={() => { void handleAddMember(); }}
                        disabled={!newName.trim() || addingMember}
                        className="form-button flex shrink-0 items-center justify-center gap-2 rounded-xl bg-theme-purple px-4 py-3 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
                        title="Toevoegen"
                    >
                        {addingMember ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                    </button>
                    <button
                        onClick={() => { setShowAddInput(false); setNewName(''); }}
                        className="form-button flex shrink-0 items-center justify-center rounded-xl border border-(--border-color) bg-(--bg-card) p-3 text-(--text-muted) transition-colors hover:text-(--text-main)"
                        title="Annuleren"
                    >
                        <X className="size-4" />
                    </button>
                </div>
            ) : (
                <button
                    onClick={() => setShowAddInput(true)}
                    className="mb-6 form-button flex w-full items-center justify-center gap-2 rounded-xl bg-theme-purple px-4 py-3 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95 sm:w-auto"
                >
                    <Plus className="size-4" />
                    Kiddo toevoegen
                </button>
            )}

            {loading ? (
                <div className="flex justify-center py-16">
                    <Loader2 className="size-6 animate-spin text-theme-purple" />
                </div>
            ) : members.length === 0 ? (
                <div className="py-16 text-center text-(--text-muted)">
                    <p className="font-semibold">Nog geen kiddos in dit groepje.</p>
                </div>
            ) : filteredMembers.length === 0 ? (
                <div className="py-16 text-center text-(--text-muted)">
                    <p className="font-semibold">
                        {searchQuery.trim() && statusFilter
                            ? <>Geen kiddo gevonden voor &quot;{searchQuery}&quot; met status &quot;{getStatusLabel(statusFilter)}&quot;.</>
                            : searchQuery.trim()
                                ? <>Geen kiddo gevonden voor &quot;{searchQuery}&quot;.</>
                                : <>Geen kiddo met status &quot;{statusFilter ? getStatusLabel(statusFilter) : ''}&quot;.</>}
                    </p>
                </div>
            ) : (
                <div className="grid gap-2">
                    {filteredMembers.map(member => {
                        const isPending = pendingMemberId === member.id;
                        const status = member.attendance?.status ?? 'not_reported';
                        const statusAt = member.attendance?.status_at;
                        const isEditingTime = editingTimeMemberId === member.id;
                        const detailsExpanded = expandedDetailsIds.includes(member.id);
                        const notes = notesByMember.get(member.id) || [];

                        return (
                            <div
                                key={member.id}
                                className={`fade-in rounded-xl border p-2.5 transition-all duration-300 ${getStatusCardStyle(status)} ${justUpdatedId === member.id ? 'scale-1.02 shadow-md ring-2 ring-theme-purple/50' : 'scale-100'}`}
                            >
                                <div className="mb-1.5 flex items-center justify-between gap-2">
                                    <div className="flex min-w-0 items-center gap-1.5">
                                        <span className="truncate text-sm font-semibold text-(--text-main)">{member.name}</span>
                                        {status === 'home' && (
                                            <span className="fade-in flex shrink-0 items-center gap-1 rounded-full bg-emerald-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                                                <Home className="size-2.5" />
                                                Thuis
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => toggleDetails(member.id)}
                                        className="form-button flex shrink-0 items-center gap-1 text-[11px] font-semibold text-(--text-muted) transition-colors hover:text-theme-purple"
                                    >
                                        Details
                                        {notes.length > 0 && ` · ${notes.length}`}
                                        <ChevronDown className={`size-3 transition-transform ${detailsExpanded ? 'rotate-180' : ''}`} />
                                    </button>
                                </div>

                                <div className="flex flex-wrap gap-1">
                                    {STATUS_OPTIONS.map(opt => (
                                        <button
                                            key={opt.value}
                                            onClick={() => { void handleSetStatus(member, opt.value); }}
                                            disabled={isPending}
                                            className={`form-button flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold transition-all duration-200 active:scale-90 disabled:opacity-50 ${status === opt.value ? 'scale-105 bg-theme-purple text-white shadow-sm' : 'border border-(--border-color) bg-(--bg-soft) text-(--text-muted) hover:text-(--text-main)'}`}
                                        >
                                            <opt.icon className="size-3" />
                                            {opt.label}
                                        </button>
                                    ))}
                                    {status === 'went_home' && (
                                        <button
                                            onClick={() => { void handleSetStatus(member, 'home'); }}
                                            disabled={isPending}
                                            className="fade-in form-button flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2 py-1.5 text-[11px] font-semibold text-emerald-500 transition-all hover:bg-emerald-500/20 active:scale-90 disabled:opacity-50"
                                        >
                                            <Home className="size-3" />
                                            Thuis
                                        </button>
                                    )}
                                </div>

                                {detailsExpanded && (
                                    <div className="fade-in mt-2 space-y-3 border-t border-(--border-color) pt-2">
                                        {status !== 'not_reported' && statusAt && (
                                            <div className="flex items-center gap-2 text-xs text-(--text-muted)">
                                                {isEditingTime ? (
                                                    <>
                                                        <input
                                                            type="time"
                                                            value={editingTimeValue}
                                                            onChange={e => setEditingTimeValue(e.target.value)}
                                                            className="form-input rounded-lg border border-(--border-color) bg-(--bg-soft) px-2 py-1 text-xs font-semibold text-(--text-main) outline-none focus:ring-2 focus:ring-theme-purple"
                                                        />
                                                        <button
                                                            onClick={() => { void handleSaveTime(member); }}
                                                            disabled={isPending}
                                                            className="form-button rounded-lg bg-theme-purple px-2.5 py-1 text-xs font-semibold text-white disabled:opacity-50"
                                                        >
                                                            Opslaan
                                                        </button>
                                                        <button
                                                            onClick={() => setEditingTimeMemberId(null)}
                                                            className="form-button rounded-lg px-2.5 py-1 text-xs font-semibold text-(--text-muted) hover:text-(--text-main)"
                                                        >
                                                            Annuleren
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span>{getStatusSinceLabel(status)} {formatTime(statusAt)}</span>
                                                        <button
                                                            onClick={() => startEditTime(member)}
                                                            className="form-button rounded p-1 text-(--text-muted) transition-colors hover:text-theme-purple"
                                                            title="Tijd aanpassen"
                                                        >
                                                            <Pencil className="size-3" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        )}

                                        <div>
                                            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-(--text-main)">
                                                <MessageSquarePlus className="size-3.5" />
                                                Notities
                                            </p>
                                            {loadingNotesId === member.id ? (
                                                <div className="flex justify-center py-4">
                                                    <Loader2 className="size-4 animate-spin text-theme-purple" />
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    {notes.length === 0 ? (
                                                        <p className="text-xs text-(--text-muted) opacity-60">Nog geen notities.</p>
                                                    ) : (
                                                        notes.map(note => (
                                                            <div key={note.id} className="rounded-lg bg-(--bg-soft) p-3">
                                                                <p className="text-sm whitespace-pre-wrap text-(--text-main)">{note.note}</p>
                                                                <div className="mt-1.5 flex items-center justify-between">
                                                                    <span className="text-[11px] text-(--text-muted) opacity-70">
                                                                        {formatDate(note.created_at, 'd MMMM yyyy HH:mm')}{note.author_name ? ` · ${note.author_name}` : ''}
                                                                    </span>
                                                                    <button
                                                                        onClick={() => { void handleDeleteNote(member.id, note.id); }}
                                                                        className="form-button text-[11px] text-red-500 hover:underline"
                                                                    >
                                                                        Verwijderen
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))
                                                    )}
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="text"
                                                            value={newNoteByMember.get(member.id) || ''}
                                                            onChange={e => setNewNoteByMember(prev => new Map(prev).set(member.id, e.target.value))}
                                                            onKeyDown={e => { if (e.key === 'Enter') void handleAddNote(member.id); }}
                                                            placeholder="Notitie toevoegen..."
                                                            className="form-input flex-1 rounded-lg border border-(--border-color) bg-(--bg-soft) px-3 py-2 text-xs font-medium text-(--text-main) outline-none placeholder:text-(--text-muted)/50 focus:ring-2 focus:ring-theme-purple"
                                                        />
                                                        <button
                                                            onClick={() => { void handleAddNote(member.id); }}
                                                            disabled={!(newNoteByMember.get(member.id) || '').trim() || addingNoteId === member.id}
                                                            className="form-button shrink-0 rounded-lg bg-theme-purple px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                                                        >
                                                            {addingNoteId === member.id ? <Loader2 className="size-3.5 animate-spin" /> : 'Toevoegen'}
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {isCrew && (
                                            <div>
                                                <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-(--text-main)">
                                                    <History className="size-3.5" />
                                                    Logboek
                                                </p>
                                                {loadingLogId === member.id ? (
                                                    <div className="flex justify-center py-4">
                                                        <Loader2 className="size-4 animate-spin text-theme-purple" />
                                                    </div>
                                                ) : (
                                                    (() => {
                                                        const log = logByMember.get(`${member.id}:${selectedDate}`) || [];
                                                        return log.length === 0 ? (
                                                            <p className="text-xs text-(--text-muted) opacity-60">Nog geen wijzigingen op deze dag.</p>
                                                        ) : (
                                                            <div className="space-y-1.5">
                                                                {log.map(entry => (
                                                                    <div key={entry.id} className="flex items-center justify-between gap-2 text-[11px] text-(--text-muted)">
                                                                        <span className="font-semibold text-(--text-main)">{getStatusLabel(entry.status)}</span>
                                                                        <span className="opacity-70">
                                                                            {entry.status_at ? formatTime(entry.status_at) : '-'} · {entry.author_name || 'onbekend'}
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        );
                                                    })()
                                                )}
                                            </div>
                                        )}

                                        <div className="border-t border-(--border-color) pt-2">
                                            <button
                                                onClick={() => { void handleRemoveMember(member.id, member.name); }}
                                                disabled={isPending}
                                                className="form-button flex items-center gap-1.5 text-[11px] font-semibold text-red-500 transition-colors hover:text-red-600 disabled:opacity-50"
                                            >
                                                {isPending && !isEditingTime ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                                                Kiddo verwijderen
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            <AdminToast toast={toast} onClose={hideToast} />
        </div>
    );
}
