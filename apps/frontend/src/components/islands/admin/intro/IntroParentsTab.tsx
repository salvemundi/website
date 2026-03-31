'use client';

import React, { useState } from 'react';
import { 
    Search, 
    Mail, 
    Download, 
    AlertCircle, 
    ChevronDown, 
    ChevronUp, 
    Loader2, 
    Trash2 
} from 'lucide-react';

interface IntroParentRow {
    id: number;
    first_name?: string;
    last_name?: string;
    email?: string;
    phone_number?: string;
    motivation?: string;
    date_created?: string;
}

interface Props {
    parents: IntroParentRow[];
    onDelete: (id: number) => Promise<void>;
    onExport: () => void;
    deletingId: number | null;
}

export default function IntroParentsTab({ parents, onDelete, onExport, deletingId }: Props) {
    const [search, setSearch] = useState('');
    const [expandedRows, setExpandedRows] = useState<number[]>([]);

    const filtered = parents.filter(p => {
        if (!search) return true;
        const q = search.toLowerCase();
        return `${p.first_name || ''} ${p.last_name || ''}`.toLowerCase().includes(q) ||
            (p.email || '').toLowerCase().includes(q);
    });

    const toggleExpand = (id: number) => {
        setExpandedRows(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const handleMailBcc = () => {
        const emails = parents.map(p => p.email).filter(Boolean).join(',');
        window.location.href = `mailto:?bcc=${emails}&subject=Intro${encodeURIComponent(' Ouders')}`;
    };

    return (
        <div className="animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row gap-3 mb-5">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--beheer-text-muted)]" />
                    <input
                        type="text"
                        placeholder="Zoek op naam of email..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 rounded-[var(--beheer-radius)] bg-[var(--beheer-card-bg)] border border-[var(--beheer-border)] text-[var(--beheer-text)] text-sm focus:ring-2 focus:ring-[var(--beheer-accent)] focus:outline-none transition-all"
                    />
                </div>
                <button 
                    onClick={handleMailBcc} 
                    className="flex items-center justify-center gap-2 px-[var(--beheer-btn-px)] py-[var(--beheer-btn-py)] bg-[var(--beheer-card-bg)] border border-[var(--beheer-border)] text-[var(--beheer-text)] rounded-[var(--beheer-radius)] text-xs font-black uppercase tracking-widest hover:border-[var(--beheer-accent)]/50 transition-all active:scale-95"
                >
                    <Mail className="h-4 w-4 text-[var(--beheer-accent)]" /> 
                    Mail BCC
                </button>
                <button 
                    onClick={onExport} 
                    className="flex items-center justify-center gap-2 px-[var(--beheer-btn-px)] py-[var(--beheer-btn-py)] bg-[var(--beheer-accent)] text-white rounded-[var(--beheer-radius)] text-xs font-black uppercase tracking-widest shadow-[var(--shadow-glow)] hover:opacity-90 transition-all active:scale-95"
                >
                    <Download className="h-4 w-4" /> 
                    Export CSV
                </button>
            </div>

            <div className="bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] border border-[var(--beheer-border)] overflow-hidden shadow-2xl transition-all">
                {filtered.length === 0 ? (
                    <div className="py-20 text-center text-[var(--beheer-text-muted)]">
                        <div className="p-6 bg-[var(--beheer-card-soft)] rounded-full w-fit mx-auto mb-6">
                            <AlertCircle className="h-12 w-12 opacity-20" />
                        </div>
                        <p className="font-black uppercase tracking-widest text-xs">Geen ouder-aanmeldingen gevonden</p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-[var(--beheer-card-soft)] border-b border-[var(--beheer-border)]">
                            <tr>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest">Naam</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest hidden sm:table-cell">Email</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest hidden md:table-cell">Telefoon</th>
                                <th className="px-8 py-5 text-right text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest">Acties</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--beheer-border)]">
                            {filtered.map(p => (
                                <React.Fragment key={p.id}>
                                    <tr className="hover:bg-[var(--beheer-card-soft)]/50 transition-colors uppercase">
                                        <td className="px-8 py-5">
                                            <button
                                                onClick={() => toggleExpand(p.id)}
                                                className={`flex items-center gap-3 font-bold transition-all cursor-pointer ${expandedRows.includes(p.id) ? 'text-[var(--beheer-accent)]' : 'text-[var(--beheer-text)] hover:text-[var(--beheer-accent)]'}`}
                                            >
                                                <div className={`p-1 rounded-lg transition-colors ${expandedRows.includes(p.id) ? 'bg-[var(--beheer-accent)]/10' : 'bg-[var(--beheer-border)] group-hover:bg-[var(--beheer-accent)]/10'}`}>
                                                    {expandedRows.includes(p.id) ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                                                </div>
                                                <span className="font-black tracking-tight text-sm">{p.first_name || 'N/A'} {p.last_name || ''}</span>
                                            </button>
                                        </td>
                                        <td className="px-8 py-5 text-[var(--beheer-text-muted)] font-medium text-xs hidden sm:table-cell lowercase">{p.email || '-'}</td>
                                        <td className="px-8 py-5 text-[var(--beheer-text-muted)] font-medium text-xs hidden md:table-cell">{p.phone_number || '-'}</td>
                                        <td className="px-8 py-5 text-right">
                                            <button
                                                onClick={() => onDelete(p.id)}
                                                disabled={deletingId === p.id}
                                                className="p-3 text-[var(--beheer-text-muted)] hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                                            >
                                                {deletingId === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                            </button>
                                        </td>
                                    </tr>
                                    {expandedRows.includes(p.id) && (
                                        <tr className="bg-[var(--beheer-card-soft)]/30 border-l-4 border-l-[var(--beheer-accent)]">
                                            <td colSpan={5} className="px-12 py-8 bg-[var(--beheer-card-soft)]/20 animate-in slide-in-from-top-4 duration-300">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-[11px] font-black uppercase tracking-widest text-[var(--beheer-text-muted)]">
                                                    {p.motivation && (
                                                        <div className="flex flex-col gap-1.5 col-span-1 sm:col-span-2">
                                                            <span className="opacity-50">Motivatie</span>
                                                            <span className="text-[var(--beheer-text)] text-sm normal-case font-medium tracking-normal">{p.motivation}</span>
                                                        </div>
                                                    )}
                                                    <div className="flex flex-col gap-1.5 sm:hidden font-bold">
                                                        <span className="opacity-50">Email</span>
                                                        <span className="text-[var(--beheer-text)] text-sm lowercase">{p.email || '-'}</span>
                                                    </div>
                                                    <div className="flex flex-col gap-1.5 sm:hidden md:hidden font-bold">
                                                        <span className="opacity-50">Telefoon</span>
                                                        <span className="text-[var(--beheer-text)] text-sm">{p.phone_number || '-'}</span>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
