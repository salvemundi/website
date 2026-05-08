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
import { downloadCSV } from '@/lib/utils/export';
import { type PubCrawlSignup } from '@salvemundi/validations/schema/pub-crawl.zod';

interface ExtendedSignup extends PubCrawlSignup {
    participants?: { name: string; initial: string }[];
}

interface SignupListProps {
    signups: ExtendedSignup[];
    eventId: number | string;
    eventName: string;
    onDelete: (id: number | string) => void;
    onEdit: (id: number | string) => void;
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

    const exportToCSV = () => {
        const rows: Record<string, any>[] = [];
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

        const filename = `kroegentocht-${eventName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
        downloadCSV(rows, filename);
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
                            onClick={exportToCSV}
                            disabled={filteredSignups.length === 0}
                            className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-black text-xs uppercase tracking-widest rounded-[var(--radius-xl)] shadow-lg shadow-green-600/20 transition-all active:scale-95 disabled:opacity-50"
                        >
                            <Download className="h-4 w-4" />
                            Export CSV
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
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] hidden lg:table-cell">Vereniging</th>
                                <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Acties</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-color)]/20">
                            {filteredSignups.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-16 text-center text-[var(--text-muted)] italic font-medium">
                                        Geen aanmeldingen gevonden.
                                    </td>
                                </tr>
                            ) : (
                                filteredSignups.map((signup) => {
                                    // Robust participant parsing
                                    let participants = signup.participants || [];
                                    if (typeof participants === 'string') {
                                        try { participants = JSON.parse(participants); } catch { participants = []; }
                                    }
                                    if (!Array.isArray(participants)) participants = [];

                                    return (
                                        <tr key={signup.id} className="hover:bg-[var(--bg-main)]/30 transition-colors group border-b border-[var(--border-color)]/10 last:border-0">
                                            <td className="px-6 py-3 min-w-[300px]">
                                                <div className="flex flex-col gap-0.5">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-sm text-[var(--text-main)] group-hover:text-[var(--theme-purple)] transition-colors">
                                                            Groep {signups.length - signups.findIndex(s => s.id === signup.id)}
                                                        </span>
                                                        <a href={`mailto:${signup.email}`} className="text-[var(--text-muted)] hover:text-[var(--theme-purple)] transition-colors" title={signup.email}>
                                                            <Mail className="h-3 w-3" />
                                                        </a>
                                                    </div>
                                                    
                                                    {participants.length > 0 && (
                                                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                                                            {participants.map((p: any, i: number) => {
                                                                // AGGRESSIVE CLEANUP for broken JSON data
                                                                let rawName = typeof p === 'object' ? (p.name || 'Onbekend') : String(p);
                                                                let rawInitial = typeof p === 'object' ? (p.initial || '') : '';

                                                                if (rawName.includes('{"name":') || rawName.includes('"name":')) {
                                                                    const match = rawName.match(/"name":"([^"]+)"/);
                                                                    if (match) rawName = match[1];
                                                                    const initMatch = rawName.match(/"initial":"([^"]+)"/);
                                                                    if (initMatch) rawInitial = initMatch[1];
                                                                }

                                                                return (
                                                                    <div key={i} className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-[var(--bg-main)]/80 rounded-md ring-1 ring-[var(--border-color)]/30 text-[10px] font-medium text-[var(--text-light)]">
                                                                        <span className="text-[var(--text-muted)] truncate max-w-[120px]">
                                                                            {rawName}{rawInitial ? ` ${rawInitial}` : ''}
                                                                        </span>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-3 text-center">
                                                <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full bg-[var(--theme-purple)]/10 text-[var(--theme-purple)] text-[10px] font-black ring-1 ring-[var(--theme-purple)]/30">
                                                    {signup.amount_tickets}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3 text-[11px] font-medium text-[var(--text-muted)] hidden lg:table-cell">
                                                {signup.association || '-'}
                                            </td>
                                            <td className="px-6 py-3 text-right">
                                                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button 
                                                        onClick={() => signup.id && onEdit(signup.id)}
                                                        className="p-1.5 rounded-md hover:bg-[var(--theme-purple)]/10 text-[var(--text-muted)] hover:text-[var(--theme-purple)] transition-all"
                                                    >
                                                        <Edit className="h-3.5 w-3.5" />
                                                    </button>
                                                    <button 
                                                        onClick={() => signup.id && onDelete(signup.id)}
                                                        className="p-1.5 rounded-md hover:bg-red-500/10 text-[var(--text-muted)] hover:text-red-500 transition-all"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
