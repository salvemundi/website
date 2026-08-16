'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Trash2, Check, Home, MoonStar, HelpCircle, Loader2 } from 'lucide-react';
import type { IntroGroupWithDetails, IntroGroupMemberWithAttendance, IntroGroupAttendanceStatus } from '@salvemundi/validations/schema/intro.zod';
import {
    getGroupAttendanceForDate,
    addGroupMember,
    removeGroupMember,
    markMemberPresent,
    setMemberEveningStatus
} from '@/server/actions/public/intro-attendance.actions';
import AdminToast from '@/components/ui/admin/AdminToast';
import { useAdminToast } from '@/hooks/use-admin-toast';

interface Props {
    groups: IntroGroupWithDetails[];
    isCrew: boolean;
}

const todayIso = () => new Date().toISOString().split('T')[0];

const EVENING_OPTIONS: { value: IntroGroupAttendanceStatus; label: string; icon: typeof HelpCircle }[] = [
    { value: 'unknown', label: 'Nog niet gecheckt', icon: HelpCircle },
    { value: 'went_home', label: 'Naar huis', icon: Home },
    { value: 'staying_out', label: 'Blijft na 22:00', icon: MoonStar }
];

export default function IntroAttendanceIsland({ groups }: Props) {
    const { toast, showToast, hideToast } = useAdminToast();
    const [selectedGroupId, setSelectedGroupId] = useState<number | null>(groups[0]?.id ?? null);
    const [selectedDate, setSelectedDate] = useState(todayIso());
    const [members, setMembers] = useState<IntroGroupMemberWithAttendance[]>([]);
    const [loading, setLoading] = useState(false);
    const [newName, setNewName] = useState('');
    const [addingMember, setAddingMember] = useState(false);
    const [pendingMemberId, setPendingMemberId] = useState<number | null>(null);

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

    const handleTogglePresent = async (member: IntroGroupMemberWithAttendance) => {
        const nextPresent = !(member.attendance?.present ?? false);
        setPendingMemberId(member.id);
        const res = await markMemberPresent(member.id, selectedDate, nextPresent);
        if (res.success) {
            await loadAttendance(selectedGroupId, selectedDate);
        } else {
            showToast(res.error || 'Bijwerken mislukt', 'error');
        }
        setPendingMemberId(null);
    };

    const handleSetEveningStatus = async (member: IntroGroupMemberWithAttendance, status: IntroGroupAttendanceStatus) => {
        setPendingMemberId(member.id);
        const res = await setMemberEveningStatus(member.id, selectedDate, status);
        if (res.success) {
            await loadAttendance(selectedGroupId, selectedDate);
        } else {
            showToast(res.error || 'Bijwerken mislukt', 'error');
        }
        setPendingMemberId(null);
    };

    return (
        <div>
            {groups.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1 mb-6">
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
            )}

            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
                {selectedGroup && groups.length === 1 && (
                    <h2 className="text-lg font-bold text-(--text-main)">{selectedGroup.name}</h2>
                )}
                <input
                    type="date"
                    value={selectedDate}
                    onChange={e => setSelectedDate(e.target.value)}
                    className="form-input ml-auto px-4 py-2 rounded-xl bg-(--bg-card) border border-(--border-color) text-(--text-main) text-sm font-semibold outline-none focus:ring-2 focus:ring-theme-purple"
                />
            </div>

            <div className="flex items-center gap-3 mb-6">
                <input
                    type="text"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') void handleAddMember(); }}
                    placeholder="Naam van kiddo..."
                    className="form-input flex-1 px-4 py-3 rounded-xl bg-(--bg-card) border border-(--border-color) text-(--text-main) text-sm font-semibold outline-none focus:ring-2 focus:ring-theme-purple placeholder:text-(--text-muted)/50"
                />
                <button
                    onClick={() => { void handleAddMember(); }}
                    disabled={!newName.trim() || addingMember}
                    className="form-button flex items-center gap-2 px-4 py-3 rounded-xl bg-theme-purple text-white text-sm font-semibold disabled:opacity-50 hover:opacity-90 transition-all active:scale-95"
                >
                    {addingMember ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    Toevoegen
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-16">
                    <Loader2 className="h-6 w-6 animate-spin text-theme-purple" />
                </div>
            ) : members.length === 0 ? (
                <div className="text-center py-16 text-(--text-muted)">
                    <p className="font-semibold">Nog geen kiddos in dit groepje.</p>
                </div>
            ) : (
                <div className="grid gap-3">
                    {members.map(member => {
                        const isPending = pendingMemberId === member.id;
                        const isPresent = member.attendance?.present ?? false;
                        const eveningStatus = member.attendance?.evening_status ?? 'unknown';
                        return (
                            <div key={member.id} className="bg-(--bg-card) border border-(--border-color) rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                                <div className="flex-1 flex items-center gap-3">
                                    <span className="font-semibold text-(--text-main)">{member.name}</span>
                                </div>

                                <button
                                    onClick={() => { void handleTogglePresent(member); }}
                                    disabled={isPending}
                                    className={`form-button flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 ${isPresent ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-(--bg-soft) text-(--text-muted) border border-(--border-color)'}`}
                                >
                                    <Check className="h-3.5 w-3.5" />
                                    {isPresent ? 'Aanwezig' : 'Niet gemeld'}
                                </button>

                                <div className="flex gap-1">
                                    {EVENING_OPTIONS.map(opt => (
                                        <button
                                            key={opt.value}
                                            onClick={() => { void handleSetEveningStatus(member, opt.value); }}
                                            disabled={isPending}
                                            title={opt.label}
                                            className={`form-button flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 ${eveningStatus === opt.value ? 'bg-theme-purple text-white' : 'bg-(--bg-soft) text-(--text-muted) border border-(--border-color) hover:text-(--text-main)'}`}
                                        >
                                            <opt.icon className="h-3.5 w-3.5" />
                                            <span className="hidden md:inline">{opt.label}</span>
                                        </button>
                                    ))}
                                </div>

                                <button
                                    onClick={() => { void handleRemoveMember(member.id, member.name); }}
                                    disabled={isPending}
                                    className="form-button p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                                    title="Verwijderen"
                                >
                                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            <AdminToast toast={toast} onClose={hideToast} />
        </div>
    );
}
