'use client';

import { useState, Fragment } from 'react';
import type { MouseEvent, ChangeEvent } from 'react';
import {
    Search,
    ChevronDown,
    Edit,
    Trash,
    UserCheck,
    Heart,
    Save,
    X
} from 'lucide-react';
import { ActionButton, EmptyState, Button } from './IntroTabComponents';
import { type IntroParentSignup as IntroParentRow } from '@salvemundi/validations/directus/schema';
import { formatDate } from '@/shared/lib/utils/date';
import { PhoneInput } from '@/shared/ui/PhoneInput';
import { formatPhoneNumber } from '@/lib/utils/phone-utils';

interface Props {
    parents: IntroParentRow[];
    onDelete: (id: number) => Promise<void>;
    onUpdate: (id: number, data: Partial<IntroParentRow>) => Promise<void>;
    onExport: () => void;
    deletingId: number | null;
}

export default function IntroParentsTab({ parents, onDelete, onUpdate, deletingId }: Props) {
    const [search, setSearch] = useState('');
    const [expandedRows, setExpandedRows] = useState<number[]>([]);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editData, setEditData] = useState<Partial<IntroParentRow>>({});

    const filtered = parents.filter(p => {
        if (!search) return true;
        const q = search.toLowerCase();
        return `${p.first_name || ''} ${p.last_name || ''}`.toLowerCase().includes(q) ||
            (p.email || '').toLowerCase().includes(q) || (p.phone_number || '').includes(q);
    });

    const toggleExpand = (id: number) => {
        setExpandedRows(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
        setEditingId(null);
    };

    const startEdit = (e: MouseEvent, p: IntroParentRow) => {
        e.stopPropagation();
        setEditingId(p.id);
        setEditData({
            ...p,
            phone_number: formatPhoneNumber(p.phone_number)
        });
        if (!expandedRows.includes(p.id)) setExpandedRows(prev => [...prev, p.id]);
    };

    const handleSaveEdit = async (id: number) => {
        await onUpdate(id, editData);
        setEditingId(null);
    };

    return (
        <div>
            <div className="flex flex-col sm:flex-row gap-3 mb-8">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-(--beheer-text-muted)" />
                    <input
                        type="text"
                        placeholder="Zoek op naam, email of telefoon..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="beheer-input w-full pl-11 pr-4 py-3.5 rounded-(--beheer-radius) bg-(--bg-main)/40 dark:bg-black/20 backdrop-blur-sm border-0 ring-1 ring-(--beheer-border)/40 text-(--beheer-text) text-sm font-semibold focus:ring-2 focus:ring-(--beheer-accent) focus:bg-(--bg-main)/80 outline-none transition-all shadow-inner placeholder:text-(--beheer-text-muted)/40"
                    />
                </div>
            </div>

            {filtered.length === 0 ? (
                <EmptyState icon={Heart} text="Nog geen ouder-aanmeldingen binnengekomen" />
            ) : (
                <div className="bg-(--beheer-card-bg) rounded-(--beheer-radius) border border-(--beheer-border) overflow-hidden shadow-2xl transition-all">
                    <table className="w-full text-sm">
                        <thead className="bg-(--beheer-card-soft) border-b border-(--beheer-border)">
                            <tr>
                                <th className="px-8 py-5 text-left text-xs font-semibold text-(--beheer-text-muted) w-20">Status</th>
                                <th className="px-8 py-5 text-left text-xs font-semibold text-(--beheer-text-muted) w-1/4">Naam</th>
                                <th className="px-8 py-5 text-left text-xs font-semibold text-(--beheer-text-muted) hidden sm:table-cell">Email</th>
                                <th className="px-8 py-5 text-left text-xs font-semibold text-(--beheer-text-muted) hidden md:table-cell w-48">Telefoon</th>
                                <th className="px-8 py-5 text-right text-xs font-semibold text-(--beheer-text-muted) w-48">Acties</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-(--beheer-border)/10">
                            {filtered.map(p => {
                                const isExpanded = expandedRows.includes(p.id);
                                return (
                                    <Fragment key={p.id}>
                                        <tr
                                            onClick={() => toggleExpand(p.id)}
                                            className="hover:bg-(--beheer-accent)/2 cursor-pointer transition-colors group"
                                        >
                                            <td className="px-8 py-5">
                                                <div className={`h-2.5 w-2.5 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.1)] transition-all ${p.approved ? 'bg-emerald-500 shadow-emerald-500/40' : 'bg-(--beheer-border) opacity-30'}`} />
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="text-sm font-semibold text-(--beheer-text) group-hover:text-(--beheer-accent) transition-colors">
                                                        {p.first_name || 'N/A'} {p.last_name || ''}
                                                    </div>
                                                    {p.approved && (
                                                        <span className="bg-emerald-500/10 text-emerald-500 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-emerald-500/20">
                                                            Goedgekeurd
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-(--beheer-text-muted) text-xs font-medium hidden sm:table-cell opacity-60">
                                                {p.email || '-'}
                                            </td>
                                            <td className="px-8 py-5 text-(--beheer-text-muted) text-xs font-medium hidden md:table-cell">
                                                {formatPhoneNumber(p.phone_number) || '-'}
                                            </td>
                                            <td className="px-12 py-5 text-right">
                                                <div className="flex justify-end items-center gap-3">
                                                    <ActionButton
                                                        icon={Edit}
                                                        onClick={(e) => startEdit(e, p)}
                                                        title="Bewerken"
                                                    />
                                                    <ActionButton
                                                        icon={Trash}
                                                        onClick={(e) => { e.stopPropagation(); void onDelete(p.id); }}
                                                        variant="danger"
                                                        disabled={deletingId === p.id}
                                                        title="Verwijderen"
                                                    />
                                                    <div className="text-(--beheer-text-muted) p-2 group-hover:text-(--beheer-accent) transition-colors">
                                                        <ChevronDown className="h-4 w-4 transition-transform duration-300" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                        {isExpanded && (
                                            <tr className="bg-(--beheer-card-soft)/30">
                                                <td colSpan={5} className="px-12 py-10">
                                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 text-sm font-medium text-(--beheer-text-muted)">
                                                        <div className="lg:col-span-2 space-y-8">
                                                            {editingId === p.id ? (
                                                                <div className="space-y-6">
                                                                    <div className="flex items-center justify-between">
                                                                        <p className="text-xs font-semibold text-(--beheer-accent)">Ouder Bewerken</p>
                                                                        <div className="flex gap-2">
                                                                            <Button onClick={() => { void handleSaveEdit(p.id); }} variant="success" icon={Save}>Opslaan</Button>
                                                                            <Button onClick={() => setEditingId(null)} variant="ghost" icon={X}>Annuleren</Button>
                                                                        </div>
                                                                    </div>
                                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                                                        <div className="flex flex-col gap-2">
                                                                            <span className="opacity-50 text-[9px]">Voornaam</span>
                                                                            <input type="text" value={editData.first_name || ''} onChange={e => setEditData({ ...editData, first_name: e.target.value })} className="beheer-input bg-(--beheer-card-bg) border border-(--beheer-border) rounded-lg px-3 py-2 text-(--beheer-text) text-xs font-semibold focus:ring-2 focus:ring-(--beheer-accent) outline-none" />
                                                                        </div>
                                                                        <div className="flex flex-col gap-2">
                                                                            <span className="opacity-50 text-[9px]">Achternaam</span>
                                                                            <input type="text" value={editData.last_name || ''} onChange={e => setEditData({ ...editData, last_name: e.target.value })} className="beheer-input bg-(--beheer-card-bg) border border-(--beheer-border) rounded-lg px-3 py-2 text-(--beheer-text) text-xs font-semibold focus:ring-2 focus:ring-(--beheer-accent) outline-none" />
                                                                        </div>
                                                                        <div className="flex flex-col gap-2">
                                                                            <span className="opacity-50 text-[9px]">Email</span>
                                                                            <input type="email" value={editData.email || ''} onChange={e => setEditData({ ...editData, email: e.target.value })} className="beheer-input bg-(--beheer-card-bg) border border-(--beheer-border) rounded-lg px-3 py-2 text-(--beheer-text) text-xs font-semibold focus:ring-2 focus:ring-(--beheer-accent) outline-none" />
                                                                        </div>
                                                                        <div className="flex flex-col gap-2">
                                                                            <span className="opacity-50 text-[9px]">Telefoon</span>
                                                                            <PhoneInput
                                                                                value={editData.phone_number || ''}
                                                                                onChange={(e: ChangeEvent<HTMLInputElement>) => setEditData({ ...editData, phone_number: e.target.value })}
                                                                                className="beheer-input bg-(--beheer-card-bg) border border-(--beheer-border) rounded-lg px-3 py-2 text-(--beheer-text) text-xs font-semibold focus:ring-2 focus:ring-(--beheer-accent) outline-none"
                                                                            />
                                                                        </div>
                                                                        <div className="flex flex-col gap-2 sm:col-span-2">
                                                                            <span className="opacity-50 text-[9px]">Motivatie</span>
                                                                            <textarea
                                                                                value={editData.motivation || ''}
                                                                                onChange={e => setEditData({ ...editData, motivation: e.target.value })}
                                                                                className="beheer-input bg-(--beheer-card-bg) border border-(--beheer-border) rounded-lg px-3 py-2 text-(--beheer-text) text-xs font-semibold focus:ring-2 focus:ring-(--beheer-accent) outline-none min-h-25 resize-none"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="space-y-4">
                                                                    <div className="flex items-center justify-between">
                                                                        <p className="text-xs font-semibold text-(--beheer-accent)">Extra Informatie</p>
                                                                        <Button onClick={() => startEdit({ stopPropagation: () => { } } as MouseEvent, p)} variant="ghost" icon={Edit}>
                                                                            Bewerken
                                                                        </Button>
                                                                    </div>
                                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                                        <div className="flex flex-col gap-1">
                                                                            <span className="opacity-50">Aangemeld op</span>
                                                                            <span className="text-(--beheer-text) text-sm font-semibold">{p.created_at ? formatDate(p.created_at) : '-'}</span>
                                                                        </div>
                                                                        <div className="flex flex-col gap-1">
                                                                            <span className="opacity-50">Status</span>
                                                                            <span className="text-(--beheer-text) text-sm font-semibold">
                                                                                {p.status === 'approved' ? 'Goedgekeurd' : 'Geregistreerd'}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                    {p.motivation && (
                                                                        <div className="mt-6 space-y-4">
                                                                            <p className="text-xs font-semibold text-(--beheer-accent)">Motivatie</p>
                                                                            <div className="bg-white/5 p-6 rounded-2xl border border-(--beheer-border)/20">
                                                                                <p className="text-sm font-medium text-(--beheer-text) leading-relaxed italic">
                                                                                    &quot;{p.motivation}&quot;
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="space-y-6 lg:border-l lg:border-(--beheer-border)/10 lg:pl-12">
                                                            <p className="text-xs font-semibold text-(--beheer-accent)">Beheer Acties</p>
                                                            <div className="flex flex-col gap-3">
                                                                <Button
                                                                    onClick={() => {
                                                                        void onUpdate(p.id, {
                                                                            approved: !p.approved,
                                                                            status: !p.approved ? 'approved' : 'registered'
                                                                        });
                                                                    }}
                                                                    variant={p.approved ? 'success' : 'secondary'}
                                                                    icon={UserCheck}
                                                                    className="w-full"
                                                                >
                                                                    {p.approved ? 'Goedgekeurd' : 'Keur Goed'}
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}