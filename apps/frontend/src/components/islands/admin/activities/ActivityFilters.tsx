'use client';

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
        <div className="mb-10 grid grid-cols-1 items-stretch gap-4 lg:grid-cols-12">
            {/* Search Bar */}
            <div className="flex items-center gap-3 rounded-(--beheer-radius) border border-(--beheer-border) bg-(--beheer-card-bg) px-4 py-3 shadow-sm transition-all focus-within:border-(--beheer-accent) focus-within:ring-4 focus-within:ring-(--beheer-accent)/10 lg:col-span-5">
                <Search className="size-4 shrink-0 text-(--beheer-text-muted)" />
                <input
                    type="text"
                    placeholder="Zoek activiteiten op naam of locatie..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    autoComplete="off"
                    suppressHydrationWarning
                    className="beheer-input w-full border-none bg-transparent p-0 text-sm font-semibold text-(--beheer-text) outline-none placeholder:text-(--beheer-text-muted)"
                />
            </div>
            
            {/* Filters Row */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:col-span-7">
                {/* Committee Filter */}
                <div className="flex min-w-0 items-center justify-between gap-2 rounded-(--beheer-radius) border border-(--beheer-border) bg-(--beheer-card-bg) px-4 py-2.5 shadow-sm transition-colors hover:border-(--beheer-accent)/30">
                    <label className="text-[11px] font-semibold whitespace-nowrap text-(--beheer-text-muted) opacity-75">Commissie:</label>
                    <select
                        value={selectedCommittee}
                        onChange={(e) => onCommitteeChange(e.target.value)}
                        suppressHydrationWarning
                        className="beheer-select min-w-0 flex-1 cursor-pointer truncate border-none bg-transparent p-0 text-right text-[11px] font-bold text-(--beheer-text) outline-none focus:ring-0 sm:text-left"
                    >
                        <option value="all" className="bg-(--beheer-card-bg)">Alle</option>
                        {committees.map(c => (
                            <option key={c.id} value={c.id} className="bg-(--beheer-card-bg)">{c.name}</option>
                        ))}
                    </select>
                </div>

                {/* Page Size Filter */}
                <div className="flex min-w-0 items-center justify-between gap-2 rounded-(--beheer-radius) border border-(--beheer-border) bg-(--beheer-card-bg) px-4 py-2.5 shadow-sm transition-colors hover:border-(--beheer-accent)/30">
                    <label className="text-[11px] font-semibold whitespace-nowrap text-(--beheer-text-muted) opacity-75">Per pagina:</label>
                    <select
                        value={pageSize === -1 ? 'all' : pageSize}
                        onChange={(e) => onPageSizeChange(e.target.value === 'all' ? -1 : parseInt(e.target.value, 10))}
                        suppressHydrationWarning
                        className="beheer-select min-w-0 flex-1 cursor-pointer border-none bg-transparent p-0 text-right text-[11px] font-bold text-(--beheer-text) outline-none focus:ring-0 sm:text-left"
                    >
                        <option value="10" className="bg-(--beheer-card-bg)">10 items</option>
                        <option value="25" className="bg-(--beheer-card-bg)">25 items</option>
                        <option value="all" className="bg-(--beheer-card-bg)">Alles</option>
                    </select>
                </div>

                {/* Status Filter Buttons */}
                <div className="flex w-full items-center gap-1 rounded-(--beheer-radius) border border-(--beheer-border) bg-(--beheer-card-soft) p-1 shadow-sm">
                    {(['all', 'upcoming', 'past'] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => onFilterChange(f)}
                            className={`tab-button flex-1 cursor-pointer rounded-[calc(var(--beheer-radius)-4px)] px-3 py-2 text-center text-[11px] font-bold whitespace-nowrap transition-all ${
                                filter === f 
                                ? 'bg-(--beheer-accent) text-white shadow-sm' 
                                : 'text-(--beheer-text-muted) hover:bg-white/50 hover:text-(--beheer-text) dark:hover:bg-white/5'
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