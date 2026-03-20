'use client';

import { useState, useMemo, useOptimistic, useTransition } from 'react';
import {
    Calendar,
    Phone,
    Shield,
    Clock,
    Award,
    Hash,
    Layers,
    Mail,
    User as UserIcon,
    History,
    Settings,
    Plus,
    Trash2,
    CheckCircle2,
    Circle,
    Loader2,
    CheckCircle,
    XCircle,
    Info,
    Edit,
    Save,
    X,
    RefreshCw,
    CalendarPlus
} from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { manageAzureMembershipAction, updateMemberProfileAction, renewMembershipAction } from '@/server/actions/leden.actions';
import { triggerUserSyncAction } from '@/server/actions/azure-sync.actions';

interface Member {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    date_of_birth: string | null;
    membership_expiry: string | null;
    status: string;
    phone_number: string | null;
    avatar: string | null;
    entra_id?: string | null;
}

interface CommitteeMembership {
    id: string;
    is_leader: boolean;
    committee_id: {
        id: string;
        name: string;
        is_visible: boolean;
        azure_group_id?: string | null;
    };
}

interface Signup {
    id: number;
    payment_status?: string;
    created_at: string;
    event_id: {
        id: string;
        name: string;
        date_start: string;
    };
}

export default function LedenDetailIsland({ 
    member, 
    initialMemberships, 
    signups,
    allCommittees,
    isAdmin 
}: { 
    member: Member, 
    initialMemberships: CommitteeMembership[],
    signups: Signup[],
    allCommittees: any[],
    isAdmin: boolean
}) {
    const [activeTab, setActiveTab] = useState<'profiel' | 'activiteiten' | 'beheer'>('profiel');
    const [isPending, startTransition] = useTransition();
    const [isActionInProgress, setIsActionInProgress] = useState<string | null>(null);

    // Profile editing
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [editProfile, setEditProfile] = useState({
        first_name: member.first_name,
        last_name: member.last_name,
        phone_number: member.phone_number || '',
        date_of_birth: member.date_of_birth || '',
    });
    const [savingProfile, setSavingProfile] = useState(false);
    const [profileError, setProfileError] = useState<string | null>(null);
    const [localMember, setLocalMember] = useState(member);

    // Membership renewal
    const [renewMonths, setRenewMonths] = useState(12);
    const [renewLoading, setRenewLoading] = useState(false);
    const [renewResult, setRenewResult] = useState<string | null>(null);

    // Force sync
    const [syncLoading, setSyncLoading] = useState(false);
    const [syncResult, setSyncResult] = useState<string | null>(null);

    // Optimistic memberships
    const [optimisticMemberships, setOptimisticMemberships] = useOptimistic(
        initialMemberships,
        (state: CommitteeMembership[], { action, membership }: { action: 'add' | 'remove' | 'toggle', membership: any }) => {
            if (action === 'add') return [...state, membership];
            if (action === 'remove') return state.filter(m => m.id !== membership.id);
            if (action === 'toggle') return state.map(m => m.id === membership.id ? { ...m, is_leader: !m.is_leader } : m);
            return state;
        }
    );

    const cleanName = (name: string) => {
        return name
            .replace(/\s*(\|\||\||–|-)\s*Salve\s*Mundi/gi, '')
            .replace(/\s*SaMu\s*(\|\||\|)\s*/gi, '')
            .trim();
    };

    const { realCommittees, otherGroups } = useMemo(() => {
        const EXCLUDED_GROUPS = ['Alle gebruikers', 'Leden_Actief_Lidmaatschap', 'Leden_Verlopen_Lidmaatschap'];
        const real: CommitteeMembership[] = [];
        const groups: CommitteeMembership[] = [];

        optimisticMemberships.forEach(cm => {
            const rawName = cm.committee_id?.name || 'Onbekend';
            if (!rawName || EXCLUDED_GROUPS.includes(rawName)) return;

            if (cm.committee_id?.is_visible === true) {
                real.push(cm);
            } else {
                groups.push(cm);
            }
        });

        return { realCommittees: real, otherGroups: groups };
    }, [optimisticMemberships]);

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'Onbekend';
        try {
            return format(new Date(dateString), 'd MMMM yyyy', { locale: nl });
        } catch (e) {
            return 'Onbekend';
        }
    };

    const isMembershipActive = useMemo(() => {
        if (!member.membership_expiry) return false;
        const todayStr = new Date().toISOString().substring(0, 10);
        return member.membership_expiry.substring(0, 10) >= todayStr;
    }, [member.membership_expiry]);

    async function handleMembershipChange(azureGroupId: string, action: 'add' | 'remove', committeeName: string) {
        if (!localMember.entra_id) {
            alert("Dit lid heeft geen gekoppeld Azure account!");
            return;
        }

        if (action === 'remove' && !confirm(`Weet je zeker dat je ${localMember.first_name} wilt verwijderen uit ${committeeName}? Dit wordt direct in Azure aangepast.`)) {
            return;
        }

        setIsActionInProgress(`${action}-${azureGroupId}`);
        startTransition(async () => {
             const res = await manageAzureMembershipAction(localMember.entra_id!, azureGroupId, action, localMember.id);
             if (!res.success) {
                 alert(res.error || "Fout bij het bijwerken van lidmaatschap");
             }
        });
        setIsActionInProgress(null);
    }

    async function handleSaveProfile() {
        setSavingProfile(true);
        setProfileError(null);
        const res = await updateMemberProfileAction(localMember.id, editProfile);
        if (res.success) {
            setLocalMember(prev => ({ ...prev, ...editProfile }));
            setIsEditingProfile(false);
        } else {
            setProfileError(res.error ?? 'Opslaan mislukt');
        }
        setSavingProfile(false);
    }

    async function handleRenewMembership() {
        if (!confirm(`Weet je zeker dat je het lidmaatschap van ${localMember.first_name} ${localMember.last_name} met ${renewMonths} maand(en) verlengt?`)) return;
        setRenewLoading(true);
        setRenewResult(null);
        const res = await renewMembershipAction(localMember.id, renewMonths);
        if (res.success) {
            setRenewResult(`✓ Verlengd tot ${res.newExpiry}`);
            setLocalMember(prev => ({ ...prev, membership_expiry: res.newExpiry ?? prev.membership_expiry }));
        } else {
            setRenewResult(`✗ ${res.error}`);
        }
        setRenewLoading(false);
    }

    async function handleForceSync() {
        setSyncLoading(true);
        setSyncResult(null);
        const res = await triggerUserSyncAction(localMember.id);
        setSyncResult(res.success ? '✓ Synchronisatie gestart' : `✗ ${res.error}`);
        setSyncLoading(false);
    }

    const availableCommittees = useMemo(() => {
        const currentIds = new Set(optimisticMemberships.map(m => m.committee_id.id));
        return allCommittees.filter(c => !currentIds.has(c.id) && c.azure_group_id);
    }, [allCommittees, optimisticMemberships]);

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            {/* Header info moved to page.tsx PageHeader, but we add a mini profile header here if needed */}
            <div className="flex flex-col md:flex-row md:items-center gap-6 mb-12">
                            <div className="relative group">
                    <div className="h-24 w-24 rounded-3xl bg-primary/10 flex items-center justify-center text-primary font-black text-3xl shadow-xl ring-4 ring-white dark:ring-slate-800 transition-transform group-hover:scale-105">
                        {localMember.avatar ? (
                            <img src={`/api/assets/${localMember.avatar}?width=100&height=100&fit=cover`} alt="avatar" className="h-full w-full object-cover rounded-3xl" />
                        ) : (
                            <>{localMember.first_name?.[0]}{localMember.last_name?.[0]}</>
                        )}
                    </div>
                </div>
                <div className="space-y-2">
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white leading-none">
                        {localMember.first_name} {localMember.last_name}
                    </h1>
                    <div className="flex flex-wrap items-center gap-3">
                        <span className="text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1.5 text-sm">
                            <Mail className="h-4 w-4" /> {localMember.email}
                        </span>
                        <div suppressHydrationWarning className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${isMembershipActive
                                ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400'
                                : 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400'
                            }`}>
                            {isMembershipActive ? 'Actief Lidmaatschap' : 'Lidmaatschap Verlopen'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="flex gap-1 mb-8 bg-slate-100 dark:bg-slate-900/50 p-1 rounded-2xl w-fit">
                <button
                    onClick={() => setActiveTab('profiel')}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all text-sm ${activeTab === 'profiel' ? 'bg-white dark:bg-slate-800 shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                    <UserIcon className="h-4 w-4" /> Profiel
                </button>
                <button
                    onClick={() => setActiveTab('activiteiten')}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all text-sm ${activeTab === 'activiteiten' ? 'bg-white dark:bg-slate-800 shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                    <History className="h-4 w-4" /> Activiteiten
                </button>
                {isAdmin && (
                    <button
                        onClick={() => setActiveTab('beheer')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all text-sm ${activeTab === 'beheer' ? 'bg-white dark:bg-slate-800 shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                        <Settings className="h-4 w-4" /> Beheer
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Side: Summary Card */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm ring-1 ring-slate-200 dark:ring-slate-700 p-8 glassmorphism">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Gegevens</h3>
                            {isAdmin && !isEditingProfile && (
                                <button onClick={() => { setIsEditingProfile(true); setProfileError(null); }} className="p-1.5 text-slate-400 hover:text-primary rounded-lg hover:bg-primary/10 transition">
                                    <Edit className="h-4 w-4" />
                                </button>
                            )}
                        </div>

                        {isEditingProfile ? (
                            <div className="space-y-3">
                                {profileError && <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-xl">{profileError}</p>}
                                {([
                                    { key: 'first_name', label: 'Voornaam', type: 'text' },
                                    { key: 'last_name', label: 'Achternaam', type: 'text' },
                                    { key: 'phone_number', label: 'Telefoon', type: 'tel' },
                                    { key: 'date_of_birth', label: 'Geboortedatum', type: 'date' },
                                ] as const).map(field => (
                                    <div key={field.key}>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{field.label}</label>
                                        <input
                                            type={field.type}
                                            value={editProfile[field.key]}
                                            onChange={e => setEditProfile(prev => ({ ...prev, [field.key]: e.target.value }))}
                                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-primary focus:outline-none"
                                        />
                                    </div>
                                ))}
                                <div className="flex gap-2 pt-1">
                                    <button onClick={handleSaveProfile} disabled={savingProfile} className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:opacity-90 transition disabled:opacity-60">
                                        {savingProfile ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Opslaan
                                    </button>
                                    <button onClick={() => { setIsEditingProfile(false); setProfileError(null); }} className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition">
                                        Annuleren
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <InfoRow icon={Calendar} label="Geboortedatum" value={formatDate(localMember.date_of_birth)} />
                                <InfoRow icon={Phone} label="Telefoonnummer" value={localMember.phone_number || 'Geen'} />
                                <InfoRow icon={Clock} label="Verloopdatum" value={formatDate(localMember.membership_expiry)} />
                                <InfoRow icon={Hash} label="Persoons ID" value={localMember.id.substring(0, 8) + '...'} />
                                {localMember.entra_id && <InfoRow icon={Shield} label="Entra ID" value={localMember.entra_id.substring(0, 8) + '...'} />}
                            </div>
                        )}
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm ring-1 ring-slate-200 dark:ring-slate-700 p-8">
                         <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-6 flex items-center gap-2">
                             Status
                        </h3>
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50">
                             <div>
                                 <p className="text-xs font-bold text-slate-500">Lidmaatschap</p>
                                 <p className={`font-black ${isMembershipActive ? 'text-green-600' : 'text-red-600'}`}>
                                     {isMembershipActive ? 'ACTIEF' : 'VERLOPEN'}
                                 </p>
                             </div>
                             {isMembershipActive ? <CheckCircle className="h-8 w-8 text-green-500" /> : <XCircle className="h-8 w-8 text-red-500" />}
                        </div>
                    </div>
                </div>

                {/* Right Side: Tab Content */}
                <div className="lg:col-span-2">
                    {activeTab === 'profiel' && (
                        <div className="space-y-6">
                            {/* Committees Section */}
                            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm ring-1 ring-slate-200 dark:ring-slate-700 p-8">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="h-12 w-12 rounded-2xl bg-orange-100 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400 flex items-center justify-center shadow-sm">
                                        <Award className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">Commissies</h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">Actieve rollen binnen Salve Mundi</p>
                                    </div>
                                </div>

                                {realCommittees.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {realCommittees.map((membership) => (
                                            <CommitteeCard key={membership.id} membership={membership} cleanName={cleanName} />
                                        ))}
                                    </div>
                                ) : (
                                    <EmptyState icon={UserIcon} message="Geen actieve commissie-lidmaatschappen" />
                                )}
                            </div>

                            {/* Teams Section */}
                            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm ring-1 ring-slate-200 dark:ring-slate-700 p-8">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="h-12 w-12 rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 flex items-center justify-center shadow-sm">
                                        <Layers className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">Teams & Groepen</h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">Systeemgroepen en secundaire teams</p>
                                    </div>
                                </div>

                                {otherGroups.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {otherGroups.map((membership) => (
                                            <GroupCard key={membership.id} membership={membership} cleanName={cleanName} />
                                        ))}
                                    </div>
                                ) : (
                                    <EmptyState icon={Layers} message="Geen overige groepen gevonden" />
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'activiteiten' && (
                        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm ring-1 ring-slate-200 dark:ring-slate-700 overflow-hidden">
                            <div className="p-8 border-b border-slate-100 dark:border-slate-700/50">
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white">Activiteiten Historie</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">Recente inschrijvingen voor evenementen</p>
                            </div>
                            {signups.length === 0 ? (
                                <div className="py-20 text-center">
                                     <History className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                                     <p className="text-slate-400 font-bold">Nog geen activiteiten gevonden</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50/50 dark:bg-slate-900/30 text-[10px] uppercase font-black tracking-widest text-slate-400">
                                                <th className="px-8 py-4">Activiteit</th>
                                                <th className="px-8 py-4">Datum</th>
                                                <th className="px-8 py-4 text-right">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                            {signups.map(signup => (
                                                <tr key={signup.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors">
                                                    <td className="px-8 py-5">
                                                        <div className="font-extrabold text-slate-900 dark:text-white">{signup.event_id.name}</div>
                                                    </td>
                                                    <td className="px-8 py-5 text-sm text-slate-500 font-medium">
                                                        {formatDate(signup.event_id.date_start)}
                                                    </td>
                                                    <td className="px-8 py-5 text-right">
                                                        <SignupStatus status={signup.payment_status || 'open'} />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'beheer' && (
                        <div className="space-y-6">
                            {/* Azure Committee Management */}
                            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm ring-1 ring-slate-200 dark:ring-slate-700 p-8">
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-900 dark:text-white">Azure Beheer</h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">Lidmaatschappen direct in Azure AD aanpassen</p>
                                    </div>
                                    <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                                        <Shield className="h-6 w-6" />
                                    </div>
                                </div>

                                <div className="space-y-4 mb-8">
                                    <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest">Huidige Lidmaatschappen</h4>
                                    {optimisticMemberships.filter(m => m.committee_id.azure_group_id).length === 0 ? (
                                        <p className="text-sm text-slate-400 italic">Geen Azure-gekoppelde commissies.</p>
                                    ) : (
                                        <div className="grid grid-cols-1 gap-3">
                                            {optimisticMemberships.filter(m => m.committee_id.azure_group_id).map(m => (
                                                <div key={m.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                                                    <div className="flex items-center gap-3">
                                                        <Award className={`h-5 w-5 ${m.is_leader ? 'text-orange-500' : 'text-slate-300'}`} />
                                                        <span className="font-bold text-slate-800 dark:text-slate-200">{cleanName(m.committee_id.name)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button 
                                                            onClick={() => handleMembershipChange(m.committee_id.azure_group_id!, 'remove', m.committee_id.name)}
                                                            disabled={isActionInProgress === `remove-${m.committee_id.azure_group_id}`}
                                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all cursor-pointer"
                                                        >
                                                            {isActionInProgress === `remove-${m.committee_id.azure_group_id}` ? <Loader2 className="h-5 w-5 animate-spin" /> : <Trash2 className="h-5 w-5" />}
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-4">
                                     <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest">Toevoegen aan Azure Groep</h4>
                                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                         {availableCommittees.map(c => (
                                             <button
                                                key={c.id}
                                                onClick={() => handleMembershipChange(c.azure_group_id, 'add', c.name)}
                                                disabled={isActionInProgress === `add-${c.azure_group_id}`}
                                                className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-primary/50 hover:bg-primary/5 transition-all text-left shadow-sm group"
                                             >
                                                 <div className="min-w-0 flex-1">
                                                     <p className="font-extrabold text-slate-800 dark:text-slate-200 text-sm truncate">{cleanName(c.name)}</p>
                                                     <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Azure ID: {c.azure_group_id.substring(0, 8)}...</p>
                                                 </div>
                                                 <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg group-hover:bg-primary group-hover:text-white transition-all">
                                                     {isActionInProgress === `add-${c.azure_group_id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                                                 </div>
                                             </button>
                                         ))}
                                     </div>
                                </div>
                            </div>

                            {/* Membership Renewal */}
                            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm ring-1 ring-slate-200 dark:ring-slate-700 p-8">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="h-12 w-12 rounded-2xl bg-green-100 text-green-600 dark:bg-green-500/10 dark:text-green-400 flex items-center justify-center">
                                        <CalendarPlus className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900 dark:text-white">Lidmaatschap Verlengen</h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">Handmatig verlengen (bijv. bij betaling buiten Mollie om)</p>
                                    </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-3">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Verlengen met:</label>
                                    <div className="flex gap-2">
                                        {[1, 6, 12].map(m => (
                                            <button key={m} onClick={() => setRenewMonths(m)} className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${renewMonths === m ? 'bg-primary text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}`}>
                                                {m} maand{m > 1 ? 'en' : ''}
                                            </button>
                                        ))}
                                    </div>
                                    <button
                                        onClick={handleRenewMembership}
                                        disabled={renewLoading}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 transition disabled:opacity-60"
                                    >
                                        {renewLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarPlus className="h-4 w-4" />}
                                        Verlengen
                                    </button>
                                </div>
                                {renewResult && (
                                    <p className={`mt-3 text-sm font-bold ${renewResult.startsWith('✓') ? 'text-green-600' : 'text-red-500'}`}>{renewResult}</p>
                                )}
                            </div>

                            {/* Force Sync */}
                            {localMember.entra_id && (
                                <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm ring-1 ring-slate-200 dark:ring-slate-700 p-8">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="font-black text-slate-900 dark:text-white">Azure AD Synchronisatie</h3>
                                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Forceer een directe sync van dit lid met Azure AD.</p>
                                        </div>
                                        <button
                                            onClick={handleForceSync}
                                            disabled={syncLoading}
                                            className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-600 transition disabled:opacity-60"
                                        >
                                            <RefreshCw className={`h-4 w-4 ${syncLoading ? 'animate-spin' : ''}`} />
                                            Synchroniseer
                                        </button>
                                    </div>
                                    {syncResult && (
                                        <p className={`mt-3 text-sm font-bold ${syncResult.startsWith('✓') ? 'text-green-600' : 'text-red-500'}`}>{syncResult}</p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function InfoRow({ icon: Icon, label, value }: { icon: any, label: string, value: string }) {
    return (
        <div className="flex items-center gap-4 group">
            <div className="h-10 w-10 shrink-0 rounded-xl bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors ring-1 ring-slate-200 dark:ring-slate-700/50">
                <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-0.5">{label}</p>
                <p className="text-sm font-extrabold text-slate-700 dark:text-slate-200 truncate">{value}</p>
            </div>
        </div>
    );
}

function CommitteeCard({ membership, cleanName }: { membership: CommitteeMembership, cleanName: (n: string) => string }) {
    return (
        <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-900/30 ring-1 ring-slate-200 dark:ring-slate-700/50 flex flex-col gap-3 group hover:ring-orange-500/30 transition-all shadow-sm">
            <div className="flex items-center gap-4">
                <div className="h-10 w-10 shrink-0 rounded-full bg-orange-100 dark:bg-orange-500/10 flex items-center justify-center text-orange-600 dark:text-orange-400 group-hover:scale-110 transition-transform">
                    <Shield className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                    <p className="font-extrabold text-slate-800 dark:text-slate-100 truncate">{cleanName(membership.committee_id.name)}</p>
                    {membership.is_leader && (
                        <span className="inline-flex items-center gap-1.5 text-[9px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest mt-0.5">
                            <Award className="h-3 w-3" />
                            Commissie Leider
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}

function GroupCard({ membership, cleanName }: { membership: CommitteeMembership, cleanName: (n: string) => string }) {
    return (
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/30 ring-1 ring-slate-200 dark:ring-slate-700/50 flex items-center gap-4 group hover:ring-blue-500/30 transition-all">
            <div className="h-10 w-10 shrink-0 rounded-xl bg-blue-50 dark:bg-blue-500/5 flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all shadow-sm ring-1 ring-blue-100 dark:ring-blue-900/30">
                <Hash className="h-5 w-5" />
            </div>
            <p className="font-extrabold text-slate-800 dark:text-slate-100 text-sm truncate">{cleanName(membership.committee_id.name)}</p>
        </div>
    );
}

function SignupStatus({ status }: { status: string }) {
    switch (status) {
        case 'paid':
            return (
                <span className="px-3 py-1 bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400 rounded-full text-[10px] font-black uppercase tracking-wider">
                    Betaald
                </span>
            );
        case 'failed':
        case 'canceled':
            return (
                <span className="px-3 py-1 bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400 rounded-full text-[10px] font-black uppercase tracking-wider">
                    Mislukt
                </span>
            );
        default:
            return (
                <span className="px-3 py-1 bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 rounded-full text-[10px] font-black uppercase tracking-wider">
                    Open
                </span>
            );
    }
}

function EmptyState({ icon: Icon, message }: { icon: any, message: string }) {
    return (
        <div className="py-16 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-900/50 mb-3 text-slate-300">
                <Icon className="h-6 w-6" />
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-medium italic text-sm">{message}</p>
        </div>
    );
}
