'use client';

import { useState, useCallback } from 'react';
import {
    Users, UserPlus, UserMinus, Shield, Mail, Info, Search,
    Loader2, RefreshCw, Settings, ExternalLink, Save, X, ChevronRight, CheckCircle,
    Award, History, ShieldAlert
} from 'lucide-react';
import type { Committee, CommitteeMember } from '@/server/actions/admin-committees.actions';
import {
    getCommittees,
    getCommitteeMembers,
    addCommitteeMember,
    removeCommitteeMember,
    toggleCommitteeLeader,
    updateCommitteeDetails,
} from '@/server/actions/admin-committees.actions';

const STANDARD_COMMITTEES = [
    'feestcommissie', 'mediacommissie', 'introcommissie', 'kascommissie',
    'ict-commissie', 'ictcommissie', 'kampcommissie', 'activiteitencommissie',
    'studiecommissie', 'reiscommissie', 'marketingcommissie',
];

const normalizeName = (name: string) =>
    name.toLowerCase().replace(/\s*(\|\||\|)\s*salve mundi/gi, '').trim();

interface Props {
    initialCommittees: Committee[];
}

export default function VerenigingManagementIsland({ initialCommittees }: Props) {
    const [committees, setCommittees] = useState<Committee[]>(initialCommittees);
    const [selected, setSelected] = useState<Committee | null>(null);
    const [members, setMembers] = useState<CommitteeMember[]>([]);

    const [searchQuery, setSearchQuery] = useState('');
    const [showAll, setShowAll] = useState(false);

    const [membersLoading, setMembersLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const [newMemberEmail, setNewMemberEmail] = useState('');
    const [addingMember, setAddingMember] = useState(false);
    const [addError, setAddError] = useState<string | null>(null);

    const [editingDetail, setEditingDetail] = useState(false);
    const [editShortDesc, setEditShortDesc] = useState('');
    const [editDesc, setEditDesc] = useState('');
    const [savingDetail, setSavingDetail] = useState(false);

    // Filtering
    const sorted = [...committees]
        .map(c => ({ ...c, isStandard: STANDARD_COMMITTEES.includes(normalizeName(c.name)) }))
        .sort((a, b) => {
            if (a.isStandard && !b.isStandard) return -1;
            if (!a.isStandard && b.isStandard) return 1;
            return a.name.localeCompare(b.name);
        });

    const filtered = sorted.filter(c => {
        if (!c.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return showAll ? true : c.isStandard;
    });

    const handleRefresh = async () => {
        setRefreshing(true);
        const fresh = await getCommittees().catch(() => committees);
        setCommittees(fresh);
        setRefreshing(false);
    };

    const handleSelectCommittee = useCallback(async (c: Committee) => {
        setSelected(c);
        setEditingDetail(false);
        setEditShortDesc(c.short_description || '');
        setEditDesc(c.description || '');
        setAddError(null);
        setNewMemberEmail('');
        setMembersLoading(true);
        const m = await getCommitteeMembers(c.id.toString()).catch(() => []);
        setMembers(m);
        setMembersLoading(false);
    }, []);

    const handleAddMember = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selected?.azure_group_id || !newMemberEmail) return;
        setAddingMember(true);
        setAddError(null);
        const res = await addCommitteeMember(selected.azure_group_id, selected.id.toString(), newMemberEmail);
        if (!res.success) {
            setAddError(res.error ?? 'Toevoegen mislukt');
        } else {
            setNewMemberEmail('');
            // Reload members after short delay to allow Azure propagation
            setTimeout(() => handleSelectCommittee(selected), 1500);
        }
        setAddingMember(false);
    };

    const handleRemoveMember = async (member: CommitteeMember) => {
        if (!selected?.azure_group_id) return;
        if (!confirm(`Weet je zeker dat je ${member.displayName} wilt verwijderen uit ${selected.name}?`)) return;
        setActionLoading(`remove-${member.entraId}`);
        const res = await removeCommitteeMember(selected.azure_group_id, member.entraId);
        if (res.success) setMembers(prev => prev.filter(m => m.entraId !== member.entraId));
        else alert(res.error ?? 'Verwijderen mislukt');
        setActionLoading(null);
    };

    const handleToggleLeader = async (member: CommitteeMember) => {
        if (!member.directusMembershipId) {
            alert('Lidmaatschapsrecord niet gevonden. Wacht even op de synchronisatie.');
            return;
        }
        setActionLoading(`leader-${member.entraId}`);
        const res = await toggleCommitteeLeader(
            member.directusMembershipId,
            member.isLeader,
            selected?.azure_group_id,
            member.entraId
        );
        if (res.success) setMembers(prev => prev.map(m => m.entraId === member.entraId ? { ...m, isLeader: !m.isLeader } : m));
        else alert(res.error ?? 'Bijwerken mislukt');
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
        } else alert(res.error ?? 'Opslaan mislukt');
        setSavingDetail(false);
    };

    const slugify = (name: string) =>
        name.toLowerCase().replace(/\s*(\|\||\|)\s*salve mundi/gi, '').trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    return (
        <div className="container mx-auto px-4 py-12 max-w-7xl">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-sm ring-1 ring-primary/20">
                            <Shield className="h-6 w-6" />
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                            Vereniging <span className="text-primary italic">Beheer</span>
                        </h1>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 font-medium ml-1">
                        Beheer commissies, leden en Azure-groepslidmaatschappen.
                    </p>
                </div>
                
                <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-bold text-sm shadow-sm ring-1 ring-slate-200 dark:ring-slate-700 hover:ring-primary hover:text-primary transition-all disabled:opacity-50"
                >
                    <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                    Gegevens Verversen
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* ── Left Sidebar: Committee Selection ── */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white dark:bg-slate-800 rounded-[2rem] shadow-sm ring-1 ring-slate-200 dark:ring-slate-700 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-700/50">
                            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                                <Users className="h-5 w-5 text-primary" />
                                Commissies
                            </h2>
                            
                            <div className="space-y-3">
                                <div className="relative group">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                                    <input
                                        type="text"
                                        placeholder="Zoek commissie..."
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border-none rounded-2xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary/20 transition-all"
                                    />
                                </div>
                                <div className="flex p-1 bg-slate-100 dark:bg-slate-900/50 rounded-xl">
                                    <button
                                        onClick={() => setShowAll(false)}
                                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${!showAll ? 'bg-white dark:bg-slate-800 text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                    >
                                        Standaard
                                    </button>
                                    <button
                                        onClick={() => setShowAll(true)}
                                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${showAll ? 'bg-white dark:bg-slate-800 text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                    >
                                        Alle Groepen
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="max-h-[500px] overflow-y-auto custom-scrollbar p-3 space-y-1">
                            {filtered.length === 0 ? (
                                <div className="py-12 text-center">
                                    <Search className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                                    <p className="text-slate-400 text-sm italic">Geen resultaten</p>
                                </div>
                            ) : (
                                filtered.map(c => (
                                    <button
                                        key={c.id}
                                        onClick={() => handleSelectCommittee(c)}
                                        className={`w-full group flex items-center justify-between p-4 rounded-2xl transition-all ${selected?.id === c.id
                                            ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                            : 'hover:bg-slate-50 dark:hover:bg-slate-700/30'}`}
                                    >
                                        <div className="text-left min-w-0">
                                            <div className={`font-bold truncate ${selected?.id === c.id ? 'text-white' : 'text-slate-700 dark:text-slate-200'}`}>
                                                {normalizeName(c.name)}
                                            </div>
                                            {c.email && (
                                                <div className={`text-[10px] truncate flex items-center gap-1 mt-0.5 ${selected?.id === c.id ? 'text-white/70' : 'text-slate-400'}`}>
                                                    <Mail className="h-2.5 w-2.5" />
                                                    {c.email}
                                                </div>
                                            )}
                                        </div>
                                        <ChevronRight className={`h-4 w-4 shrink-0 transition-transform ${selected?.id === c.id ? 'translate-x-1 text-white' : 'text-slate-300 group-hover:text-slate-500'}`} />
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Right Content: Management Area ── */}
                <div className="lg:col-span-8">
                    {!selected ? (
                        <div className="bg-white dark:bg-slate-800 rounded-[2rem] shadow-sm ring-1 ring-slate-200 dark:ring-slate-700 p-20 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 relative overflow-hidden">
                            <div className="relative z-10">
                                <div className="h-20 w-20 rounded-3xl bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center mx-auto mb-6 text-slate-200 dark:text-slate-700">
                                    <Users className="h-10 w-10" />
                                </div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Geen commissie geselecteerd</h3>
                                <p className="text-slate-500 dark:text-slate-400 font-medium max-w-xs mx-auto">
                                    Kies een commissie uit de lijst aan de linkerkant om leden en details te beheren.
                                </p>
                            </div>
                            <div className="absolute top-0 right-0 p-8 opacity-5">
                                <Shield className="h-64 w-64 rotate-12" />
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Main Info Card */}
                            <div className="bg-white dark:bg-slate-800 rounded-[2rem] shadow-sm ring-1 ring-slate-200 dark:ring-slate-700 p-8">
                                <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="h-14 w-14 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20">
                                                <Users className="h-7 w-7" />
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">
                                                    {selected.name}
                                                </h2>
                                                {selected.email && (
                                                    <a href={`mailto:${selected.email}`} className="text-primary font-bold text-sm hover:underline flex items-center gap-1 mt-1">
                                                        <Mail className="h-3.5 w-3.5" />
                                                        {selected.email}
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                        
                                        {!editingDetail && selected.short_description && (
                                            <p className="text-slate-600 dark:text-slate-300 font-medium text-sm leading-relaxed mb-4">
                                                {selected.short_description}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex gap-2">
                                        <a
                                            href={`/vereniging/commissies/${slugify(selected.name)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-900/50 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-xs ring-1 ring-slate-200 dark:ring-slate-700 hover:bg-white dark:hover:bg-slate-700 transition"
                                        >
                                            <ExternalLink className="h-3.5 w-3.5" /> Website
                                        </a>
                                        <button
                                            onClick={() => setEditingDetail(!editingDetail)}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all ${editingDetail ? 'bg-primary text-white shadow-md' : 'bg-slate-100 dark:bg-slate-900/50 text-slate-600 dark:text-slate-300 ring-1 ring-slate-200 dark:ring-slate-700 hover:bg-white dark:hover:bg-slate-700'}`}
                                        >
                                            <Settings className="h-3.5 w-3.5" /> {editingDetail ? 'Annuleren' : 'Bewerken'}
                                        </button>
                                    </div>
                                </div>

                                {editingDetail && (
                                    <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-700/50 space-y-6">
                                        <div className="grid grid-cols-1 gap-6">
                                            <div>
                                                <label className="text-xs font-black uppercase text-slate-400 tracking-widest block mb-2">Korte Beschrijving</label>
                                                <textarea
                                                    value={editShortDesc}
                                                    onChange={e => setEditShortDesc(e.target.value)}
                                                    rows={2}
                                                    className="w-full px-5 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border-none text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                                                    placeholder="Korte tekst voor previews..."
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-black uppercase text-slate-400 tracking-widest block mb-2">Inhoud (HTML ondersteund)</label>
                                                <textarea
                                                    value={editDesc}
                                                    onChange={e => setEditDesc(e.target.value)}
                                                    rows={10}
                                                    className="w-full px-5 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border-none text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary/20 transition-all font-mono"
                                                    placeholder="Schrijf hier de volledige tekst..."
                                                />
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleSaveDetail}
                                            disabled={savingDetail}
                                            className="w-full flex items-center justify-center gap-2 py-4 bg-primary text-white rounded-2xl font-black text-sm shadow-lg shadow-primary/20 hover:opacity-90 transition disabled:opacity-50"
                                        >
                                            {savingDetail ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                                            Wijzigingen Opslaan
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Members Management Section */}
                            <div className="bg-white dark:bg-slate-800 rounded-[2rem] shadow-sm ring-1 ring-slate-200 dark:ring-slate-700 overflow-hidden">
                                <div className="p-8 border-b border-slate-100 dark:border-slate-700/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900 dark:text-white">Leden & Rechten</h3>
                                        <p className="text-sm text-slate-500 font-medium">Beheer wie toegang heeft tot de Azure-groep.</p>
                                    </div>
                                    
                                    {selected.azure_group_id ? (
                                        <div className="flex-1 max-w-md">
                                            <form onSubmit={handleAddMember} className="relative group">
                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-slate-400 group-focus-within:text-primary transition-colors">
                                                    <UserPlus className="h-4 w-4" />
                                                </div>
                                                <input
                                                    type="email"
                                                    placeholder="Nieuw lid toevoegen (e-mail)..."
                                                    value={newMemberEmail}
                                                    onChange={e => { setNewMemberEmail(e.target.value); setAddError(null); }}
                                                    required
                                                    className="w-full pl-12 pr-24 py-3 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary/20 transition-all"
                                                />
                                                <button
                                                    type="submit"
                                                    disabled={addingMember || !newMemberEmail}
                                                    className="absolute right-2 top-1.5 bottom-1.5 px-4 bg-primary text-white rounded-xl text-xs font-black shadow-sm hover:opacity-90 transition-all disabled:opacity-50"
                                                >
                                                    {addingMember ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Toevoegen'}
                                                </button>
                                            </form>
                                            {addError && (
                                                <p className="mt-2 text-red-500 text-[10px] font-bold ml-2">⚠️ {addError}</p>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="px-4 py-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-xs font-bold rounded-xl flex items-center gap-2 ring-1 ring-amber-100 dark:ring-amber-900/30">
                                            <ShieldAlert className="h-3.5 w-3.5" /> Geen Azure-koppeling
                                        </div>
                                    )}
                                </div>

                                <div className="p-8">
                                    {membersLoading ? (
                                        <div className="py-20 text-center">
                                            <div className="relative inline-block">
                                                <div className="h-12 w-12 rounded-full border-4 border-slate-100 dark:border-slate-700 animate-pulse"></div>
                                                <div className="absolute top-0 h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                                            </div>
                                            <p className="text-slate-400 font-bold mt-4">Lidmaatschappen laden...</p>
                                        </div>
                                    ) : members.length === 0 ? (
                                        <div className="py-16 text-center bg-slate-50/50 dark:bg-slate-900/20 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                                            <History className="h-8 w-8 text-slate-200 dark:text-slate-700 mx-auto mb-3" />
                                            <p className="text-slate-400 font-bold">Nog geen leden in deze groep</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {members.map(member => (
                                                <div
                                                    key={member.entraId}
                                                    className="group flex items-center justify-between p-4 bg-white dark:bg-slate-900/40 rounded-2xl shadow-sm ring-1 ring-slate-200 dark:ring-slate-700 hover:ring-primary/30 transition-all"
                                                >
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className="h-10 w-10 shrink-0 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 font-black text-xs">
                                                            {member.displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="font-bold text-slate-900 dark:text-white truncate flex items-center gap-2">
                                                                {member.displayName}
                                                                {member.isLeader && (
                                                                    <div className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-500 text-white text-[8px] font-black rounded-full uppercase tracking-tighter shadow-sm">
                                                                        <Award className="h-2 w-2" /> Leider
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="text-[10px] text-slate-400 font-medium truncate">{member.email}</div>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex items-center gap-1 translate-x-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                                                        {member.directusMembershipId && (
                                                            <button
                                                                onClick={() => handleToggleLeader(member)}
                                                                disabled={!!actionLoading}
                                                                className={`p-2 rounded-xl transition-all ${member.isLeader ? 'bg-amber-100 dark:bg-amber-500/10 text-amber-600' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-amber-500'}`}
                                                                title="Leader status omschakelen"
                                                            >
                                                                {actionLoading === `leader-${member.entraId}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Shield className="h-3.5 w-3.5" />}
                                                            </button>
                                                        )}
                                                        {selected.azure_group_id && (
                                                            <button
                                                                onClick={() => handleRemoveMember(member)}
                                                                disabled={!!actionLoading}
                                                                className="p-2 hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-400 hover:text-red-500 rounded-xl transition-all"
                                                                title="Lid verwijderen"
                                                            >
                                                                {actionLoading === `remove-${member.entraId}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserMinus className="h-3.5 w-3.5" />}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="px-8 py-4 bg-slate-50 dark:bg-slate-900/50 flex items-center gap-2">
                                    <Info className="h-3.5 w-3.5 text-slate-400" />
                                    <p className="text-[10px] text-slate-400 font-medium italic">
                                        Wanneer je een lid toevoegt of verwijdert, wordt dit via de Azure Management Service direct verwerkt in Entra ID. 
                                        De wijzigingen zijn vaak pas na circa 2 minuten zichtbaar in de lijst onder het tabblad 'Leden'.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
