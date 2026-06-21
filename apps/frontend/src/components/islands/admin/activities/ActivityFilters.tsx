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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-10 items-stretch">
            {/* Search Bar */}
            <div className="relative group lg:col-span-5 shadow-sm rounded-(--beheer-radius) flex items-stretch">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none z-20">
                    <Search className="h-4 w-4 text-(--beheer-text-muted) group-focus-within:text-(--beheer-accent) transition-colors" />
                </div>
                <input
                    type="text"
                    placeholder="Zoek activiteiten op naam of locatie..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    autoComplete="off"
                    suppressHydrationWarning
                    className="w-full pl-11 pr-5 py-3 rounded-(--beheer-radius) border border-(--beheer-border) bg-(--beheer-card-bg) text-(--beheer-text) placeholder:text-(--beheer-text-muted) focus:ring-4 focus:ring-(--beheer-accent)/10 focus:border-(--beheer-accent) outline-none transition-all font-semibold text-sm"
                />
            </div>
            
            {/* Filters Row */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Committee Filter */}
                <div className="flex min-w-0 items-center justify-between gap-2 px-4 py-2.5 bg-(--beheer-card-bg) border border-(--beheer-border) rounded-(--beheer-radius) shadow-sm hover:border-(--beheer-accent)/30 transition-colors">
                    <label className="text-[11px] font-semibold text-(--beheer-text-muted) whitespace-nowrap opacity-75">Commissie:</label>
                    <select
                        value={selectedCommittee}
                        onChange={(e) => onCommitteeChange(e.target.value)}
                        suppressHydrationWarning
                        className="bg-transparent text-(--beheer-text) text-[11px] font-bold outline-none cursor-pointer border-none p-0 focus:ring-0 min-w-0 flex-1 text-right sm:text-left truncate"
                    >
                        <option value="all" className="bg-(--beheer-card-bg)">Alle</option>
                        {committees.map(c => (
                            <option key={c.id} value={c.id} className="bg-(--beheer-card-bg)">{c.name}</option>
                        ))}
                    </select>
                </div>

                {/* Page Size Filter */}
                <div className="flex min-w-0 items-center justify-between gap-2 px-4 py-2.5 bg-(--beheer-card-bg) border border-(--beheer-border) rounded-(--beheer-radius) shadow-sm hover:border-(--beheer-accent)/30 transition-colors">
                    <label className="text-[11px] font-semibold text-(--beheer-text-muted) whitespace-nowrap opacity-75">Per pagina:</label>
                    <select
                        value={pageSize === -1 ? 'all' : pageSize}
                        onChange={(e) => onPageSizeChange(e.target.value === 'all' ? -1 : parseInt(e.target.value, 10))}
                        suppressHydrationWarning
                        className="bg-transparent text-(--beheer-text) text-[11px] font-bold outline-none cursor-pointer border-none p-0 focus:ring-0 min-w-0 flex-1 text-right sm:text-left"
                    >
                        <option value="10" className="bg-(--beheer-card-bg)">10 items</option>
                        <option value="25" className="bg-(--beheer-card-bg)">25 items</option>
                        <option value="all" className="bg-(--beheer-card-bg)">Alles</option>
                    </select>
                </div>

                {/* Status Filter Buttons */}
                <div className="w-full flex gap-1 p-1 bg-(--beheer-card-soft) border border-(--beheer-border) rounded-(--beheer-radius) shadow-sm items-center">
                    {(['all', 'upcoming', 'past'] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => onFilterChange(f)}
                            className={`flex-1 px-3 py-2 rounded-[calc(var(--beheer-radius)-4px)] text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap text-center ${
                                filter === f 
                                ? 'bg-(--beheer-accent) text-white shadow-sm' 
                                : 'text-(--beheer-text-muted) hover:text-(--beheer-text) hover:bg-white/50 dark:hover:bg-white/5'
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
