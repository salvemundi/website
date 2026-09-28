'use client';

import { useState } from 'react';
import { Plus, X, Save, Edit, Trash, ChevronDown, Users2, UserPlus, ClipboardCheck, User } from 'lucide-react';
import Link from 'next/link';
import { ActionButton, EmptyState, Field, inputClass, Button } from './IntroTabComponents';
import type { IntroGroupWithDetails, IntroGroup } from '@salvemundi/validations/schema/intro.zod';

interface ApprovedOuder {
    user_id: string;
    first_name: string;
    last_name: string;
    email: string;
}

interface Props {
    groups: IntroGroupWithDetails[];
    approvedOuders: ApprovedOuder[];
    onCreate: (data: Partial<IntroGroup>) => Promise<void>;
    onUpdate: (id: number, data: Partial<IntroGroup>) => Promise<void>;
    onDelete: (id: number) => Promise<void>;
    onAddLeader: (groupId: number, userId: string) => Promise<void>;
    onRemoveLeader: (groupId: number, userId: string) => Promise<void>;
    saving: boolean;
    deletingId: number | null;
}

export default function IntroGroupsTab({ groups, approvedOuders, onCreate, onUpdate, onDelete, onAddLeader, onRemoveLeader, saving, deletingId }: Props) {
    const [creating, setCreating] = useState(false);
    const [newName, setNewName] = useState('');
    const [newNotes, setNewNotes] = useState('');

    const [expandedIds, setExpandedIds] = useState<number[]>([]);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editName, setEditName] = useState('');
    const [editNotes, setEditNotes] = useState('');
    const [pickerGroupId, setPickerGroupId] = useState<number | null>(null);

    const toggleExpand = (id: number) => {
        setExpandedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
        setEditingId(null);
        setPickerGroupId(null);
    };

    const startEdit = (group: IntroGroupWithDetails) => {
        setEditingId(group.id);
        setEditName(group.name);
        setEditNotes(group.notes || '');
        if (!expandedIds.includes(group.id)) setExpandedIds(prev => [...prev, group.id]);
    };

    const handleSaveEdit = async (id: number) => {
        await onUpdate(id, { name: editName, notes: editNotes || null });
        setEditingId(null);
    };

    const handleCreate = async () => {
        if (!newName.trim()) return;
        await onCreate({ name: newName.trim(), notes: newNotes || null });
        setNewName('');
        setNewNotes('');
        setCreating(false);
    };

    // An ouder leads at most one groepje, so once assigned anywhere they should
    // disappear from every other groepje's picker, not just this one's.
    const allLeaderIds = new Set(groups.flatMap(g => g.leaders.map(l => l.user_id)));
    const availableOuders = () => approvedOuders.filter(o => !allLeaderIds.has(o.user_id));

    return (
        <div>
            <div className="mb-8 flex items-center justify-between">
                {!creating && (
                    <Button onClick={() => setCreating(true)} icon={Plus}>
                        Nieuw Groepje
                    </Button>
                )}
            </div>

            {creating && (
                <div className="mb-8 rounded-(--beheer-radius) border border-(--beheer-border) bg-(--beheer-card-bg) p-8 shadow-2xl">
                    <div className="mb-8 flex items-center justify-between">
                        <h3 className="text-xs font-semibold text-(--beheer-text-muted)">Nieuw Groepje</h3>
                        <button onClick={() => setCreating(false)} className="icon-button p-2 text-(--beheer-text-muted) transition-colors hover:text-(--beheer-text)">
                            <X className="size-5" />
                        </button>
                    </div>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <Field label="Naam *">
                            <input type="text" value={newName} onChange={e => setNewName(e.target.value)} className={`beheer-input ${inputClass}`} placeholder="Bv. Groepje 1" />
                        </Field>
                        <Field label="Notities">
                            <input type="text" value={newNotes} onChange={e => setNewNotes(e.target.value)} className={`beheer-input ${inputClass}`} placeholder="Optioneel" />
                        </Field>
                    </div>
                    <div className="mt-10 flex gap-3 border-t border-(--beheer-border)/50 pt-10">
                        <Button onClick={() => { void handleCreate(); }} loading={saving} icon={Save} disabled={!newName.trim()}>
                            Opslaan
                        </Button>
                        <Button onClick={() => setCreating(false)} variant="ghost" icon={X}>
                            Annuleren
                        </Button>
                    </div>
                </div>
            )}

            {groups.length === 0 ? (
                <EmptyState icon={Users2} text="Nog geen groepjes aangemaakt" />
            ) : (
                <div className="grid gap-4">
                    {groups.map(group => {
                        const isExpanded = expandedIds.includes(group.id);
                        return (
                            <div key={group.id} className="overflow-hidden rounded-(--beheer-radius) border border-(--beheer-border) bg-(--beheer-card-bg) shadow-sm transition-all hover:border-(--beheer-accent)/30">
                                <div
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => toggleExpand(group.id)}
                                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleExpand(group.id); } }}
                                    className="flex w-full cursor-pointer items-center gap-3 px-5 py-4 text-left"
                                >
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-semibold text-(--beheer-text)">{group.name}</p>
                                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-(--beheer-text-muted)">
                                            <span className="flex items-center gap-1">
                                                <User className="size-3" /> {group.member_count} {group.member_count === 1 ? 'lid' : 'leden'}
                                            </span>
                                            <span className="opacity-80">
                                                {group.leaders.length === 0 ? 'Geen ouders' : group.leaders.map(l => `${l.first_name} ${l.last_name}`.trim()).join(', ')}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex shrink-0 items-center gap-1.5">
                                        <ActionButton icon={Edit} onClick={(e) => { e.stopPropagation(); startEdit(group); }} title="Bewerken" />
                                        <ActionButton
                                            icon={Trash}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (confirm(`Groepje "${group.name}" verwijderen? Dit verwijdert ook alle leden en aanwezigheid.`)) {
                                                    void onDelete(group.id);
                                                }
                                            }}
                                            variant="danger"
                                            disabled={deletingId === group.id}
                                            title="Verwijderen"
                                        />
                                        <ChevronDown className="size-4 shrink-0 text-(--beheer-text-muted) transition-transform duration-300" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div className="border-t border-(--beheer-border)/50 bg-(--beheer-card-soft)/30 px-5 py-6">
                                        {editingId === group.id ? (
                                            <div className="mb-6 space-y-5">
                                                <div className="flex flex-wrap items-center justify-between gap-3">
                                                    <p className="text-xs font-semibold text-(--beheer-accent)">Groepje Bewerken</p>
                                                    <div className="flex gap-2">
                                                        <Button onClick={() => { void handleSaveEdit(group.id); }} variant="success" icon={Save}>Opslaan</Button>
                                                        <Button onClick={() => setEditingId(null)} variant="ghost" icon={X}>Annuleren</Button>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                                    <div className="flex flex-col gap-2">
                                                        <span className="text-[9px] opacity-50">Naam</span>
                                                        <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="beheer-input rounded-lg border border-(--beheer-border) bg-(--beheer-card-bg) px-3 py-2 text-xs font-semibold text-(--beheer-text) outline-none focus:ring-2 focus:ring-(--beheer-accent)" />
                                                    </div>
                                                    <div className="flex flex-col gap-2">
                                                        <span className="text-[9px] opacity-50">Notities</span>
                                                        <input type="text" value={editNotes} onChange={e => setEditNotes(e.target.value)} className="beheer-input rounded-lg border border-(--beheer-border) bg-(--beheer-card-bg) px-3 py-2 text-xs font-semibold text-(--beheer-text) outline-none focus:ring-2 focus:ring-(--beheer-accent)" />
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                                                <p className="text-xs font-semibold text-(--beheer-accent)">Toegewezen ouders</p>
                                                <Link
                                                    href={`/profiel/intro-attendance?group=${group.id}`}
                                                    className="beheer-button flex items-center gap-2 rounded-xl border border-(--beheer-border) bg-(--beheer-card-bg) px-4 py-2 text-xs font-semibold text-(--beheer-text) transition-colors hover:bg-(--beheer-card-soft)"
                                                >
                                                    <ClipboardCheck className="size-3.5" />
                                                    Bekijk aanwezigheid
                                                </Link>
                                            </div>
                                        )}

                                        <div className="mb-6 flex flex-wrap gap-3">
                                            {group.leaders.length === 0 && (
                                                <p className="text-xs text-(--beheer-text-muted) opacity-60">Nog geen ouders toegewezen</p>
                                            )}
                                            {group.leaders.map(leader => (
                                                <div key={leader.user_id} className="flex items-center gap-2 rounded-full border border-(--beheer-border) bg-(--beheer-card-bg) py-1.5 pr-2 pl-4">
                                                    <span className="text-xs font-semibold text-(--beheer-text)">{leader.first_name} {leader.last_name}</span>
                                                    <button
                                                        onClick={() => { void onRemoveLeader(group.id, leader.user_id); }}
                                                        className="icon-button rounded-full p-1 text-(--beheer-text-muted) transition-colors hover:bg-red-500/10 hover:text-red-500"
                                                        title="Verwijderen"
                                                    >
                                                        <X className="size-3" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>

                                        {pickerGroupId === group.id ? (
                                            <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
                                                <select
                                                    className="beheer-input w-full rounded-lg border border-(--beheer-border) bg-(--beheer-card-bg) px-3 py-2 text-xs font-semibold text-(--beheer-text) outline-none focus:ring-2 focus:ring-(--beheer-accent) sm:w-auto"
                                                    defaultValue=""
                                                    onChange={(e) => {
                                                        if (e.target.value) {
                                                            void onAddLeader(group.id, e.target.value);
                                                            setPickerGroupId(null);
                                                        }
                                                    }}
                                                >
                                                    <option value="" disabled>Kies een goedgekeurde ouder...</option>
                                                    {availableOuders().map(o => (
                                                        <option key={o.user_id} value={o.user_id}>{o.first_name} {o.last_name} ({o.email})</option>
                                                    ))}
                                                </select>
                                                <Button onClick={() => setPickerGroupId(null)} variant="ghost" icon={X}>Annuleren</Button>
                                            </div>
                                        ) : (
                                            <Button onClick={() => setPickerGroupId(group.id)} variant="secondary" icon={UserPlus}>
                                                Ouder toevoegen
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
