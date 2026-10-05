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
        <div className="activity-filters-wrapper">
            {/* Search Bar */}
            <div className="search-bar lg:col-span-5">
                <Search className="size-4 shrink-0 text-beheer-text-muted" />
                <input
                    type="text"
                    placeholder="Zoek activiteiten op naam of locatie..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    autoComplete="off"
                    suppressHydrationWarning
                    className="beheer-input p-0"
                />
            </div>

            {/* Filters Row */}
            <div className="activity-filters-grid">
                {/* Committee Filter */}
                <div className="filter-select-box">
                    <label className="filter-label">Commissie:</label>
                    <select
                        value={selectedCommittee}
                        onChange={(e) => onCommitteeChange(e.target.value)}
                        suppressHydrationWarning
                        className="beheer-select filter-select-input"
                    >
                        <option value="all" className="bg-beheer-card-bg">Alle</option>
                        {committees.map(c => (
                            <option key={c.id} value={c.id} className="bg-beheer-card-bg">{c.name}</option>
                        ))}
                    </select>
                </div>

                {/* Page Size Filter */}
                <div className="filter-select-box">
                    <label className="filter-label">Per pagina:</label>
                    <select
                        value={pageSize === -1 ? 'all' : pageSize}
                        onChange={(e) => onPageSizeChange(e.target.value === 'all' ? -1 : parseInt(e.target.value, 10))}
                        suppressHydrationWarning
                        className="beheer-select filter-select-input"
                    >
                        <option value="10" className="bg-beheer-card-bg">10 items</option>
                        <option value="25" className="bg-beheer-card-bg">25 items</option>
                        <option value="all" className="bg-beheer-card-bg">Alles</option>
                    </select>
                </div>

                {/* Status Filter Buttons */}
                <div className="filter-button-strip">
                    {(['all', 'upcoming', 'past'] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => onFilterChange(f)}
                            className={`tab-button ${
                                filter === f 
                                ? 'bg-beheer-accent text-wit-paars' 
                                : 'text-beheer-text-muted hover:text-beheer-text'
                            }`}
                            type="button">
                            {f === 'all' ? 'Alle' : f === 'upcoming' ? 'Aankomend' : 'Verleden'}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}