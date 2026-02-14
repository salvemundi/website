'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/providers/auth-provider';
import {
    Users,
    UserPlus,
    UserMinus,
    Shield,
    Mail,
    Info,
    Search,
    Loader2,
    RefreshCw,
    Settings,
    ExternalLink
} from 'lucide-react';
import { usePagePermission } from '@/shared/lib/hooks/usePermissions';
import { slugify } from '@/shared/lib/utils/slug';
import { getImageUrl } from '@/shared/lib/api/salvemundi';
import {
    getAdminCommitteesAction,
    getCommitteeMembersAction,
    addCommitteeMemberAction,
    removeCommitteeMemberAction,
    toggleCommitteeLeaderAction,
    updateCommitteeDetailsAction
} from '@/features/admin/server/committees-actions';
import { uploadFileAction } from '@/features/admin/server/file-actions';

interface AzureMember {
    id: string;
    displayName: string;
    userPrincipalName: string;
    mail?: string;
    givenName?: string;
    surname?: string;
}

interface Committee {
    id: string;
    name: string;
    email?: string;
    azureGroupId?: string;
    description?: string;
    short_description?: string;
    image?: string;
}

interface DirectusMember {
    id: number;
    user_id: {
        id: string;
        entra_id: string;
    } | null;
    committee_id: string;
    is_leader: boolean;
}

function Tile({
    title,
    icon,
    children,
    className = '',
    actions,
}: {
    title?: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
    actions?: React.ReactNode;
}) {
    return (
        <section
            className={[
                'relative overflow-hidden rounded-3xl bg-gradient-to-br from-theme-gradient-start to-theme-gradient-end shadow-lg h-full',
                className,
            ].join(' ')}
        >
            <div className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/5 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-white/5 blur-3xl" />

            <div className="relative p-6 sm:p-7">
                {(title || actions) && (
                    <header className="mb-5 flex items-center justify-between gap-4">
                        <div className="flex min-w-0 items-center gap-3">
                            {icon ? (
                                <div className="shrink-0 rounded-xl bg-theme-purple/10 p-2 text-theme-purple-lighter">
                                    {icon}
                                </div>
                            ) : null}
                            {title ? (
                                <h2 className="truncate text-lg font-bold text-theme-purple-lighter">
                                    {title}
                                </h2>
                            ) : null}
                        </div>

                        {actions ? <div className="shrink-0">{actions}</div> : null}
                    </header>
                )}

                {children}
            </div>
        </section>
    );
}

export default function CommitteeManagementPage() {
    const router = useRouter();
    useAuth();
    const { isAuthorized, isLoading: permissionLoading } = usePagePermission('admin_sync', ['ict', 'bestuur', 'kandi']);

    const [committees, setCommittees] = useState<Committee[]>([]);
    const [selectedCommittee, setSelectedCommittee] = useState<Committee | null>(null);
    const [azureMembers, setAzureMembers] = useState<AzureMember[]>([]);
    const [directusMembers, setDirectusMembers] = useState<DirectusMember[]>([]);

    const [loading, setLoading] = useState(true);
    const [membersLoading, setMembersLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const [newUserEmail, setNewUserEmail] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [showAll, setShowAll] = useState(false);

    const STANDARD_COMMITTEE_NAMES = [
        'feestcommissie',
        'mediacommissie',
        'introcommissie',
        'kascommissie',
        'ict-commissie',
        'ictcommissie',
        'kampcommissie',
        'activiteitencommissie',
        'studiecommissie',
        'reiscommissie',
        'marketingcommissie'
    ];

    const [isEditingDetail, setIsEditingDetail] = useState(false);
    const [editShortDescription, setEditShortDescription] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editImageFile, setEditImageFile] = useState<File | null>(null);
    const [detailSaving, setDetailSaving] = useState(false);

    useEffect(() => {
        if (!permissionLoading && isAuthorized === false) {
            router.push('/admin');
        }
    }, [isAuthorized, permissionLoading, router]);

    useEffect(() => {
        if (isAuthorized) {
            loadCommittees();
        }
    }, [isAuthorized]);

    const loadCommittees = async () => {
        setLoading(true);
        try {
            const data = await getAdminCommitteesAction();
            setCommittees(data as Committee[]);
        } catch (error) {
            console.error('Failed to load committees:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadCommitteeMembers = async (committee: Committee) => {
        setMembersLoading(true);
        setSelectedCommittee(committee);
        setNewUserEmail('');
        setIsEditingDetail(false);

        // Pre-populate edit fields from the selected committee object
        setEditShortDescription(committee.short_description || '');
        setEditDescription(committee.description || '');

        try {
            if (committee.azureGroupId) {
                const { azureMembers, directusMembers } = await getCommitteeMembersAction(committee.azureGroupId, committee.id);
                setAzureMembers(azureMembers);
                setDirectusMembers(directusMembers);
            } else {
                setAzureMembers([]);
                // Still load Directus members to see if any exist (though unlikely without Azure group)
                const { directusMembers } = await getCommitteeMembersAction('', committee.id);
                setDirectusMembers(directusMembers);
            }
        } catch (error) {
            console.error('Failed to load members:', error);
        } finally {
            setMembersLoading(false);
        }
    };

    const handleAddMember = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCommittee?.azureGroupId || !newUserEmail) return;

        setActionLoading('add');
        try {
            await addCommitteeMemberAction(selectedCommittee.azureGroupId, newUserEmail);
            setNewUserEmail('');
            // Wait for sync propagation
            setTimeout(() => loadCommitteeMembers(selectedCommittee), 1000);
        } catch (error: any) {
            console.error('Add member failed:', error);
            alert(`Fout bij toevoegen: ${error.message || 'Onbekende fout'}`);
        } finally {
            setTimeout(() => setActionLoading(null), 1000);
        }
    };

    const handleRemoveMember = async (azureId: string) => {
        if (!selectedCommittee?.azureGroupId) return;
        if (!confirm('Weet je zeker dat je dit lid wilt verwijderen uit de commissie (in Azure)?')) return;

        setActionLoading(`remove-${azureId}`);
        try {
            await removeCommitteeMemberAction(selectedCommittee.azureGroupId, azureId);
            await loadCommitteeMembers(selectedCommittee);
        } catch (error) {
            console.error('Remove member failed:', error);
            alert('Fout bij verwijderen lid.');
        } finally {
            setActionLoading(null);
        }
    };

    const handleToggleLeader = async (azureId: string) => {
        setActionLoading(`leader-${azureId}`);
        try {
            const membership = directusMembers.find(m => m.user_id?.entra_id === azureId);

            if (!membership) {
                alert('Lidmaatschap record niet gevonden in Directus. De sync is waarschijnlijk nog bezig. Probeer het over een minuutje weer.');
                return;
            }

            await toggleCommitteeLeaderAction(membership.id, membership.is_leader);
            await loadCommitteeMembers(selectedCommittee!);
        } catch (error) {
            console.error('Toggle leader failed:', error);
            alert('Fout bij wijzigen leiderstatus.');
        } finally {
            setActionLoading(null);
        }
    };

    const isMemberLeader = (azureId: string) => {
        return directusMembers.find(m => m.user_id?.entra_id === azureId)?.is_leader || false;
    };

    const handleSaveDetails = async () => {
        if (!selectedCommittee) return;
        setDetailSaving(true);
        try {
            const payload: any = {
                short_description: editShortDescription,
                description: editDescription
            };

            if (editImageFile) {
                const fd = new FormData();
                fd.append('file', editImageFile);
                const { id: fileId } = await uploadFileAction(fd);
                payload.image = fileId;
            }

            await updateCommitteeDetailsAction(selectedCommittee.id, payload);

            alert('Details opgeslagen!');
            setIsEditingDetail(false);
            setEditImageFile(null);

            // Reload committee data to get the updated fields
            const updatedCommittees = await getAdminCommitteesAction();
            setCommittees(updatedCommittees as Committee[]);

            const refreshed = (updatedCommittees as Committee[]).find(c => c.id === selectedCommittee.id);
            if (refreshed) {
                setSelectedCommittee(refreshed);
            }
        } catch (error) {
            console.error('Failed to save details:', error);
            alert('Fout bij opslaan details.');
        } finally {
            setDetailSaving(false);
        }
    };

    if (permissionLoading) return <div className="p-8 text-center text-theme-purple-lighter">Toegang controleren...</div>;
    if (!isAuthorized) return <div className="p-8 text-center text-red-400">Geen toegang</div>;

    const normalizedCommittees = committees.map(c => ({
        ...c,
        isStandard: STANDARD_COMMITTEE_NAMES.includes(c.name.toLowerCase().replace(/\s*(\|\||\|)\s*salve mundi/gi, '').trim())
    })).sort((a, b) => {
        // Sort by standard vs not standard first
        if (a.isStandard && !b.isStandard) return -1;
        if (!a.isStandard && b.isStandard) return 1;
        // Then sort alphabetically within those groups
        return a.name.localeCompare(b.name);
    });

    const filteredCommittees = normalizedCommittees.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
        if (!matchesSearch) return false;

        if (showAll) return true;
        return c.isStandard;
    });

    return (
        <div className="min-h-screen bg-[var(--bg-main)]">
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-theme-purple-lighter flex items-center gap-3">
                            <Shield className="h-8 w-8" />
                            Commissie Beheer
                        </h1>
                        <p className="mt-1 text-sm text-theme-purple-lighter/60">
                            Beheer leden en leiders van Salve Mundi commissies via Azure AD.
                        </p>
                    </div>
                    <button
                        onClick={loadCommittees}
                        className="flex items-center gap-2 px-4 py-2 bg-theme-purple/20 hover:bg-theme-purple/30 text-theme-purple-lighter rounded-xl border border-theme-purple/30 transition-all"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        Verversen
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Committee List */}
                    <div className="lg:col-span-6 space-y-4">
                        <Tile title="Commissies" icon={<Users className="h-5 w-5" />}>
                            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-theme-purple-lighter/40" />
                                    <input
                                        type="text"
                                        placeholder="Zoek commissie..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-theme-purple-lighter focus:ring-2 focus:ring-theme-purple outline-none"
                                    />
                                </div>
                                <button
                                    onClick={() => setShowAll(!showAll)}
                                    className={`px-4 py-2 rounded-xl border transition-all text-xs font-semibold whitespace-nowrap ${showAll
                                        ? 'bg-theme-purple/40 border-theme-purple/60 text-white'
                                        : 'bg-white/5 border-white/10 text-theme-purple-lighter/60 hover:bg-white/10'
                                        }`}
                                >
                                    {showAll ? 'Standaard Weergave' : 'Toon Alle Commissies'}
                                </button>
                            </div>

                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                                {loading && <div className="text-center py-4"><Loader2 className="h-6 w-6 animate-spin mx-auto text-theme-purple" /></div>}
                                {!loading && filteredCommittees.length === 0 && <div className="text-center py-4 text-theme-purple-lighter/40">Geen commissies gevonden</div>}
                                {filteredCommittees.map(c => (
                                    <div key={c.id} className="relative group">
                                        <button
                                            onClick={() => loadCommitteeMembers(c)}
                                            className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${selectedCommittee?.id === c.id
                                                ? 'bg-theme-purple/20 border-theme-purple/40 text-theme-purple-lighter'
                                                : 'bg-white/5 border-white/5 text-theme-purple-lighter/60 hover:bg-white/10 hover:border-white/20'
                                                }`}
                                        >
                                            <div className="text-left min-w-0 flex-1">
                                                <div className="font-semibold truncate">{c.name}</div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[10px] opacity-30 font-mono">ID: {c.id}</span>
                                                    {c.email && <span className="text-[10px] opacity-50 truncate">• {c.email}</span>}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {!c.azureGroupId ? (
                                                    <span title="Geen Azure Groep gekoppeld" className="shrink-0 mr-1">
                                                        <Info className="h-4 w-4 text-amber-400" />
                                                    </span>
                                                ) : null}
                                                <div className="hidden group-hover:flex items-center shrink-0">
                                                    <a
                                                        href={`/commissies/${slugify(c.name)}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="p-1 hover:text-theme-purple-lighter transition-colors"
                                                        title="Bekijk op website"
                                                    >
                                                        <ExternalLink className="h-4 w-4" />
                                                    </a>
                                                </div>
                                            </div>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </Tile>
                    </div>

                    {/* Member Management */}
                    <div className="lg:col-span-6 sticky top-8">
                        {selectedCommittee ? (
                            <Tile
                                title={selectedCommittee.name}
                                icon={<Users className="h-5 w-5" />}
                                actions={
                                    <div className="flex items-center gap-2">
                                        {selectedCommittee.email && (
                                            <div className="hidden sm:flex items-center gap-2 text-xs text-theme-purple-lighter/60 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                                                <Mail className="h-3 w-3" />
                                                {selectedCommittee.email}
                                            </div>
                                        )}
                                        <button
                                            onClick={() => setIsEditingDetail(!isEditingDetail)}
                                            className={`p-2 rounded-xl border transition-all ${isEditingDetail ? 'bg-theme-purple/40 border-theme-purple/60 text-white' : 'bg-white/5 border-white/10 text-theme-purple-lighter/60 hover:bg-white/10'}`}
                                            title="Bewerk details"
                                        >
                                            <Settings className="h-4 w-4" />
                                        </button>
                                    </div>
                                }
                            >
                                {isEditingDetail ? (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-xs font-semibold text-theme-purple-lighter/60 mb-2 uppercase tracking-wider">Korte Beschrijving</label>
                                                    <textarea
                                                        value={editShortDescription}
                                                        onChange={(e) => setEditShortDescription(e.target.value)}
                                                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-theme-purple-lighter focus:ring-2 focus:ring-theme-purple outline-none min-h-[100px]"
                                                        placeholder="Korte tekst voor op de overzichtskaart..."
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-theme-purple-lighter/60 mb-2 uppercase tracking-wider">Banner Afbeelding</label>
                                                    <div className="flex flex-col gap-3">
                                                        {selectedCommittee.image && !editImageFile && (
                                                            <div className="relative h-32 w-full rounded-xl overflow-hidden border border-white/10">
                                                                <img src={getImageUrl(selectedCommittee.image)} alt="Huidige banner" className="object-cover w-full h-full" />
                                                            </div>
                                                        )}
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={(e) => setEditImageFile(e.target.files?.[0] || null)}
                                                            className="text-xs text-theme-purple-lighter/60 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-theme-purple/20 file:text-theme-purple-lighter hover:file:bg-theme-purple/30"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-theme-purple-lighter/60 mb-2 uppercase tracking-wider">Volledige Beschrijving (HTML)</label>
                                                <textarea
                                                    value={editDescription}
                                                    onChange={(e) => setEditDescription(e.target.value)}
                                                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-theme-purple-lighter font-mono focus:ring-2 focus:ring-theme-purple outline-none h-[calc(100%-2rem)] min-h-[250px]"
                                                    placeholder="Uitgebreide omschrijving voor de detailpagina..."
                                                />
                                            </div>
                                        </div>
                                        <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                                            <button
                                                onClick={() => setIsEditingDetail(false)}
                                                className="px-6 py-2 bg-white/5 hover:bg-white/10 text-theme-purple-lighter/60 rounded-xl transition-all"
                                            >
                                                Annuleren
                                            </button>
                                            <button
                                                onClick={handleSaveDetails}
                                                disabled={detailSaving}
                                                className="px-6 py-2 bg-theme-purple/20 hover:bg-theme-purple/30 text-theme-purple-lighter rounded-xl border border-theme-purple/40 transition-all font-semibold flex items-center gap-2"
                                            >
                                                {detailSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
                                                Details Opslaan
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        {/* Add Member Form */}
                                        <form onSubmit={handleAddMember} className="mb-8 p-4 bg-white/5 rounded-2xl border border-white/5">
                                            <h3 className="text-sm font-semibold text-theme-purple-lighter mb-3 flex items-center gap-2">
                                                <UserPlus className="h-4 w-4" />
                                                Lid Toevoegen
                                            </h3>
                                            <div className="flex gap-2">
                                                <input
                                                    type="email"
                                                    placeholder="E-mailadres (student.fontys.nl of salvemundi.nl)..."
                                                    value={newUserEmail}
                                                    onChange={(e) => setNewUserEmail(e.target.value)}
                                                    required
                                                    className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-sm text-theme-purple-lighter focus:ring-2 focus:ring-theme-purple outline-none"
                                                />
                                                <button
                                                    type="submit"
                                                    disabled={!!actionLoading || !newUserEmail}
                                                    className="px-6 py-2 bg-theme-purple/20 hover:bg-theme-purple/30 text-theme-purple-lighter rounded-xl border border-theme-purple/40 transition-all font-semibold disabled:opacity-50 flex items-center gap-2"
                                                >
                                                    {actionLoading === 'add' ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                                                    Toevoegen
                                                </button>
                                            </div>
                                            <p className="mt-2 text-[10px] text-theme-purple-lighter/40">
                                                * Toevoegen gebeurt direct in Azure AD. De synchronisatie naar Directus volgt automatisch.
                                            </p>
                                        </form>

                                        {/* Members List */}
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <h3 className="text-sm font-semibold text-theme-purple-lighter">Huidige Leden ({azureMembers.length})</h3>
                                                <div className="text-[10px] text-theme-purple-lighter/40 italic">Data vanuit Microsoft Graph</div>
                                            </div>

                                            {membersLoading ? (
                                                <div className="py-12 text-center">
                                                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-theme-purple mb-2" />
                                                    <div className="text-theme-purple-lighter/60">Leden ophalen...</div>
                                                </div>
                                            ) : azureMembers.length === 0 ? (
                                                <div className="py-12 text-center text-theme-purple-lighter/30 border border-dashed border-white/10 rounded-2xl">
                                                    Geen leden gevonden in deze Azure groep.
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {azureMembers.map(member => {
                                                        const isLeader = isMemberLeader(member.id);
                                                        return (
                                                            <div key={member.id} className="p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between gap-2 group hover:bg-white/10 transition-all">
                                                                <div className="min-w-0 flex-1 flex items-center gap-3">
                                                                    <div className="min-w-0 flex-1">
                                                                        <div className="font-bold text-theme-purple-lighter truncate flex items-center gap-2">
                                                                            {member.displayName}
                                                                            {isLeader && (
                                                                                <span className="shrink-0 px-2 py-0.5 bg-amber-400/20 text-amber-400 text-[10px] font-bold rounded-full border border-amber-400/20 uppercase tracking-wider">
                                                                                    Leider
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <div className="text-xs text-theme-purple-lighter/50 truncate">{member.mail || member.userPrincipalName}</div>
                                                                    </div>
                                                                </div>
                                                                <div className="hidden group-hover:flex items-center gap-1 shrink-0">
                                                                    <button
                                                                        onClick={() => handleToggleLeader(member.id)}
                                                                        disabled={!!actionLoading}
                                                                        title={isLeader ? "Verwijder leider status" : "Maak commissie leider"}
                                                                        className={`p-2 rounded-lg transition-all ${isLeader ? 'bg-amber-400/20 text-amber-400' : 'hover:bg-amber-400/20 text-amber-400/60 hover:text-amber-400'}`}
                                                                    >
                                                                        {actionLoading === `leader-${member.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleRemoveMember(member.id)}
                                                                        disabled={!!actionLoading}
                                                                        title="Verwijderen uit commissie"
                                                                        className="p-2 hover:bg-red-400/20 text-red-400/60 hover:text-red-400 rounded-lg transition-all"
                                                                    >
                                                                        {actionLoading === `remove-${member.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserMinus className="h-4 w-4" />}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </Tile>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center p-12 bg-white/5 border border-dashed border-white/10 rounded-[2rem] text-theme-purple-lighter/40">
                                <Users className="h-16 w-16 mb-4 opacity-20" />
                                <p>Selecteer een commissie om de leden te beheren.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
