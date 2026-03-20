'use client';

import { useState, useCallback } from 'react';
import {
    Users, UserPlus, UserMinus, Shield, Mail, Info, Search,
    Loader2, RefreshCw, Settings, ExternalLink, Save, X, ChevronRight, CheckCircle
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
        const m = await getCommitteeMembers(c.id).catch(() => []);
        setMembers(m);
        setMembersLoading(false);
    }, []);

    const handleAddMember = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selected?.azureGroupId || !newMemberEmail) return;
        setAddingMember(true);
        setAddError(null);
        const res = await addCommitteeMember(selected.azureGroupId, selected.id, newMemberEmail);
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
        if (!selected?.azureGroupId) return;
        if (!confirm(`Weet je zeker dat je ${member.displayName} wilt verwijderen uit ${selected.name}?`)) return;
        setActionLoading(`remove-${member.entraId}`);
        const res = await removeCommitteeMember(selected.azureGroupId, member.entraId);
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
            selected?.azureGroupId,
            member.entraId
        );
        if (res.success) setMembers(prev => prev.map(m => m.entraId === member.entraId ? { ...m, isLeader: !m.isLeader } : m));
        else alert(res.error ?? 'Bijwerken mislukt');
        setActionLoading(null);
    };

    const handleSaveDetail = async () => {
        if (!selected) return;
        setSavingDetail(true);
        const res = await updateCommitteeDetails(selected.id, {
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
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-black text-[var(--text-main)] flex items-center gap-3">
                        <Shield className="h-7 w-7 text-[var(--theme-purple)]" />
                        Commissie Beheer
                    </h1>
                    <p className="text-sm text-[var(--text-muted)] mt-1">
                        Beheer leden en leiders van Salve Mundi commissies.
                    </p>
                </div>
                <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[var(--bg-card)] ring-1 ring-[var(--border-color)] rounded-xl text-sm font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] hover:ring-[var(--theme-purple)] transition"
                >
                    <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                    Verversen
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* ── Left Panel – Committee List ── */}
                <div className="lg:col-span-5 xl:col-span-4">
                    <div className="bg-[var(--bg-card)] ring-1 ring-[var(--border-color)] rounded-2xl p-5">
                        <h2 className="font-bold text-[var(--text-main)] mb-4 flex items-center gap-2">
                            <Users className="h-4 w-4 text-[var(--theme-purple)]" />
                            Commissies
                            <span className="ml-auto text-xs font-normal text-[var(--text-muted)]">{filtered.length} zichtbaar</span>
                        </h2>

                        <div className="flex gap-2 mb-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-muted)]" />
                                <input
                                    type="text"
                                    placeholder="Zoek..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full pl-8 pr-3 py-2 bg-[var(--bg-main,_#f4f4f5)] border border-[var(--border-color)] rounded-xl text-sm text-[var(--text-main)] focus:ring-2 focus:ring-[var(--theme-purple)] focus:outline-none"
                                />
                            </div>
                            <button
                                onClick={() => setShowAll(!showAll)}
                                className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all whitespace-nowrap ${showAll ? 'bg-[var(--theme-purple)] text-white border-transparent' : 'border-[var(--border-color)] text-[var(--text-muted)] hover:border-[var(--theme-purple)] hover:text-[var(--theme-purple)]'}`}
                            >
                                {showAll ? 'Standaard' : 'Toon Alle'}
                            </button>
                        </div>

                        <div className="space-y-1.5 max-h-[60vh] overflow-y-auto pr-1">
                            {filtered.length === 0 && (
                                <p className="text-center text-[var(--text-muted)] py-8 text-sm">Geen commissies gevonden</p>
                            )}
                            {filtered.map(c => (
                                <button
                                    key={c.id}
                                    onClick={() => handleSelectCommittee(c)}
                                    className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left ${selected?.id === c.id
                                        ? 'bg-[var(--theme-purple)]/10 border-[var(--theme-purple)]/30 text-[var(--theme-purple)]'
                                        : 'border-transparent hover:bg-[var(--bg-card-soft,_#f4f4f5)] text-[var(--text-main)]'}`}
                                >
                                    <div className="min-w-0">
                                        <div className="font-semibold text-sm truncate">{c.name}</div>
                                        {c.email && <div className="text-xs text-[var(--text-muted)] truncate flex items-center gap-1 mt-0.5"><Mail className="h-3 w-3" />{c.email}</div>}
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0 ml-2">
                                        {!c.azureGroupId && <span title="Geen Azure groep gekoppeld"><Info className="h-3.5 w-3.5 text-amber-400" /></span>}
                                        <ChevronRight className={`h-3.5 w-3.5 transition ${selected?.id === c.id ? 'text-[var(--theme-purple)]' : 'text-[var(--text-muted)]'}`} />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── Right Panel – Member Management ── */}
                <div className="lg:col-span-7 xl:col-span-8 lg:sticky lg:top-8">
                    {!selected ? (
                        <div className="bg-[var(--bg-card)] ring-1 ring-dashed ring-[var(--border-color)] rounded-2xl p-16 text-center text-[var(--text-muted)]">
                            <Users className="h-14 w-14 mx-auto mb-4 opacity-20" />
                            <p className="font-semibold">Selecteer een commissie om de leden te beheren</p>
                        </div>
                    ) : (
                        <div className="bg-[var(--bg-card)] ring-1 ring-[var(--border-color)] rounded-2xl p-6">
                            {/* Committee Header */}
                            <div className="flex items-start justify-between gap-4 mb-6">
                                <div>
                                    <h2 className="font-black text-lg text-[var(--text-main)]">{selected.name}</h2>
                                    {selected.email && (
                                        <div className="flex items-center gap-1 text-xs text-[var(--text-muted)] mt-1">
                                            <Mail className="h-3 w-3" />{selected.email}
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <a
                                        href={`/vereniging/commissies/${slugify(selected.name)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2 text-[var(--text-muted)] hover:text-[var(--theme-purple)] hover:bg-[var(--theme-purple)]/10 rounded-xl transition"
                                        title="Bekijk op website"
                                    >
                                        <ExternalLink className="h-4 w-4" />
                                    </a>
                                    <button
                                        onClick={() => setEditingDetail(!editingDetail)}
                                        className={`p-2 rounded-xl border transition-all ${editingDetail ? 'bg-[var(--theme-purple)] text-white border-transparent' : 'border-[var(--border-color)] text-[var(--text-muted)] hover:border-[var(--theme-purple)] hover:text-[var(--theme-purple)]'}`}
                                        title="Bewerk details"
                                    >
                                        <Settings className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Detail Edit Panel */}
                            {editingDetail && (
                                <div className="mb-6 p-4 bg-[var(--bg-card-soft,_#f4f4f5)] rounded-2xl space-y-4 border border-[var(--border-color)]">
                                    <h3 className="font-bold text-sm text-[var(--text-main)]">Details Bewerken</h3>
                                    <div>
                                        <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1">Korte Beschrijving</label>
                                        <textarea
                                            value={editShortDesc}
                                            onChange={e => setEditShortDesc(e.target.value)}
                                            rows={3}
                                            className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-sm text-[var(--text-main)] focus:ring-2 focus:ring-[var(--theme-purple)] focus:outline-none"
                                            placeholder="Korte tekst voor de overzichtskaart..."
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1">Volledige Beschrijving (HTML)</label>
                                        <textarea
                                            value={editDesc}
                                            onChange={e => setEditDesc(e.target.value)}
                                            rows={6}
                                            className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-sm text-[var(--text-main)] font-mono focus:ring-2 focus:ring-[var(--theme-purple)] focus:outline-none"
                                            placeholder="Volledige omschrijving..."
                                        />
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={handleSaveDetail}
                                            disabled={savingDetail}
                                            className="flex items-center gap-2 px-5 py-2.5 bg-[var(--theme-purple)] text-white rounded-xl text-sm font-bold hover:opacity-90 transition disabled:opacity-60"
                                        >
                                            {savingDetail ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Opslaan
                                        </button>
                                        <button onClick={() => setEditingDetail(false)} className="px-5 py-2.5 rounded-xl text-sm font-bold text-[var(--text-muted)] hover:bg-[var(--border-color)] transition">Annuleren</button>
                                    </div>
                                </div>
                            )}

                            {/* Add Member Form */}
                            {selected.azureGroupId ? (
                                <form onSubmit={handleAddMember} className="mb-6 p-4 bg-[var(--bg-card-soft,_#f4f4f5)] rounded-2xl border border-[var(--border-color)]">
                                    <h3 className="font-bold text-sm text-[var(--text-main)] mb-3 flex items-center gap-2">
                                        <UserPlus className="h-4 w-4 text-[var(--theme-purple)]" /> Lid Toevoegen
                                    </h3>
                                    {addError && (
                                        <div className="mb-3 px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-xs">
                                            {addError}
                                        </div>
                                    )}
                                    <div className="flex gap-2">
                                        <input
                                            type="email"
                                            placeholder="E-mailadres (student.fontys.nl of salvemundi.nl)..."
                                            value={newMemberEmail}
                                            onChange={e => { setNewMemberEmail(e.target.value); setAddError(null); }}
                                            required
                                            className="flex-1 px-4 py-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-sm text-[var(--text-main)] focus:ring-2 focus:ring-[var(--theme-purple)] focus:outline-none"
                                        />
                                        <button
                                            type="submit"
                                            disabled={addingMember || !newMemberEmail}
                                            className="flex items-center gap-2 px-5 py-2.5 bg-[var(--theme-purple)] text-white rounded-xl text-sm font-bold hover:opacity-90 transition disabled:opacity-60"
                                        >
                                            {addingMember ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                                            Toevoegen
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-[var(--text-muted)] mt-2">
                                        * Toevoegen werkt via Azure AD. De synchronisatie naar Directus volgt automatisch.
                                    </p>
                                </form>
                            ) : (
                                <div className="mb-6 flex items-center gap-2 px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-700 dark:text-amber-300 text-sm">
                                    <Info className="h-4 w-4 flex-shrink-0" />
                                    Deze commissie heeft geen Azure groep gekoppeld. Ledenwijzigingen zijn niet mogelijk.
                                </div>
                            )}

                            {/* Members List */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-bold text-sm text-[var(--text-main)]">Leden ({members.length})</h3>
                                    <span className="text-[10px] text-[var(--text-muted)] italic">Data via Directus</span>
                                </div>

                                {membersLoading ? (
                                    <div className="py-12 text-center">
                                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-[var(--theme-purple)] mb-2" />
                                        <p className="text-sm text-[var(--text-muted)]">Leden ophalen...</p>
                                    </div>
                                ) : members.length === 0 ? (
                                    <div className="py-12 text-center border border-dashed border-[var(--border-color)] rounded-2xl text-[var(--text-muted)]">
                                        Geen leden gevonden voor deze commissie.
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {members.map(member => (
                                            <div
                                                key={member.entraId}
                                                className="flex items-center justify-between gap-3 p-3.5 bg-[var(--bg-card-soft,_#f4f4f5)] rounded-2xl border border-[var(--border-color)] group hover:border-[var(--theme-purple)]/30 transition-all"
                                            >
                                                <div className="min-w-0">
                                                    <div className="font-bold text-sm text-[var(--text-main)] truncate flex items-center gap-2">
                                                        {member.displayName}
                                                        {member.isLeader && (
                                                            <span className="shrink-0 px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[9px] font-bold rounded-full uppercase tracking-wider">Leider</span>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-[var(--text-muted)] truncate">{member.email}</div>
                                                </div>
                                                <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-all">
                                                    {member.directusMembershipId && (
                                                        <button
                                                            onClick={() => handleToggleLeader(member)}
                                                            disabled={!!actionLoading}
                                                            title={member.isLeader ? 'Verwijder leider status' : 'Maak commissie leider'}
                                                            className={`p-1.5 rounded-lg transition-all ${member.isLeader ? 'bg-amber-100 text-amber-600' : 'hover:bg-amber-100 text-[var(--text-muted)] hover:text-amber-600'}`}
                                                        >
                                                            {actionLoading === `leader-${member.entraId}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Shield className="h-3.5 w-3.5" />}
                                                        </button>
                                                    )}
                                                    {selected.azureGroupId && (
                                                        <button
                                                            onClick={() => handleRemoveMember(member)}
                                                            disabled={!!actionLoading}
                                                            title="Verwijderen uit commissie"
                                                            className="p-1.5 hover:bg-red-100 text-[var(--text-muted)] hover:text-red-500 rounded-lg transition-all"
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
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
