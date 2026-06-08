'use client';

import {
    Users,
    UserMinus,
    Shield,
    Mail,
    Info,
    Award,
    ShieldAlert,
    Settings,
    Save,
    ExternalLink,
    Loader2
} from 'lucide-react';
import type { Committee, CommitteeMember } from '@/server/queries/admin-commissies.queries';
import { type UserBasic } from '@/server/internal/user-db.utils';
import UserSearch from '@/components/ui/admin/UserSearch';

interface Props {
    selected: Committee;
    members: CommitteeMember[];
    isUpdating: boolean;
    actionLoading: string | null;
    editingDetail: boolean;
    onToggleEditing: () => void;
    editShortDesc: string;
    onShortDescChange: (v: string) => void;
    editDesc: string;
    onDescChange: (v: string) => void;
    onSaveDetail: () => void;
    savingDetail: boolean;
    newMemberEmail: string;
    onNewMemberEmailChange: (v: string) => void;
    onAddMember: (user: UserBasic) => void;
    addingMember: boolean;
    addError: string | null;
    onRemoveMember: (m: CommitteeMember) => void;
    onToggleLeader: (m: CommitteeMember) => void;
}

const slugify = (name: string) =>
    name.toLowerCase().replace(/\s*(\|\||\|)\s*salve mundi/gi, '').trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

export default function CommitteeDetail({
    selected,
    members,
    isUpdating,
    actionLoading,
    editingDetail,
    onToggleEditing,
    editShortDesc,
    onShortDescChange,
    editDesc,
    onDescChange,
    onSaveDetail,
    savingDetail,
    // FIX: Alias de properties naar de underscored versies om TS te pleasen en de Zero Warning Policy te volgen
    newMemberEmail: _newMemberEmail,
    onNewMemberEmailChange: _onNewMemberEmailChange,
    onAddMember,
    addingMember,
    addError,
    onRemoveMember,
    onToggleLeader
}: Props) {
    return (
        <div className="space-y-8">
            {/* Header / Info Section */}
            <div className="bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] shadow-xl ring-1 ring-[var(--beheer-border)] p-6 md:p-10 border-t-8 border-[var(--beheer-accent)] relative overflow-hidden">
                <div className="absolute -top-24 -right-24 h-48 w-48 bg-[var(--beheer-accent)]/5 blur-3xl rounded-full" />

                <div className="flex flex-col md:flex-row justify-between items-start gap-8 relative z-10">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-5 mb-5">
                            <div className="h-16 w-16 rounded-2xl bg-[var(--beheer-accent)]/10 text-[var(--beheer-accent)] flex items-center justify-center shadow-inner group">
                                <Users className="h-8 w-8 group-hover:scale-110 transition-transform" />
                            </div>
                            <div className="min-w-0">
                                <h2 className="text-2xl md:text-3xl font-semibold text-[var(--beheer-text)] leading-tight tracking-tight">
                                    {selected.name}
                                </h2>
                                {selected.email && (
                                    <div className="flex items-center gap-2 mt-1.5">
                                        <Mail className="h-4 w-4 text-[var(--beheer-accent)]" />
                                        <span className="text-[var(--beheer-text-muted)] font-medium text-xs opacity-60">{selected.email}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {!editingDetail && (
                            <p className="text-[var(--beheer-text-muted)] font-medium text-base leading-relaxed mb-6 line-clamp-3">
                                {selected.short_description || 'Geen beschrijving beschikbaar.'}
                            </p>
                        )}
                    </div>

                    <div className="flex flex-wrap gap-3 flex-shrink-0 w-full md:w-auto">
                        <a
                            href={`/commissies/${slugify(selected.name)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-[var(--beheer-card-soft)] text-[var(--beheer-text)] rounded-xl font-semibold text-xs border border-[var(--beheer-border)] hover:bg-[var(--beheer-accent)] hover:text-white hover:border-[var(--beheer-accent)] transition-all shadow-sm active:scale-95"
                        >
                            <ExternalLink className="h-4 w-4" /> Website
                        </a>
                        <button
                            onClick={onToggleEditing}
                            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-xs transition-all shadow-sm active:scale-95 border ${editingDetail ? 'bg-[var(--beheer-accent)] text-white border-[var(--beheer-accent)]' : 'bg-[var(--beheer-card-soft)] text-[var(--beheer-text)] border-[var(--beheer-border)] hover:bg-white dark:hover:bg-white/5'}`}
                        >
                            <Settings className={`h-4 w-4 ${editingDetail ? 'animate-spin' : ''}`} /> {editingDetail ? 'Annuleren' : 'Details'}
                        </button>
                    </div>
                </div>

                {editingDetail && (
                    <div className="mt-10 pt-10 border-t border-[var(--beheer-border)] space-y-8 relative z-10">
                        <div className="grid grid-cols-1 gap-8">
                            <div className="space-y-3">
                                <label className="text-xs font-semibold text-[var(--beheer-text-muted)] opacity-60">Preview tekst</label>
                                <textarea
                                    value={editShortDesc}
                                    onChange={e => onShortDescChange(e.target.value)}
                                    rows={2}
                                    autoComplete="off"
                                    className="w-full px-6 py-4 rounded-xl bg-[var(--beheer-card-soft)] border-none text-sm text-[var(--beheer-text)] placeholder:text-[var(--beheer-text-muted)] focus:ring-4 focus:ring-[var(--beheer-accent)]/10 transition-all resize-none font-medium leading-relaxed"
                                    placeholder="Korte pakkende tekst over de commissie..."
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-xs font-semibold text-[var(--beheer-text-muted)] opacity-60">Volledige beschrijving (Markdown)</label>
                                <textarea
                                    value={editDesc}
                                    onChange={e => onDescChange(e.target.value)}
                                    rows={12}
                                    autoComplete="off"
                                    className="w-full px-6 py-4 rounded-xl bg-[var(--beheer-card-soft)] border-none text-sm text-[var(--beheer-text)] placeholder:text-[var(--beheer-text-muted)] focus:ring-4 focus:ring-[var(--beheer-accent)]/10 transition-all font-mono leading-relaxed"
                                    placeholder="### Onze missie..."
                                />
                            </div>
                        </div>
                        <button
                            onClick={onSaveDetail}
                            disabled={savingDetail}
                            className="w-full flex items-center justify-center gap-3 py-5 bg-[var(--beheer-accent)] text-white rounded-2xl font-semibold text-sm shadow-xl shadow-[var(--beheer-accent)]/20 hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50"
                        >
                            {savingDetail ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                            Wijzigingen Opslaan
                        </button>
                    </div>
                )}
            </div>

            {/* Member Management Section */}
            <div className="bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] shadow-xl ring-1 ring-[var(--beheer-border)] overflow-hidden">
                <div className="p-6 md:p-10 border-b border-[var(--beheer-border)] bg-[var(--beheer-card-soft)]/30 flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-8">
                    <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-semibold text-[var(--beheer-text)] flex items-center gap-2">
                            <Shield className="h-5 w-5 text-[var(--beheer-accent)]" />
                            Leden & Azure rechten
                        </h3>
                        <p className="text-xs text-[var(--beheer-text-muted)] font-medium mt-1 opacity-60">Synchroniseer toegang tot Office groepen</p>
                    </div>

                    {selected.azure_group_id ? (
                        <div className="flex-1 w-full md:max-w-md lg:max-w-lg">
                            <UserSearch
                                onSelect={onAddMember}
                                disabled={addingMember}
                                placeholder="Zoek lid op naam om toe te voegen..."
                            />
                            {addError && (
                                <p className="mt-3 text-red-500 text-xs font-semibold flex items-center gap-2 px-2">
                                    <ShieldAlert className="h-3 w-3" /> {addError}
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="flex-1 w-full md:max-w-md lg:max-w-lg">
                            <div className="px-6 py-3 bg-[var(--beheer-card-soft)] text-amber-600 dark:text-amber-400 text-xs font-semibold rounded-xl flex items-center gap-2 border border-amber-500/20 shadow-sm">
                                <ShieldAlert className="h-4 w-4" /> Geen Azure-koppeling
                            </div>
                        </div>
                    )}
                </div>

                <div className={`p-6 md:p-10 transition-opacity duration-300 ${isUpdating ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                    {members.length === 0 ? (
                        <div className="py-24 text-center bg-[var(--beheer-card-soft)]/20 rounded-[var(--beheer-radius)] border-2 border-dashed border-[var(--beheer-border)]">
                            <Users className="h-12 w-12 text-[var(--beheer-text-muted)] opacity-10 mx-auto mb-4" />
                            <p className="text-[var(--beheer-text-muted)] font-semibold text-sm opacity-40 italic">Nog geen leden in deze groep</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {members.map(member => (
                                <div
                                    key={member.entraId}
                                    className="group flex items-center justify-between p-5 bg-[var(--beheer-card-bg)] rounded-3xl shadow-sm border border-[var(--beheer-border)] hover:border-[var(--beheer-accent)]/50 transition-all hover:shadow-xl hover:scale-[1.02]"
                                >
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className="h-12 w-12 shrink-0 rounded-2xl bg-[var(--beheer-card-soft)] flex items-center justify-center text-[var(--beheer-text-muted)] font-semibold text-xs shadow-inner">
                                            {member.displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="font-semibold text-[var(--beheer-text)] text-sm truncate flex items-center gap-2">
                                                {member.displayName}
                                                {member.isLeader && (
                                                    <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-500 text-white text-[9px] font-semibold rounded-full shadow-sm">
                                                        <Award className="h-2 w-2" /> Leider
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-xs text-[var(--beheer-text-muted)] font-medium truncate opacity-60 mt-0.5">{member.email}</div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1">
                                        {member.directusMembershipId && (
                                            <button
                                                onClick={() => onToggleLeader(member)}
                                                disabled={!!actionLoading}
                                                className={`p-3 rounded-xl transition-all shadow-sm ${member.isLeader ? 'bg-amber-100 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400' : 'bg-[var(--beheer-card-soft)] text-[var(--beheer-text-muted)] hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/20 dark:hover:text-amber-400'}`}
                                                title="Rechten status omschakelen"
                                            >
                                                {actionLoading === `leader-${member.entraId}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Award className="h-4 w-4" />}
                                            </button>
                                        )}
                                        {selected.azure_group_id && (
                                            <button
                                                onClick={() => onRemoveMember(member)}
                                                disabled={!!actionLoading}
                                                className="p-3 bg-[var(--beheer-card-soft)] text-[var(--beheer-text-muted)] hover:text-red-500 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-950/20 rounded-xl transition-all shadow-sm"
                                                title="Verwijderen uit Azure groep"
                                            >
                                                {actionLoading === `remove-${member.entraId}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserMinus className="h-4 w-4" />}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="px-10 py-5 bg-[var(--beheer-card-soft)]/20 flex items-start gap-3 border-t border-[var(--beheer-border)]">
                    <Info className="h-4 w-4 text-[var(--beheer-accent)] mt-0.5 shrink-0" />
                    <p className="text-xs text-[var(--beheer-text-muted)] font-medium italic leading-relaxed">
                        Let op: Wijzigingen via Azure (Entra ID) service duren circa 2-5 minuten voordat ze volledig verwerkt en zichtbaar zijn in de website cache.
                    </p>
                </div>
            </div>
        </div>
    );
}
