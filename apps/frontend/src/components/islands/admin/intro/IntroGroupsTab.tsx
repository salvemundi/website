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

    const availableOuders = (group: IntroGroupWithDetails) => {
        const leaderIds = new Set(group.leaders.map(l => l.user_id));
        return approvedOuders.filter(o => !leaderIds.has(o.user_id));
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                {!creating && (
                    <Button onClick={() => setCreating(true)} icon={Plus}>
                        Nieuw Groepje
                    </Button>
                )}
            </div>

            {creating && (
                <div className="bg-(--beheer-card-bg) rounded-(--beheer-radius) border border-(--beheer-border) p-8 mb-8 shadow-2xl">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="font-semibold text-xs text-(--beheer-text-muted)">Nieuw Groepje</h3>
                        <button onClick={() => setCreating(false)} className="icon-button p-2 text-(--beheer-text-muted) hover:text-(--beheer-text) transition-colors">
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Field label="Naam *">
                            <input type="text" value={newName} onChange={e => setNewName(e.target.value)} className={`beheer-input ${inputClass}`} placeholder="Bv. Groepje 1" />
                        </Field>
                        <Field label="Notities">
                            <input type="text" value={newNotes} onChange={e => setNewNotes(e.target.value)} className={`beheer-input ${inputClass}`} placeholder="Optioneel" />
                        </Field>
                    </div>
                    <div className="flex gap-3 pt-10 border-t border-(--beheer-border)/50 mt-10">
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
                            <div key={group.id} className="bg-(--beheer-card-bg) rounded-(--beheer-radius) border border-(--beheer-border) shadow-sm hover:border-(--beheer-accent)/30 transition-all overflow-hidden">
                                <div
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => toggleExpand(group.id)}
                                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleExpand(group.id); } }}
                                    className="w-full flex items-center gap-3 px-5 py-4 text-left cursor-pointer"
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-(--beheer-text) truncate">{group.name}</p>
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs font-medium text-(--beheer-text-muted)">
                                            <span className="flex items-center gap-1">
                                                <User className="h-3 w-3" /> {group.member_count} {group.member_count === 1 ? 'lid' : 'leden'}
                                            </span>
                                            <span className="opacity-80">
                                                {group.leaders.length === 0 ? 'Geen ouders' : group.leaders.map(l => `${l.first_name} ${l.last_name}`.trim()).join(', ')}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
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
                                        <ChevronDown className="h-4 w-4 text-(--beheer-text-muted) transition-transform duration-300 shrink-0" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div className="bg-(--beheer-card-soft)/30 border-t border-(--beheer-border)/50 px-5 py-6">
                                        {editingId === group.id ? (
                                            <div className="space-y-5 mb-6">
                                                <div className="flex flex-wrap items-center justify-between gap-3">
                                                    <p className="text-xs font-semibold text-(--beheer-accent)">Groepje Bewerken</p>
                                                    <div className="flex gap-2">
                                                        <Button onClick={() => { void handleSaveEdit(group.id); }} variant="success" icon={Save}>Opslaan</Button>
                                                        <Button onClick={() => setEditingId(null)} variant="ghost" icon={X}>Annuleren</Button>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <div className="flex flex-col gap-2">
                                                        <span className="opacity-50 text-[9px]">Naam</span>
                                                        <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="beheer-input bg-(--beheer-card-bg) border border-(--beheer-border) rounded-lg px-3 py-2 text-(--beheer-text) text-xs font-semibold focus:ring-2 focus:ring-(--beheer-accent) outline-none" />
                                                    </div>
                                                    <div className="flex flex-col gap-2">
                                                        <span className="opacity-50 text-[9px]">Notities</span>
                                                        <input type="text" value={editNotes} onChange={e => setEditNotes(e.target.value)} className="beheer-input bg-(--beheer-card-bg) border border-(--beheer-border) rounded-lg px-3 py-2 text-(--beheer-text) text-xs font-semibold focus:ring-2 focus:ring-(--beheer-accent) outline-none" />
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                                                <p className="text-xs font-semibold text-(--beheer-accent)">Toegewezen ouders</p>
                                                <Link
                                                    href={`/profiel/intro-attendance?group=${group.id}`}
                                                    className="beheer-button flex items-center gap-2 px-4 py-2 bg-(--beheer-card-bg) border border-(--beheer-border) rounded-xl text-xs font-semibold text-(--beheer-text) hover:bg-(--beheer-card-soft) transition-colors"
                                                >
                                                    <ClipboardCheck className="h-3.5 w-3.5" />
                                                    Bekijk aanwezigheid
                                                </Link>
                                            </div>
                                        )}

                                        <div className="flex flex-wrap gap-3 mb-6">
                                            {group.leaders.length === 0 && (
                                                <p className="text-xs text-(--beheer-text-muted) opacity-60">Nog geen ouders toegewezen</p>
                                            )}
                                            {group.leaders.map(leader => (
                                                <div key={leader.user_id} className="flex items-center gap-2 bg-(--beheer-card-bg) border border-(--beheer-border) rounded-full pl-4 pr-2 py-1.5">
                                                    <span className="text-xs font-semibold text-(--beheer-text)">{leader.first_name} {leader.last_name}</span>
                                                    <button
                                                        onClick={() => { void onRemoveLeader(group.id, leader.user_id); }}
                                                        className="icon-button p-1 rounded-full text-(--beheer-text-muted) hover:text-red-500 hover:bg-red-500/10 transition-colors"
                                                        title="Verwijderen"
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>

                                        {pickerGroupId === group.id ? (
                                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                                                <select
                                                    className="beheer-input bg-(--beheer-card-bg) border border-(--beheer-border) rounded-lg px-3 py-2 text-(--beheer-text) text-xs font-semibold focus:ring-2 focus:ring-(--beheer-accent) outline-none w-full sm:w-auto"
                                                    defaultValue=""
                                                    onChange={(e) => {
                                                        if (e.target.value) {
                                                            void onAddLeader(group.id, e.target.value);
                                                            setPickerGroupId(null);
                                                        }
                                                    }}
                                                >
                                                    <option value="" disabled>Kies een goedgekeurde ouder...</option>
                                                    {availableOuders(group).map(o => (
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
