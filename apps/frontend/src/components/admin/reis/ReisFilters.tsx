'use client';

import { Search, Download, Edit, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ReisFiltersProps {
    searchQuery: string;
    onSearchChange: (value: string) => void;
    statusFilter: string;
    onStatusChange: (value: string) => void;
    roleFilter: string;
    onRoleChange: (value: string) => void;
    onDownloadExcel: () => void;
    hasResults: boolean;
    stats?: { label: string; value: string | number; icon?: import('lucide-react').LucideIcon }[];
}

export default function ReisFilters({
    searchQuery,
    onSearchChange,
    statusFilter,
    onStatusChange,
    roleFilter,
    onRoleChange,
    stats
}: Omit<ReisFiltersProps, 'onDownloadExcel' | 'hasResults'>) {
    return (
        <div className="bg-[var(--beheer-card-bg)] border border-[var(--beheer-border)]/60 rounded-[2rem] shadow-sm overflow-hidden divide-y divide-[var(--beheer-border)]/10">
            {/* Combined Cockpit Control Panel Stats Section */}
                {/* Stats Bar Integrated */}
                {stats && stats.length > 0 && (
                    <div className="px-6 py-2 bg-[var(--beheer-card-soft)]/30 flex flex-wrap items-center justify-center gap-x-10 gap-y-1">
                        {stats.map((stat, i) => (
                            <div key={i} className="flex items-center gap-2.5 group whitespace-nowrap">
                                {stat.icon && <stat.icon className="h-3 w-3 text-[var(--beheer-accent)] opacity-40 group-hover:opacity-100 transition-opacity" />}
                                <span className="text-[9px] font-semibold text-[var(--beheer-text-muted)] opacity-60 tracking-widest">
                                    {stat.label}
                                </span>
                                <span className="text-sm font-bold text-[var(--beheer-text)] tabular-nums">
                                    {stat.value}
                                </span>
                                {i < stats.length - 1 && (
                                    <div className="hidden lg:block h-0.5 w-0.5 rounded-full bg-[var(--beheer-accent)]/20 ml-8" />
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Filters Row */}
                <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 p-2.5">
                    {/* Search */}
                    <div className="relative flex-1 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--beheer-text-muted)] opacity-40 group-focus-within:text-[var(--beheer-accent)] group-focus-within:opacity-100 transition-all" />
                        <input
                            type="text"
                            placeholder="Zoek deelnemers..."
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="beheer-input w-full pl-11! pr-4 py-2"
                        />
                    </div>

                    {/* Selects Group */}
                    <div className="flex flex-col sm:flex-row items-center gap-2">
                        <div className="relative group w-full sm:w-[160px]">
                            <select
                                value={statusFilter}
                                onChange={(e) => onStatusChange(e.target.value)}
                                className="beheer-select w-full pr-10 text-xs font-semibold"
                            >
                                <option value="all">Alle statussen</option>
                                <option value="registered">Geregistreerd</option>
                                <option value="confirmed">Bevestigd</option>
                                <option value="waitlist">Wachtlijst</option>
                                <option value="cancelled">Geannuleerd</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--beheer-text-muted)] opacity-40 group-hover:text-[var(--beheer-accent)] pointer-events-none transition-colors" />
                        </div>

                        <div className="relative group w-full sm:w-[140px]">
                            <select
                                value={roleFilter}
                                onChange={(e) => onRoleChange(e.target.value)}
                                className="beheer-select w-full pr-10 text-xs font-semibold"
                            >
                                <option value="all">Alle rollen</option>
                                <option value="participant">Deelnemer</option>
                                <option value="crew">Crew</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--beheer-text-muted)] opacity-40 group-hover:text-[var(--beheer-accent)] pointer-events-none transition-colors" />
                        </div>
                    </div>
                </div>
            </div>
    );
}
