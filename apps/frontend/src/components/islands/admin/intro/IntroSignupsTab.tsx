'use client';

import React, { useState } from 'react';
import { 
    Search, 
    Mail, 
    Download, 
    ChevronDown, 
    Edit, 
    Trash2, 
    UserCheck, 
    Eye,
    Plus,
    Users,
    Save,
    X,
    Loader2
} from 'lucide-react';
import { formatDate } from '@/shared/lib/utils/date';
import { PhoneInput } from '@/shared/ui/PhoneInput';
import { formatPhoneNumber } from '@/lib/utils/phone-utils';
import { ActionButton, EmptyState, Button } from './IntroTabComponents';

interface IntroSignupRow {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    date_of_birth?: string;
    favorite_gif?: string;
    date_created?: string;
    created_at?: string;
    status?: string;
    approved?: boolean;
}

interface Props {
    signups: IntroSignupRow[];
    onDelete: (id: number) => Promise<void>;
    onUpdate: (id: number, data: Partial<IntroSignupRow>) => Promise<void>;
    onExport: () => void;
    deletingId: number | null;
}

export default function IntroSignupsTab({ signups, onDelete, onUpdate, onExport, deletingId }: Props) {
    const [search, setSearch] = useState('');
    const [expandedRows, setExpandedRows] = useState<number[]>([]);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editData, setEditData] = useState<Partial<IntroSignupRow>>({});

    const filtered = signups.filter(s => {
        if (!search) return true;
        const q = search.toLowerCase();
        return `${s.first_name} ${s.last_name}`.toLowerCase().includes(q) ||
            s.email.toLowerCase().includes(q) || (s.phone_number || '').includes(q);
    });

    const toggleExpand = (id: number) => {
        setExpandedRows(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
        setEditingId(null);
    };

    const startEdit = (e: React.MouseEvent, s: IntroSignupRow) => {
        e.stopPropagation();
        setEditingId(s.id);
        setEditData({
            ...s,
            phone_number: formatPhoneNumber(s.phone_number)
        });
        if (!expandedRows.includes(s.id)) setExpandedRows(prev => [...prev, s.id]);
    };

    const handleSaveEdit = async (id: number) => {
        await onUpdate(id, editData);
        setEditingId(null);
    };

    const handleMailBcc = () => {
        const emails = signups.map(s => s.email).join(',');
        window.location.href = `mailto:?bcc=${emails}&subject=Intro${encodeURIComponent(' Aanmeldingen')}`;
    };

    return (
        <div className="animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row gap-3 mb-8">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--beheer-text-muted)]" />
                    <input
                        type="text"
                        placeholder="Zoek op naam, email of telefoon..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-11 pr-4 py-3.5 rounded-[var(--beheer-radius)] bg-[var(--bg-main)]/40 dark:bg-black/20 backdrop-blur-sm border-0 ring-1 ring-[var(--beheer-border)]/40 text-[var(--beheer-text)] text-sm font-semibold focus:ring-2 focus:ring-[var(--beheer-accent)] focus:bg-[var(--bg-main)]/80 outline-none transition-all shadow-inner placeholder:text-[var(--beheer-text-muted)]/40"
                    />
                </div>
                <div className="flex gap-2">
                    <Button onClick={handleMailBcc} variant="secondary" icon={Mail}>
                        Mail BCC
                    </Button>
                    <Button onClick={onExport} icon={Download}>
                        Export CSV
                    </Button>
                </div>
            </div>

            {filtered.length === 0 ? (
                <EmptyState icon={Users} text="Nog geen aanmeldingen binnengekomen" />
            ) : (
                <div className="bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] border border-[var(--beheer-border)] overflow-hidden shadow-2xl transition-all">
                    <table className="w-full text-sm">
                        <thead className="bg-[var(--beheer-card-soft)] border-b border-[var(--beheer-border)]">
                            <tr>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest w-20">Status</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest w-1/4">Naam</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest hidden sm:table-cell">Email</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest hidden md:table-cell w-48">Telefoon</th>
                                <th className="px-8 py-5 text-right text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest w-48">Acties</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--beheer-border)]/10">
                            {filtered.map(s => {
                                const isExpanded = expandedRows.includes(s.id);
                                return (
                                    <React.Fragment key={s.id}>
                                        <tr 
                                            onClick={() => toggleExpand(s.id)} 
                                            className="hover:bg-[var(--beheer-accent)]/[0.02] cursor-pointer transition-colors group"
                                        >
                                            <td className="px-8 py-5">
                                                <div className={`h-2.5 w-2.5 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.1)] transition-all ${s.approved ? 'bg-emerald-500 shadow-emerald-500/40 scale-110' : 'bg-[var(--beheer-border)] opacity-30'}`} />
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="text-sm font-black text-[var(--beheer-text)] uppercase tracking-tight group-hover:text-[var(--beheer-accent)] transition-colors">
                                                        {s.first_name} {s.last_name}
                                                    </div>
                                                    {s.approved && (
                                                        <span className="bg-emerald-500/10 text-emerald-500 text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full border border-emerald-500/20">
                                                            Goedgekeurd
                                                        </span>
                                                    )}
                                                    {s.status === 'approved' && !s.approved && (
                                                        <span className="bg-green-500/10 text-green-500 text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full border border-green-500/20">
                                                            Lid
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-[var(--beheer-text-muted)] font-black text-[10px] uppercase tracking-widest hidden sm:table-cell lowercase opacity-60">
                                                {s.email}
                                            </td>
                                            <td className="px-8 py-5 text-[var(--beheer-text-muted)] font-black text-[10px] uppercase tracking-widest hidden md:table-cell">
                                                {formatPhoneNumber(s.phone_number)}
                                            </td>
                                            <td className="px-12 py-5 text-right">
                                                <div className="flex justify-end items-center gap-3">
                                                    <ActionButton 
                                                        icon={Edit} 
                                                        onClick={(e) => startEdit(e, s)} 
                                                        title="Bewerken" 
                                                    />
                                                    <ActionButton 
                                                        icon={Trash2} 
                                                        onClick={(e) => { e.stopPropagation(); onDelete(s.id); }} 
                                                        variant="danger"
                                                        disabled={deletingId === s.id}
                                                        title="Verwijderen"
                                                    />
                                                    <div className="text-[var(--beheer-text-muted)] p-2 group-hover:text-[var(--beheer-accent)] transition-colors">
                                                        <ChevronDown className="h-4 w-4 transition-transform duration-300" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                        {isExpanded && (
                                            <tr className="bg-[var(--beheer-card-soft)]/30">
                                                <td colSpan={5} className="px-12 py-10 animate-in slide-in-from-top-2 duration-300">
                                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 text-[11px] font-black uppercase tracking-widest text-[var(--beheer-text-muted)]">
                                                        <div className="lg:col-span-2 space-y-8">
                                                        {editingId === s.id ? (
                                                            <div className="space-y-6">
                                                                <div className="flex items-center justify-between">
                                                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--beheer-accent)]">Deelnemer Bewerken</p>
                                                                    <div className="flex gap-2">
                                                                        <Button onClick={() => handleSaveEdit(s.id)} variant="success" icon={Save}>Opslaan</Button>
                                                                        <Button onClick={() => setEditingId(null)} variant="ghost" icon={X}>Annuleren</Button>
                                                                    </div>
                                                                </div>
                                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                                                    <div className="flex flex-col gap-2">
                                                                        <span className="opacity-50 text-[9px]">Voornaam</span>
                                                                        <input type="text" value={editData.first_name || ''} onChange={e => setEditData({...editData, first_name: e.target.value})} className="bg-[var(--beheer-card-bg)] border border-[var(--beheer-border)] rounded-lg px-3 py-2 text-[var(--beheer-text)] text-xs font-bold focus:ring-2 focus:ring-[var(--beheer-accent)] outline-none" />
                                                                    </div>
                                                                    <div className="flex flex-col gap-2">
                                                                        <span className="opacity-50 text-[9px]">Achternaam</span>
                                                                        <input type="text" value={editData.last_name || ''} onChange={e => setEditData({...editData, last_name: e.target.value})} className="bg-[var(--beheer-card-bg)] border border-[var(--beheer-border)] rounded-lg px-3 py-2 text-[var(--beheer-text)] text-xs font-bold focus:ring-2 focus:ring-[var(--beheer-accent)] outline-none" />
                                                                    </div>
                                                                    <div className="flex flex-col gap-2">
                                                                        <span className="opacity-50 text-[9px]">Email</span>
                                                                        <input type="email" value={editData.email || ''} onChange={e => setEditData({...editData, email: e.target.value})} className="bg-[var(--beheer-card-bg)] border border-[var(--beheer-border)] rounded-lg px-3 py-2 text-[var(--beheer-text)] text-xs font-bold focus:ring-2 focus:ring-[var(--beheer-accent)] outline-none" />
                                                                    </div>
                                                                    <div className="flex flex-col gap-2">
                                                                        <span className="opacity-50 text-[9px]">Telefoon</span>
                                                                        <PhoneInput 
                                                                            value={editData.phone_number || ''} 
                                                                            onChange={(e: any) => setEditData({...editData, phone_number: e.target.value})} 
                                                                            className="bg-[var(--beheer-card-bg)] border border-[var(--beheer-border)] rounded-lg px-3 py-2 text-[var(--beheer-text)] text-xs font-bold focus:ring-2 focus:ring-[var(--beheer-accent)] outline-none" 
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="space-y-4">
                                                                <div className="flex items-center justify-between">
                                                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--beheer-accent)]">Extra Informatie</p>
                                                                    <Button onClick={(e: any) => startEdit(e, s)} variant="ghost" icon={Edit}>
                                                                        Bewerken
                                                                    </Button>
                                                                </div>
                                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                                    {s.date_of_birth && (
                                                                        <div className="flex flex-col gap-1">
                                                                            <span className="opacity-50">Geboortedatum</span>
                                                                            <span className="text-[var(--beheer-text)] text-sm font-bold">{formatDate(s.date_of_birth)}</span>
                                                                        </div>
                                                                    )}
                                                                    <div className="flex flex-col gap-1">
                                                                        <span className="opacity-50">Aangemeld op</span>
                                                                        <span className="text-[var(--beheer-text)] text-sm font-bold">{s.date_created || s.created_at ? formatDate(s.date_created || s.created_at) : '-'}</span>
                                                                    </div>
                                                                    <div className="flex flex-col gap-1">
                                                                        <span className="opacity-50">Status</span>
                                                                        <span className="text-[var(--beheer-text)] text-sm font-bold uppercase tracking-tight">
                                                                            {s.status === 'approved' ? 'Goedgekeurd' : 'Geregistreerd'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                            </div>
                                                        <div className="space-y-6 lg:border-l lg:border-[var(--beheer-border)]/10 lg:pl-12">
                                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--beheer-accent)]">Beheer Acties</p>
                                                            <div className="flex flex-col gap-3">
                                                                <Button 
                                                                    onClick={() => onUpdate(s.id, { approved: !s.approved, status: !s.approved ? 'approved' : 'registered' })}
                                                                    variant={s.approved ? 'success' : 'secondary'}
                                                                    icon={UserCheck}
                                                                    className="w-full"
                                                                >
                                                                    {s.approved ? 'Goedgekeurd' : 'Keur Goed'}
                                                                </Button>
                                                                
                                                                {s.favorite_gif && (
                                                                    <Button 
                                                                        onClick={() => window.open(s.favorite_gif, '_blank')} 
                                                                        variant="secondary"
                                                                        icon={Eye}
                                                                        className="w-full"
                                                                    >
                                                                        Bekijk GIF
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
