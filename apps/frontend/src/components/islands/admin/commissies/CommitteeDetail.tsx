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
import type { Committee, CommitteeMember } from '@/server/queries/commissies/admin-commissies.queries';
import { type UserBasic } from '@salvemundi/validations';
import AdminLedenSearch from '@/components/ui/admin/AdminLedenSearch';

interface Props {
    selected: Committee;
    members: CommitteeMember[];
    isUpdating: boolean;
    actionLoading: string | null;
    editingDetail: boolean;
    onToggleEditing: () => void;
    editShortDesc: string;
    onShortDescChange: (descValue: string) => void;
    editDesc: string;
    onDescChange: (descValue: string) => void;
    onSaveDetail: () => void;
    savingDetail: boolean;
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
    onAddMember,
    addingMember,
    addError,
    onRemoveMember,
    onToggleLeader
}: Props) {
    return (
        <div className="space-y-8">
            {/* Header / Info Section */}
            <div className="relative overflow-hidden rounded-(--beheer-radius) border-t-8 border-(--beheer-accent) bg-(--beheer-card-bg) p-6 shadow-xl ring-1 ring-(--beheer-border) md:p-10">
                <div className="absolute -top-24 -right-24 size-48 rounded-full bg-(--beheer-accent)/5 blur-3xl" />

                <div className="relative z-10 flex flex-col items-start justify-between gap-8 md:flex-row">
                    <div className="min-w-0 flex-1">
                        <div className="mb-5 flex items-center gap-5">
                            <div className="group flex size-16 items-center justify-center rounded-2xl bg-(--beheer-accent)/10 text-(--beheer-accent) shadow-inner">
                                <Users className="size-8 transition-transform group-hover:scale-110" />
                            </div>
                            <div className="min-w-0">
                                <h2 className="text-2xl leading-tight font-semibold tracking-tight text-(--beheer-text) md:text-3xl">
                                    {selected.name}
                                </h2>
                                {selected.email && (
                                    <div className="mt-1.5 flex items-center gap-2">
                                        <Mail className="size-4 text-(--beheer-accent)" />
                                        <span className="text-xs font-medium text-(--beheer-text-muted) opacity-60">{selected.email}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {!editingDetail && (
                            <p className="mb-6 line-clamp-3 text-base leading-relaxed font-medium text-(--beheer-text-muted)">
                                {selected.short_description || 'Geen beschrijving beschikbaar.'}
                            </p>
                        )}
                    </div>

                    <div className="flex w-full shrink-0 flex-wrap gap-3 md:w-auto">
                        <a
                            href={`/commissies/${slugify(selected.name)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-(--beheer-border) bg-(--beheer-card-soft) px-6 py-3 text-xs font-semibold text-(--beheer-text) shadow-sm transition-all hover:border-(--beheer-accent) hover:bg-(--beheer-accent) hover:text-white active:scale-95 md:flex-none"
                        >
                            <ExternalLink className="size-4" /> Website
                        </a>
                        <button
                            onClick={onToggleEditing}
                            className={`beheer-button flex flex-1 items-center justify-center gap-2 rounded-xl border px-6 py-3 text-xs font-semibold shadow-sm transition-all active:scale-95 md:flex-none ${editingDetail ? 'border-(--beheer-accent) bg-(--beheer-accent) text-white' : 'border-(--beheer-border) bg-(--beheer-card-soft) text-(--beheer-text) hover:bg-white dark:hover:bg-white/5'}`}
                        >
                            <Settings className={`size-4 ${editingDetail ? 'animate-spin' : ''}`} /> {editingDetail ? 'Annuleren' : 'Details'}
                        </button>
                    </div>
                </div>

                {editingDetail && (
                    <div className="relative z-10 mt-10 space-y-8 border-t border-(--beheer-border) pt-10">
                        <div className="grid grid-cols-1 gap-8">
                            <div className="space-y-3">
                                <label className="text-xs font-semibold text-(--beheer-text-muted) opacity-60">Preview tekst</label>
                                <textarea
                                    value={editShortDesc}
                                    onChange={e => onShortDescChange(e.target.value)}
                                    rows={2}
                                    autoComplete="off"
                                    className="beheer-input w-full resize-none rounded-xl border-none bg-(--beheer-card-soft) px-6 py-4 text-sm leading-relaxed font-medium text-(--beheer-text) transition-all placeholder:text-(--beheer-text-muted) focus:ring-(--beheer-accent)/10"
                                    placeholder="Korte pakkende tekst over de commissie..."
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-xs font-semibold text-(--beheer-text-muted) opacity-60">Volledige beschrijving (Markdown)</label>
                                <textarea
                                    value={editDesc}
                                    onChange={e => onDescChange(e.target.value)}
                                    rows={12}
                                    autoComplete="off"
                                    className="beheer-input w-full rounded-xl border-none bg-(--beheer-card-soft) px-6 py-4 font-mono text-sm leading-relaxed text-(--beheer-text) transition-all placeholder:text-(--beheer-text-muted) focus:ring-(--beheer-accent)/10"
                                    placeholder="### Onze missie..."
                                />
                            </div>
                        </div>
                        <button
                            onClick={onSaveDetail}
                            disabled={savingDetail}
                            className="active:scale-0.98 beheer-button flex w-full items-center justify-center gap-3 rounded-2xl bg-(--beheer-accent) py-5 text-sm font-semibold text-white shadow-(--beheer-accent)/20 shadow-xl transition-all hover:opacity-90 disabled:opacity-50"
                        >
                            {savingDetail ? <Loader2 className="size-5 animate-spin" /> : <Save className="size-5" />}
                            Wijzigingen Opslaan
                        </button>
                    </div>
                )}
            </div>

            {/* Member Management Section */}
            <div className="overflow-hidden rounded-(--beheer-radius) bg-(--beheer-card-bg) shadow-xl ring-1 ring-(--beheer-border)">
                <div className="flex flex-col justify-between gap-6 border-b border-(--beheer-border) bg-(--beheer-card-soft)/30 p-6 md:flex-row md:items-center md:gap-8 md:p-10">
                    <div className="min-w-0 flex-1">
                        <h3 className="flex items-center gap-2 text-xl font-semibold text-(--beheer-text)">
                            <Shield className="size-5 text-(--beheer-accent)" />
                            {"Leden & Azure rechten"}
                        </h3>
                        <p className="mt-1 text-xs font-medium text-(--beheer-text-muted) opacity-60">Synchroniseer toegang tot Office groepen</p>
                    </div>

                    {selected.azure_group_id ? (
                        <div className="w-full flex-1 md:max-w-md lg:max-w-lg">
                            <AdminLedenSearch
                                onSelect={onAddMember}
                                disabled={addingMember}
                                placeholder="Zoek lid op naam om toe te voegen..."
                            />
                            {addError && (
                                <p className="mt-3 flex items-center gap-2 px-2 text-xs font-semibold text-red-500">
                                    <ShieldAlert className="size-3" /> {addError}
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="w-full flex-1 md:max-w-md lg:max-w-lg">
                            <div className="flex items-center gap-2 rounded-xl border border-amber-500/20 bg-(--beheer-card-soft) px-6 py-3 text-xs font-semibold text-amber-600 shadow-sm dark:text-amber-400">
                                <ShieldAlert className="size-4" /> Geen Azure-koppeling
                            </div>
                        </div>
                    )}
                </div>

                <div className={`p-6 transition-opacity duration-300 md:p-10 ${isUpdating ? 'pointer-events-none opacity-50' : 'opacity-100'}`}>
                    {isUpdating && members.length === 0 ? (
                        <div className="rounded-(--beheer-radius) border-2 border-dashed border-(--beheer-border) bg-(--beheer-card-soft)/20 py-24 text-center">
                            <Loader2 className="mx-auto mb-4 size-12 animate-spin text-(--beheer-accent)" />
                            <p className="text-sm font-semibold text-(--beheer-text-muted) opacity-60">Leden laden...</p>
                        </div>
                    ) : members.length === 0 ? (
                        <div className="rounded-(--beheer-radius) border-2 border-dashed border-(--beheer-border) bg-(--beheer-card-soft)/20 py-24 text-center">
                            <Users className="mx-auto mb-4 size-12 text-(--beheer-text-muted) opacity-10" />
                            <p className="text-sm font-semibold text-(--beheer-text-muted) italic opacity-40">Nog geen leden in deze groep</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                            {members.map(member => (
                                <div
                                    key={member.entraId}
                                    className="group hover:scale-1.02 flex items-center justify-between rounded-3xl border border-(--beheer-border) bg-(--beheer-card-bg) p-5 shadow-sm transition-all hover:border-(--beheer-accent)/50 hover:shadow-xl"
                                >
                                    <div className="flex min-w-0 items-center gap-4">
                                        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-(--beheer-card-soft) text-xs font-semibold text-(--beheer-text-muted) shadow-inner">
                                            {member.displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 truncate text-sm font-semibold text-(--beheer-text)">
                                                {member.displayName}
                                                {member.isLeader && (
                                                    <span className="flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[9px] font-semibold text-white shadow-sm">
                                                        <Award className="size-2" /> Leider
                                                    </span>
                                                )}
                                            </div>
                                            <div className="mt-0.5 truncate text-xs font-medium text-(--beheer-text-muted) opacity-60">{member.email}</div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1">
                                        {member.directusMembershipId && (
                                            <button
                                                onClick={() => onToggleLeader(member)}
                                                disabled={!!actionLoading}
                                                 className={`icon-button rounded-xl p-3 shadow-sm transition-all ${member.isLeader ? 'bg-amber-100 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400' : 'bg-(--beheer-card-soft) text-(--beheer-text-muted) hover:bg-amber-50 hover:text-amber-500 dark:hover:bg-amber-950/20 dark:hover:text-amber-400'}`}
                                                title="Rechten status omschakelen"
                                            >
                                                {actionLoading === `leader-${member.entraId}` ? <Loader2 className="size-4 animate-spin" /> : <Award className="size-4" />}
                                            </button>
                                        )}
                                        {selected.azure_group_id && (
                                            <button
                                                onClick={() => onRemoveMember(member)}
                                                disabled={!!actionLoading}
                                                className="icon-button rounded-xl bg-(--beheer-card-soft) p-3 text-(--beheer-text-muted) shadow-sm transition-all hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/20 dark:hover:text-red-400"
                                                title="Verwijderen uit Azure groep"
                                            >
                                                {actionLoading === `remove-${member.entraId}` ? <Loader2 className="size-4 animate-spin" /> : <UserMinus className="size-4" />}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex items-start gap-3 border-t border-(--beheer-border) bg-(--beheer-card-soft)/20 px-10 py-5">
                    <Info className="mt-0.5 size-4 shrink-0 text-(--beheer-accent)" />
                    <p className="text-xs leading-relaxed font-medium text-(--beheer-text-muted) italic">
                        Let op: Wijzigingen via Azure (Entra ID) service duren circa 2-5 minuten voordat ze volledig verwerkt en zichtbaar zijn in de website cache.
                    </p>
                </div>
            </div>
        </div>
    );
}
