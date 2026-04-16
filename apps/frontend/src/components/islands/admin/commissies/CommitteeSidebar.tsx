'use client';

import React from 'react';
import { 
    Users, 
    Search, 
    Mail, 
    ChevronRight 
} from 'lucide-react';
import { Input } from '@/shared/ui/Input';
import type { Committee } from '@/server/queries/admin-commissies.queries';

interface Props {
    committees: Committee[];
    selectedId: number | null;
    onSelect: (c: Committee) => void;
    searchQuery: string;
    onSearchChange: (q: string) => void;
    showAll: boolean;
    onShowAllChange: (all: boolean) => void;
}

const normalizeName = (name: string) =>
    name.toLowerCase().replace(/\s*(\|\||\|)\s*salve mundi/gi, '').trim();

export default function CommitteeSidebar({
    committees,
    selectedId,
    onSelect,
    searchQuery,
    onSearchChange,
    showAll,
    onShowAllChange
}: Props) {
    return (
        <div className="bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] shadow-sm ring-1 ring-[var(--beheer-border)] overflow-hidden h-full flex flex-col">
            <div className="p-6 border-b border-[var(--beheer-border)]/50">
                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--beheer-text-muted)] flex items-center gap-3 mb-5">
                    <Users className="h-4 w-4 text-[var(--beheer-accent)]" />
                    Groepen & Commissies
                </h2>
                
                <div className="space-y-4">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--beheer-text-muted)] group-focus-within:text-[var(--beheer-accent)] transition-colors" />
                        <Input
                            type="text"
                            placeholder="Zoek commissie..."
                            value={searchQuery}
                            onChange={e => onSearchChange(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-[var(--beheer-card-soft)] border-none rounded-xl text-xs font-bold text-[var(--beheer-text)] placeholder:text-[var(--beheer-text-muted)] focus:ring-2 focus:ring-[var(--beheer-accent)]/20 transition-all uppercase tracking-widest"
                        />
                    </div>
                    <div className="flex p-1 bg-[var(--beheer-card-soft)] rounded-xl border border-[var(--beheer-border)]/50">
                        <button
                            onClick={() => onShowAllChange(false)}
                            className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${!showAll ? 'bg-[var(--beheer-accent)] text-white shadow-sm' : 'text-[var(--beheer-text-muted)] hover:text-[var(--beheer-text)]'}`}
                        >
                            Kern
                        </button>
                        <button
                            onClick={() => onShowAllChange(true)}
                            className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${showAll ? 'bg-[var(--beheer-accent)] text-white shadow-sm' : 'text-[var(--beheer-text-muted)] hover:text-[var(--beheer-text)]'}`}
                        >
                            Alles
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-1 min-h-[400px] max-h-[600px] custom-scrollbar">
                {committees.length === 0 ? (
                    <div className="py-16 text-center">
                        <Search className="h-10 w-10 text-[var(--beheer-text-muted)] opacity-10 mx-auto mb-3" />
                        <p className="text-[var(--beheer-text-muted)] text-[10px] font-black uppercase tracking-widest opacity-40 italic">Geen resultaten</p>
                    </div>
                ) : (
                    committees.map(c => (
                        <button
                            key={c.id}
                            onClick={() => onSelect(c)}
                            className={`w-full group flex items-center justify-between p-4 rounded-xl transition-all ${selectedId === c.id
                                ? 'bg-[var(--beheer-accent)] text-white shadow-[var(--shadow-glow)]'
                                : 'hover:bg-[var(--beheer-card-soft)] text-[var(--beheer-text)] hover:translate-x-1'}`}
                        >
                            <div className="text-left min-w-0">
                                <div className={`font-black uppercase tracking-[0.1em] text-[10px] truncate ${selectedId === c.id ? 'text-white' : 'text-[var(--beheer-text)]'}`}>
                                    {normalizeName(c.name)}
                                </div>
                                {c.email && (
                                    <div className={`text-[9px] truncate flex items-center gap-1.5 mt-1 font-bold ${selectedId === c.id ? 'text-white/60' : 'text-[var(--beheer-text-muted)]'}`}>
                                        <Mail className="h-3 w-3" />
                                        {c.email}
                                    </div>
                                )}
                            </div>
                            <ChevronRight className={`h-4 w-4 shrink-0 transition-transform ${selectedId === c.id ? 'translate-x-1 text-white' : 'text-[var(--beheer-text-muted)] group-hover:text-[var(--beheer-text)]'}`} />
                        </button>
                    ))
                )}
            </div>
        </div>
    );
}
