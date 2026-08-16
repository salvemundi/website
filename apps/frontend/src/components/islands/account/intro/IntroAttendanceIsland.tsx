'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Trash2, Check, Home, LogOut, MoonStar, HelpCircle, Loader2, Pencil, MessageSquarePlus, ChevronDown, History, Search, X } from 'lucide-react';
import type { IntroGroupWithDetails, IntroGroupMemberWithAttendance, IntroGroupAttendanceStatus, IntroGroupMemberNoteWithAuthor, IntroGroupAttendanceLogWithAuthor } from '@salvemundi/validations/schema/intro.zod';
import {
    getGroupAttendanceForDate,
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

const STATUS_SINCE_LABEL: Record<IntroGroupAttendanceStatus, string> = {
    not_reported: '',
    present: 'Aanwezig sinds',
    went_home: 'Onderweg sinds',
    home: 'Thuis sinds',
    staying_out: 'Buiten sinds'
};

const STATUS_LABEL: Record<IntroGroupAttendanceStatus, string> = {
    not_reported: 'Niet gemeld',
    present: 'Aanwezig',
    went_home: 'Onderweg naar huis',
    home: 'Thuis',
    staying_out: 'Blijft na 22:00'
};

const STATUS_CARD_STYLE: Record<IntroGroupAttendanceStatus, string> = {
    not_reported: 'bg-(--bg-card) border-(--border-color)',
    present: 'bg-sky-500/10 border-sky-500/30',
    went_home: 'bg-amber-500/10 border-amber-500/30',
    home: 'bg-emerald-500/10 border-emerald-500/30',
    staying_out: 'bg-purple-500/10 border-purple-500/30'
};

const STATUS_ICON: Record<IntroGroupAttendanceStatus, typeof HelpCircle> = {
    not_reported: HelpCircle,
    present: Check,
    went_home: LogOut,
    home: Home,
    staying_out: MoonStar
};

const STATUS_BADGE_STYLE: Record<IntroGroupAttendanceStatus, string> = {
    not_reported: 'bg-(--bg-soft) text-(--text-muted)',
    present: 'bg-sky-500/15 text-sky-600 dark:text-sky-400',
    went_home: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
    home: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
    staying_out: 'bg-purple-500/15 text-purple-600 dark:text-purple-400'
};

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

    const [editingTimeMemberId, setEditingTimeMemberId] = useState<number | null>(null);
    const [editingTimeValue, setEditingTimeValue] = useState('');

    const [expandedDetailsIds, setExpandedDetailsIds] = useState<number[]>([]);

    const [notesByMember, setNotesByMember] = useState<Map<number, IntroGroupMemberNoteWithAuthor[]>>(new Map());
    const [loadingNotesId, setLoadingNotesId] = useState<number | null>(null);
    const [newNoteByMember, setNewNoteByMember] = useState<Map<number, string>>(new Map());
    const [addingNoteId, setAddingNoteId] = useState<number | null>(null);

    const [logByMember, setLogByMember] = useState<Map<string, IntroGroupAttendanceLogWithAuthor[]>>(new Map());
    const [loadingLogId, setLoadingLogId] = useState<number | null>(null);

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
            <div className="text-center py-16 text-(--text-muted)">
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
        } else {
            showToast(res.error || 'Toevoegen mislukt', 'error');
        }
        setAddingMember(false);
    };

    const handleRemoveMember = async (memberId: number, name: string) => {
        if (!confirm(`"${name}" verwijderen uit dit groepje?`)) return;
        setPendingMemberId(memberId);
        const res = await removeGroupMember(memberId);
        if (res.success) {
            setMembers(prev => prev.filter(m => m.id !== memberId));
            showToast('Verwijderd', 'success');
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
        setPendingMemberId(member.id);
        const res = await setMemberStatus(member.id, selectedDate, status);
        if (res.success) {
            await loadAttendance(selectedGroupId, selectedDate);
            invalidateLog(member.id);
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
        if (res.success) {
            await loadAttendance(selectedGroupId, selectedDate);
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
            {groups.length > 1 && (
                <div className="mb-4">
                    <p className="text-xs font-semibold text-(--text-muted) uppercase tracking-wide mb-2">Kies een groepje</p>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                        {groups.map(g => (
                            <button
                                key={g.id}
                                onClick={() => setSelectedGroupId(g.id)}
                                className={`form-button shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${selectedGroupId === g.id ? 'bg-theme-purple text-white shadow-md' : 'bg-(--bg-card) border border-(--border-color) text-(--text-muted) hover:text-(--text-main)'}`}
                            >
                                {g.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {selectedGroup && (
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-(--text-muted) uppercase tracking-wide">Je bekijkt</span>
                </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
                {selectedGroup && (
                    <h2 className="text-xl font-bold text-theme-purple">{selectedGroup.name}</h2>
                )}
                <input
                    type="date"
                    value={selectedDate}
                    onChange={e => setSelectedDate(e.target.value)}
                    className="form-input sm:ml-auto px-4 py-2.5 rounded-xl bg-(--bg-card) border border-(--border-color) text-(--text-main) text-sm font-semibold outline-none focus:ring-2 focus:ring-theme-purple w-full sm:w-auto"
                />
            </div>

            {members.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 mb-4">
                    {STATUS_ORDER.filter(s => (statusCounts.get(s) ?? 0) > 0).map(s => {
                        const Icon = STATUS_ICON[s];
                        const isActive = statusFilter === s;
                        return (
                            <button
                                key={s}
                                onClick={() => setStatusFilter(prev => prev === s ? null : s)}
                                className={`form-button flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold transition-all ${STATUS_BADGE_STYLE[s]} ${isActive ? 'ring-2 ring-offset-1 ring-theme-purple ring-offset-(--bg-main)' : 'opacity-80 hover:opacity-100'}`}
                            >
                                <Icon className="h-3 w-3" />
                                {statusCounts.get(s)} {STATUS_LABEL[s]}
                            </button>
                        );
                    })}
                    {statusFilter && (
                        <button
                            onClick={() => setStatusFilter(null)}
                            className="form-button flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold text-(--text-muted) hover:text-(--text-main) transition-colors"
                        >
                            <X className="h-3 w-3" />
                            Filter wissen
                        </button>
                    )}
                </div>
            )}

            <div className="flex items-center gap-3 px-4 py-2.5 mb-3 rounded-xl bg-(--bg-card) border border-(--border-color) focus-within:ring-2 focus-within:ring-theme-purple transition-all">
                <Search className="h-4 w-4 shrink-0 text-(--text-muted)" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Zoek op naam..."
                    className="form-input bg-transparent border-none p-0 w-full text-(--text-main) text-sm font-semibold outline-none placeholder:text-(--text-muted)/50"
                />
            </div>

            {showAddInput ? (
                <div className="flex items-stretch gap-2 mb-6">
                    <input
                        type="text"
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') void handleAddMember(); }}
                        placeholder="Naam van kiddo..."
                        autoFocus
                        className="form-input flex-1 px-4 py-3 rounded-xl bg-(--bg-card) border border-(--border-color) text-(--text-main) text-sm font-semibold outline-none focus:ring-2 focus:ring-theme-purple placeholder:text-(--text-muted)/50"
                    />
                    <button
                        onClick={() => { void handleAddMember(); }}
                        disabled={!newName.trim() || addingMember}
                        className="form-button shrink-0 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-theme-purple text-white text-sm font-semibold disabled:opacity-50 hover:opacity-90 transition-all active:scale-95"
                        title="Toevoegen"
                    >
                        {addingMember ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    </button>
                    <button
                        onClick={() => { setShowAddInput(false); setNewName(''); }}
                        className="form-button shrink-0 flex items-center justify-center p-3 rounded-xl text-(--text-muted) hover:text-(--text-main) bg-(--bg-card) border border-(--border-color) transition-colors"
                        title="Annuleren"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            ) : (
                <button
                    onClick={() => setShowAddInput(true)}
                    className="form-button flex items-center justify-center gap-2 px-4 py-3 mb-6 rounded-xl bg-theme-purple text-white text-sm font-semibold hover:opacity-90 transition-all active:scale-95 w-full sm:w-auto"
                >
                    <Plus className="h-4 w-4" />
                    Kiddo toevoegen
                </button>
            )}

            {loading ? (
                <div className="flex justify-center py-16">
                    <Loader2 className="h-6 w-6 animate-spin text-theme-purple" />
                </div>
            ) : members.length === 0 ? (
                <div className="text-center py-16 text-(--text-muted)">
                    <p className="font-semibold">Nog geen kiddos in dit groepje.</p>
                </div>
            ) : filteredMembers.length === 0 ? (
                <div className="text-center py-16 text-(--text-muted)">
                    <p className="font-semibold">
                        {searchQuery.trim() && statusFilter
                            ? <>Geen kiddo gevonden voor &quot;{searchQuery}&quot; met status &quot;{STATUS_LABEL[statusFilter]}&quot;.</>
                            : searchQuery.trim()
                                ? <>Geen kiddo gevonden voor &quot;{searchQuery}&quot;.</>
                                : <>Geen kiddo met status &quot;{statusFilter ? STATUS_LABEL[statusFilter] : ''}&quot;.</>}
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
                            <div key={member.id} className={`border rounded-xl p-2.5 transition-colors ${STATUS_CARD_STYLE[status]}`}>
                                <div className="flex items-center justify-between gap-2 mb-1.5">
                                    <span className="font-semibold text-sm text-(--text-main) truncate">{member.name}</span>
                                    <button
                                        onClick={() => { void handleRemoveMember(member.id, member.name); }}
                                        disabled={isPending}
                                        className="form-button shrink-0 p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                                        title="Verwijderen"
                                    >
                                        {isPending && !isEditingTime ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                                    </button>
                                </div>

                                <div className="flex flex-wrap gap-1">
                                    {STATUS_OPTIONS.map(opt => (
                                        <button
                                            key={opt.value}
                                            onClick={() => { void handleSetStatus(member, opt.value); }}
                                            disabled={isPending}
                                            className={`form-button flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-semibold transition-all disabled:opacity-50 ${status === opt.value ? 'bg-theme-purple text-white' : 'bg-(--bg-soft) text-(--text-muted) border border-(--border-color) hover:text-(--text-main)'}`}
                                        >
                                            <opt.icon className="h-3 w-3" />
                                            {opt.label}
                                        </button>
                                    ))}
                                    {status === 'went_home' && (
                                        <button
                                            onClick={() => { void handleSetStatus(member, 'home'); }}
                                            disabled={isPending}
                                            className="form-button flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-semibold transition-all disabled:opacity-50 bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 hover:bg-emerald-500/20"
                                        >
                                            <Home className="h-3 w-3" />
                                            Thuis
                                        </button>
                                    )}
                                </div>

                                <button
                                    onClick={() => toggleDetails(member.id)}
                                    className="form-button flex items-center gap-1 text-[11px] font-semibold text-(--text-muted) hover:text-theme-purple transition-colors mt-1.5"
                                >
                                    <ChevronDown className={`h-3 w-3 transition-transform ${detailsExpanded ? 'rotate-180' : ''}`} />
                                    Details
                                    {notes.length > 0 && ` · ${notes.length} notitie${notes.length === 1 ? '' : 's'}`}
                                </button>

                                {detailsExpanded && (
                                    <div className="mt-2 pt-2 border-t border-(--border-color) space-y-3">
                                        {status !== 'not_reported' && statusAt && (
                                            <div className="flex items-center gap-2 text-xs text-(--text-muted)">
                                                {isEditingTime ? (
                                                    <>
                                                        <input
                                                            type="time"
                                                            value={editingTimeValue}
                                                            onChange={e => setEditingTimeValue(e.target.value)}
                                                            className="form-input px-2 py-1 rounded-lg bg-(--bg-soft) border border-(--border-color) text-(--text-main) text-xs font-semibold outline-none focus:ring-2 focus:ring-theme-purple"
                                                        />
                                                        <button
                                                            onClick={() => { void handleSaveTime(member); }}
                                                            disabled={isPending}
                                                            className="form-button px-2.5 py-1 rounded-lg bg-theme-purple text-white text-xs font-semibold disabled:opacity-50"
                                                        >
                                                            Opslaan
                                                        </button>
                                                        <button
                                                            onClick={() => setEditingTimeMemberId(null)}
                                                            className="form-button px-2.5 py-1 rounded-lg text-(--text-muted) text-xs font-semibold hover:text-(--text-main)"
                                                        >
                                                            Annuleren
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span>{STATUS_SINCE_LABEL[status]} {formatTime(statusAt)}</span>
                                                        <button
                                                            onClick={() => startEditTime(member)}
                                                            className="form-button p-1 rounded text-(--text-muted) hover:text-theme-purple transition-colors"
                                                            title="Tijd aanpassen"
                                                        >
                                                            <Pencil className="h-3 w-3" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        )}

                                        <div>
                                            <p className="flex items-center gap-1.5 text-xs font-semibold text-(--text-main) mb-2">
                                                <MessageSquarePlus className="h-3.5 w-3.5" />
                                                Notities
                                            </p>
                                            {loadingNotesId === member.id ? (
                                                <div className="flex justify-center py-4">
                                                    <Loader2 className="h-4 w-4 animate-spin text-theme-purple" />
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    {notes.length === 0 ? (
                                                        <p className="text-xs text-(--text-muted) opacity-60">Nog geen notities.</p>
                                                    ) : (
                                                        notes.map(note => (
                                                            <div key={note.id} className="bg-(--bg-soft) rounded-lg p-3">
                                                                <p className="text-sm text-(--text-main) whitespace-pre-wrap">{note.note}</p>
                                                                <div className="flex items-center justify-between mt-1.5">
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
                                                            className="form-input flex-1 px-3 py-2 rounded-lg bg-(--bg-soft) border border-(--border-color) text-(--text-main) text-xs font-medium outline-none focus:ring-2 focus:ring-theme-purple placeholder:text-(--text-muted)/50"
                                                        />
                                                        <button
                                                            onClick={() => { void handleAddNote(member.id); }}
                                                            disabled={!(newNoteByMember.get(member.id) || '').trim() || addingNoteId === member.id}
                                                            className="form-button shrink-0 px-3 py-2 rounded-lg bg-theme-purple text-white text-xs font-semibold disabled:opacity-50"
                                                        >
                                                            {addingNoteId === member.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Toevoegen'}
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {isCrew && (
                                            <div>
                                                <p className="flex items-center gap-1.5 text-xs font-semibold text-(--text-main) mb-2">
                                                    <History className="h-3.5 w-3.5" />
                                                    Logboek
                                                </p>
                                                {loadingLogId === member.id ? (
                                                    <div className="flex justify-center py-4">
                                                        <Loader2 className="h-4 w-4 animate-spin text-theme-purple" />
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
                                                                        <span className="font-semibold text-(--text-main)">{STATUS_LABEL[entry.status]}</span>
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
