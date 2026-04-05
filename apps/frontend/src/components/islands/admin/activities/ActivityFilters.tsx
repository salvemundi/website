'use client';

import React from 'react';
import { Search } from 'lucide-react';

interface Props {
    searchQuery: string;
    onSearchChange: (q: string) => void;
    filter: 'all' | 'upcoming' | 'past';
    onFilterChange: (f: 'all' | 'upcoming' | 'past') => void;
    pageSize: number | -1;
    onPageSizeChange: (size: number | -1) => void;
    selectedCommittee: string;
    committees: { id: string, name: string }[];
    onCommitteeChange: (id: string) => void;
}

export default function ActivityFilters({
    searchQuery,
    onSearchChange,
    filter,
    onFilterChange,
    pageSize,
    onPageSizeChange,
    selectedCommittee,
    committees,
    onCommitteeChange
}: Props) {
    return (
        <div className="flex flex-col xl:flex-row gap-4 mb-10 items-stretch xl:items-center animate-in fade-in slide-in-from-top-4 duration-500">
            {/* Search Bar */}
            <div className="relative group flex-1 shadow-sm rounded-[var(--beheer-radius)]">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none z-20">
                    <Search className="h-4 w-4 text-[var(--beheer-text-muted)] group-focus-within:text-[var(--beheer-accent)] transition-colors" />
                </div>
                <input
                    type="text"
                    placeholder="Zoek activiteiten op naam of locatie..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    autoComplete="off"
                    suppressHydrationWarning
                    className="w-full pl-11 pr-5 py-4 rounded-[var(--beheer-radius)] border border-[var(--beheer-border)] bg-[var(--beheer-card-bg)] text-[var(--beheer-text)] placeholder:text-[var(--beheer-text-muted)] focus:ring-4 focus:ring-[var(--beheer-accent)]/10 focus:border-[var(--beheer-accent)] outline-none transition-all font-bold uppercase tracking-widest text-[10px]"
                />
            </div>
            
            <div className="flex flex-wrap md:flex-nowrap items-stretch md:items-center gap-4">
                {/* Committee Filter */}
                <div className="flex-1 md:flex-none flex items-center gap-3 px-5 py-3 bg-[var(--beheer-card-bg)] border border-[var(--beheer-border)] rounded-[var(--beheer-radius)] shadow-sm hover:border-[var(--beheer-accent)]/30 transition-colors">
                    <label className="text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest whitespace-nowrap opacity-60">Commissie</label>
                    <select
                        value={selectedCommittee}
                        onChange={(e) => onCommitteeChange(e.target.value)}
                        suppressHydrationWarning
                        className="bg-transparent text-[var(--beheer-text)] text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer border-none p-0 focus:ring-0 min-w-[100px]"
                    >
                        <option value="all" className="bg-[var(--beheer-card-bg)]">Alle</option>
                        {committees.map(c => (
                            <option key={c.id} value={c.id} className="bg-[var(--beheer-card-bg)]">{c.name}</option>
                        ))}
                    </select>
                </div>

                {/* Page Size Filter */}
                <div className="flex-1 md:flex-none flex items-center gap-3 px-5 py-3 bg-[var(--beheer-card-bg)] border border-[var(--beheer-border)] rounded-[var(--beheer-radius)] shadow-sm hover:border-[var(--beheer-accent)]/30 transition-colors">
                    <label className="text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest whitespace-nowrap opacity-60">Per pagina</label>
                    <select
                        value={pageSize === -1 ? 'all' : pageSize}
                        onChange={(e) => onPageSizeChange(e.target.value === 'all' ? -1 : parseInt(e.target.value, 10))}
                        suppressHydrationWarning
                        className="bg-transparent text-[var(--beheer-text)] text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer border-none p-0 focus:ring-0"
                    >
                        <option value="10" className="bg-[var(--beheer-card-bg)]">10 items</option>
                        <option value="25" className="bg-[var(--beheer-card-bg)]">25 items</option>
                        <option value="all" className="bg-[var(--beheer-card-bg)]">Alles</option>
                    </select>
                </div>

                {/* Status Filter Buttons */}
                <div className="w-full md:w-auto flex gap-1 p-1 bg-[var(--beheer-card-soft)] border border-[var(--beheer-border)] rounded-[var(--beheer-radius)] shadow-sm">
                    {(['all', 'upcoming', 'past'] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => onFilterChange(f)}
                            className={`flex-1 md:flex-none px-6 py-2 rounded-[calc(var(--beheer-radius)-4px)] text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer whitespace-nowrap ${
                                filter === f 
                                ? 'bg-[var(--beheer-accent)] text-white shadow-md' 
                                : 'text-[var(--beheer-text-muted)] hover:text-[var(--beheer-text)] hover:bg-white/50'
                            }`}
                        >
                            {f === 'all' ? 'Alle' : f === 'upcoming' ? 'Aankomend' : 'Verleden'}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
