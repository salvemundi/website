'use client';

import { useState } from 'react';
import { 
    Search, 
    Download, 
    AlertCircle, 
    Trash2, 
    Edit, 
    Mail, 
    ExternalLink 
} from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import * as XLSX from 'xlsx';

interface SignupListProps {
    signups: any[];
    eventId: number;
    eventName: string;
    onDelete: (id: number) => void;
    onEdit: (id: number) => void;
}

export default function SignupList({
    signups,
    eventId,
    eventName,
    onDelete,
    onEdit
}: SignupListProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [showAll, setShowAll] = useState(false);

    const filteredSignups = signups.filter(s => {
        const matchesSearch = 
            s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.association?.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesStatus = showAll || s.payment_status === 'paid';
        
        return matchesSearch && matchesStatus;
    });

    const exportToExcel = () => {
        const rows: any[] = [];
        filteredSignups.forEach(signup => {
            const participants = signup.participants || [];
            if (participants.length > 0) {
                participants.forEach((p: any) => {
                    rows.push({
                        'Naam': `${p.name} ${p.initial}.`,
                        'Vereniging': signup.association || '-',
                        'Groep': signup.email
                    });
                });
            } else {
                for (let i = 0; i < signup.amount_tickets; i++) {
                    rows.push({
                        'Naam': i === 0 ? signup.name : '-',
                        'Vereniging': signup.association || '-',
                        'Groep': signup.email
                    });
                }
            }
        });

        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Aanmeldingen');
        ws['!cols'] = [{ wch: 30 }, { wch: 20 }, { wch: 30 }];
        
        const filename = `kroegentocht-${eventName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
        XLSX.writeFile(wb, filename);
    };

    return (
        <div className="space-y-6">
            {/* Filters & Actions */}
            <div className="bg-[var(--bg-card)] rounded-[var(--radius-2xl)] shadow-[var(--shadow-card)] ring-1 ring-[var(--border-color)]/30 p-6">
                <div className="flex flex-col lg:flex-row gap-6 justify-between items-stretch">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--text-muted)] group-focus-within:text-[var(--theme-purple)] transition-colors" />
                        <input
                            type="text"
                            placeholder="Zoek op naam, email of vereniging..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            autoComplete="off"
                            spellCheck={false}
                            suppressHydrationWarning={true}
                            className="w-full pl-12 pr-4 py-3 bg-[var(--bg-main)]/50 border-2 border-[var(--border-color)]/50 rounded-[var(--radius-xl)] focus:ring-4 focus:ring-[var(--theme-purple)]/10 focus:border-[var(--theme-purple)] transition-all font-medium text-sm text-[var(--text-main)]"
                        />
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={() => setShowAll(!showAll)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-[var(--radius-xl)] font-black text-xs uppercase tracking-widest transition-all active:scale-95 border-2 ${
                                showAll
                                ? 'bg-amber-500/10 border-amber-500 text-amber-500'
                                : 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-light)] hover:border-[var(--theme-purple)]/30'
                            }`}
                        >
                            <AlertCircle className="h-4 w-4" />
                            {showAll ? 'Verberg onbetaald' : 'Toon alles'}
                        </button>

                        <button
                            onClick={exportToExcel}
                            disabled={filteredSignups.length === 0}
                            className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-black text-xs uppercase tracking-widest rounded-[var(--radius-xl)] shadow-lg shadow-green-600/20 transition-all active:scale-95 disabled:opacity-50"
                        >
                            <Download className="h-4 w-4" />
                            Export Excel
                        </button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-[var(--bg-card)] rounded-[var(--radius-2xl)] shadow-[var(--shadow-card)] ring-1 ring-[var(--border-color)]/30 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-[var(--bg-main)]/50 border-b border-[var(--border-color)]/30">
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Groep / Deelnemers</th>
                                <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Tickets</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] hidden md:table-cell">Status</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] hidden lg:table-cell">Vereniging</th>
                                <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Acties</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-color)]/20">
                            {filteredSignups.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-16 text-center text-[var(--text-muted)] italic font-medium">
                                        Geen aanmeldingen gevonden voor dit filter.
                                    </td>
                                </tr>
                            ) : (
                                filteredSignups.map((signup) => (
                                    <tr key={signup.id} className="hover:bg-[var(--bg-main)]/30 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-[var(--text-main)] group-hover:text-[var(--theme-purple)] transition-colors">{signup.name}</span>
                                                    <a href={`mailto:${signup.email}`} className="text-[var(--text-light)] hover:text-[var(--theme-purple)]">
                                                        <Mail className="h-3 w-3" />
                                                    </a>
                                                </div>
                                                <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase">{signup.email}</div>
                                                {signup.participants?.length > 0 && (
                                                    <div className="mt-2 space-y-1 pl-3 border-l-2 border-[var(--theme-purple)]/20">
                                                        {signup.participants.map((p: any, i: number) => (
                                                            <div key={i} className="text-[11px] text-[var(--text-light)] font-medium">
                                                                • {p.name} {p.initial}.
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[var(--theme-purple)]/10 text-[var(--theme-purple)] text-xs font-black ring-1 ring-[var(--theme-purple)]/20">
                                                {signup.amount_tickets}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 hidden md:table-cell">
                                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ring-1 ${
                                                signup.payment_status === 'paid'
                                                ? 'bg-green-500/10 text-green-500 ring-green-500/20'
                                                : signup.payment_status === 'open'
                                                ? 'bg-amber-500/10 text-amber-500 ring-amber-500/20'
                                                : 'bg-red-500/10 text-red-500 ring-red-500/20'
                                            }`}>
                                                {signup.payment_status === 'paid' ? 'Betaald' : signup.payment_status === 'open' ? 'Open' : signup.payment_status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-bold text-[var(--text-subtle)] hidden lg:table-cell">
                                            {signup.association || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-1">
                                                <button 
                                                    onClick={() => onEdit(signup.id)}
                                                    className="p-2 rounded-lg hover:bg-[var(--theme-purple)]/10 text-[var(--text-muted)] hover:text-[var(--theme-purple)] transition-all active:scale-90"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                <button 
                                                    onClick={() => onDelete(signup.id)}
                                                    className="p-2 rounded-lg hover:bg-red-500/10 text-[var(--text-muted)] hover:text-red-500 transition-all active:scale-90"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
