'use client';

import React from 'react';
import { 
    Users, 
    UserPlus, 
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
import type { Committee, CommitteeMember } from '@/server/actions/admin-committees.actions';

interface Props {
    selected: Committee;
    members: CommitteeMember[];
    membersLoading: boolean;
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
    onAddMember: (e: React.FormEvent) => void;
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
    membersLoading,
    actionLoading,
    editingDetail,
    onToggleEditing,
    editShortDesc,
    onShortDescChange,
    editDesc,
    onDescChange,
    onSaveDetail,
    savingDetail,
    newMemberEmail,
    onNewMemberEmailChange,
    onAddMember,
    addingMember,
    addError,
    onRemoveMember,
    onToggleLeader
}: Props) {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            {/* Header / Info Section */}
            <div className="bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] shadow-xl ring-1 ring-[var(--beheer-border)] p-10 border-t-8 border-[var(--beheer-accent)] relative overflow-hidden">
                <div className="absolute -top-24 -right-24 h-48 w-48 bg-[var(--beheer-accent)]/5 blur-3xl rounded-full" />
                
                <div className="flex flex-col md:flex-row justify-between items-start gap-8 relative z-10">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-5 mb-5">
                            <div className="h-16 w-16 rounded-2xl bg-[var(--beheer-accent)]/10 text-[var(--beheer-accent)] flex items-center justify-center shadow-inner group">
                                <Users className="h-8 w-8 group-hover:scale-110 transition-transform" />
                            </div>
                            <div className="min-w-0">
                                <h2 className="text-3xl font-black text-[var(--beheer-text)] leading-tight uppercase tracking-tight truncate">
                                    {selected.name}
                                </h2>
                                {selected.email && (
                                    <div className="flex items-center gap-2 mt-1.5">
                                        <Mail className="h-4 w-4 text-[var(--beheer-accent)]" />
                                        <span className="text-[var(--beheer-text-muted)] font-black uppercase tracking-widest text-[10px] opacity-60">{selected.email}</span>
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

                    <div className="flex gap-3 flex-shrink-0">
                        <a
                            href={`/vereniging/commissies/${slugify(selected.name)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-6 py-3 bg-[var(--beheer-card-soft)] text-[var(--beheer-text)] rounded-xl font-black text-[10px] uppercase tracking-widest border border-[var(--beheer-border)] hover:bg-[var(--beheer-accent)] hover:text-white hover:border-[var(--beheer-accent)] transition-all shadow-sm active:scale-95"
                        >
                            <ExternalLink className="h-4 w-4" /> Website
                        </a>
                        <button
                            onClick={onToggleEditing}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-sm active:scale-95 border ${editingDetail ? 'bg-[var(--beheer-accent)] text-white border-[var(--beheer-accent)]' : 'bg-[var(--beheer-card-soft)] text-[var(--beheer-text)] border-[var(--beheer-border)] hover:bg-white'}`}
                        >
                            <Settings className={`h-4 w-4 ${editingDetail ? 'animate-spin' : ''}`} /> {editingDetail ? 'Annuleren' : 'Details'}
                        </button>
                    </div>
                </div>

                {editingDetail && (
                    <div className="mt-10 pt-10 border-t border-[var(--beheer-border)] space-y-8 relative z-10 animate-in slide-in-from-top-4 duration-300">
                        <div className="grid grid-cols-1 gap-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase text-[var(--beheer-text-muted)] tracking-[0.2em] opacity-60">Preview Tekst</label>
                                <textarea
                                    value={editShortDesc}
                                    onChange={e => onShortDescChange(e.target.value)}
                                    rows={2}
                                    className="w-full px-6 py-4 rounded-xl bg-[var(--beheer-card-soft)] border-none text-sm text-[var(--beheer-text)] placeholder:text-[var(--beheer-text-muted)] focus:ring-4 focus:ring-[var(--beheer-accent)]/10 transition-all resize-none font-medium leading-relaxed"
                                    placeholder="Korte pakkende tekst over de commissie..."
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase text-[var(--beheer-text-muted)] tracking-[0.2em] opacity-60">Volledige Beschrijving (Markdown)</label>
                                <textarea
                                    value={editDesc}
                                    onChange={e => onDescChange(e.target.value)}
                                    rows={12}
                                    className="w-full px-6 py-4 rounded-xl bg-[var(--beheer-card-soft)] border-none text-sm text-[var(--beheer-text)] placeholder:text-[var(--beheer-text-muted)] focus:ring-4 focus:ring-[var(--beheer-accent)]/10 transition-all font-mono leading-relaxed"
                                    placeholder="### Onze missie..."
                                />
                            </div>
                        </div>
                        <button
                            onClick={onSaveDetail}
                            disabled={savingDetail}
                            className="w-full flex items-center justify-center gap-3 py-5 bg-[var(--beheer-accent)] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-[var(--beheer-accent)]/20 hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50"
                        >
                            {savingDetail ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                            Wijzigingen Opslaan
                        </button>
                    </div>
                )}
            </div>

            {/* Member Management Section */}
            <div className="bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] shadow-xl ring-1 ring-[var(--beheer-border)] overflow-hidden">
                <div className="p-8 md:p-10 border-b border-[var(--beheer-border)] bg-[var(--beheer-card-soft)]/30 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                    <div>
                        <h3 className="text-xl font-black text-[var(--beheer-text)] uppercase tracking-tight flex items-center gap-2">
                            <Shield className="h-5 w-5 text-[var(--beheer-accent)]" />
                            Leden & Azure Rechten
                        </h3>
                        <p className="text-[10px] text-[var(--beheer-text-muted)] font-black uppercase tracking-widest mt-1 opacity-60">Synchroniseer toegang tot office groepen</p>
                    </div>
                    
                    {selected.azure_group_id ? (
                        <div className="flex-1 max-w-lg">
                            <form onSubmit={onAddMember} className="relative group">
                                <div className="absolute left-5 top-1/2 -translate-y-1/2 flex items-center gap-2 text-[var(--beheer-text-muted)] group-focus-within:text-[var(--beheer-accent)] transition-colors opacity-50">
                                    <UserPlus className="h-4 w-4" />
                                </div>
                                <input
                                    type="email"
                                    placeholder="Kopieer e-mail om lid toe te voegen..."
                                    value={newMemberEmail}
                                    onChange={e => onNewMemberEmailChange(e.target.value)}
                                    required
                                    className="w-full pl-14 pr-32 py-4 bg-[var(--beheer-card-bg)] border border-[var(--beheer-border)] rounded-2xl text-[11px] font-black uppercase tracking-widest text-[var(--beheer-text)] placeholder:text-[var(--beheer-text-muted)] focus:ring-4 focus:ring-[var(--beheer-accent)]/10 focus:border-[var(--beheer-accent)] transition-all"
                                />
                                <button
                                    type="submit"
                                    disabled={addingMember || !newMemberEmail}
                                    className="absolute right-2 top-2 bottom-2 px-6 bg-[var(--beheer-accent)] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:opacity-90 transition-all disabled:opacity-50 active:scale-95"
                                >
                                    {addingMember ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Toevoegen'}
                                </button>
                            </form>
                            {addError && (
                                <p className="mt-3 text-red-500 text-[9px] font-black uppercase tracking-widest flex items-center gap-2 px-2 animate-bounce">
                                    <ShieldAlert className="h-3 w-3" /> {addError}
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="px-6 py-3 bg-[var(--beheer-card-soft)] text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase tracking-widest rounded-xl flex items-center gap-2 border border-amber-500/20 shadow-sm">
                            <ShieldAlert className="h-4 w-4" /> Geen Azure-koppeling
                        </div>
                    )}
                </div>

                <div className="p-8 md:p-10">
                    {membersLoading ? (
                        <div className="py-24 text-center">
                            <Loader2 className="h-10 w-10 text-[var(--beheer-accent)] animate-spin mx-auto mb-4" />
                            <p className="text-[var(--beheer-text-muted)] font-black uppercase tracking-widest text-[10px] opacity-40">Lidmaatschappen synchroniseren...</p>
                        </div>
                    ) : members.length === 0 ? (
                        <div className="py-24 text-center bg-[var(--beheer-card-soft)]/20 rounded-[var(--beheer-radius)] border-2 border-dashed border-[var(--beheer-border)]">
                            <Users className="h-12 w-12 text-[var(--beheer-text-muted)] opacity-10 mx-auto mb-4" />
                            <p className="text-[var(--beheer-text-muted)] font-black uppercase tracking-widest text-[10px] opacity-40 italic">Nog geen leden in deze groep</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {members.map(member => (
                                <div
                                    key={member.entraId}
                                    className="group flex items-center justify-between p-5 bg-[var(--beheer-card-bg)] rounded-3xl shadow-sm border border-[var(--beheer-border)] hover:border-[var(--beheer-accent)]/50 transition-all hover:shadow-xl hover:scale-[1.02]"
                                >
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className="h-12 w-12 shrink-0 rounded-2xl bg-[var(--beheer-card-soft)] flex items-center justify-center text-[var(--beheer-text-muted)] font-black text-xs shadow-inner">
                                            {member.displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="font-black text-[var(--beheer-text)] text-xs uppercase tracking-tight truncate flex items-center gap-2">
                                                {member.displayName}
                                                {member.isLeader && (
                                                    <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-500 text-white text-[8px] font-black rounded-full uppercase tracking-tighter shadow-sm animate-pulse">
                                                        <Award className="h-2 w-2" /> Leider
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-[10px] text-[var(--beheer-text-muted)] font-bold truncate opacity-60 mt-0.5">{member.email}</div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-1 translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                                        {member.directusMembershipId && (
                                            <button
                                                onClick={() => onToggleLeader(member)}
                                                disabled={!!actionLoading}
                                                className={`p-3 rounded-xl transition-all shadow-sm ${member.isLeader ? 'bg-amber-100 text-amber-600' : 'bg-[var(--beheer-card-soft)] text-[var(--beheer-text-muted)] hover:text-amber-500 hover:bg-amber-50'}`}
                                                title="Rechten status omschakelen"
                                            >
                                                {actionLoading === `leader-${member.entraId}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Award className="h-4 w-4" />}
                                            </button>
                                        )}
                                        {selected.azure_group_id && (
                                            <button
                                                onClick={() => onRemoveMember(member)}
                                                disabled={!!actionLoading}
                                                className="p-3 bg-[var(--beheer-card-soft)] text-[var(--beheer-text-muted)] hover:text-red-500 hover:bg-red-50 rounded-xl transition-all shadow-sm"
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
                    <p className="text-[10px] text-[var(--beheer-text-muted)] font-bold italic leading-relaxed uppercase tracking-tight">
                        Let op: Wijzigingen via Azure (Entra ID) service duren circa 2-5 minuten voordat ze volledig verwerkt en zichtbaar zijn in de website cache.
                    </p>
                </div>
            </div>
        </div>
    );
}
