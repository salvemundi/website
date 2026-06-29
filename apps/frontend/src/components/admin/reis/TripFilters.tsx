'use client';

import { Search, Download, Mail, Compass } from 'lucide-react';
import Link from 'next/link';

interface TripFiltersProps {
    searchQuery: string;
    onSearchChange: (value: string) => void;
    statusFilter: string;
    onStatusChange: (value: string) => void;
    roleFilter: string;
    onRoleChange: (value: string) => void;
    onDownloadCSV: () => void;
    tripId: number;
}

export default function TripFilters({
    searchQuery,
    onSearchChange,
    statusFilter,
    onStatusChange,
    roleFilter,
    onRoleChange,
    onDownloadCSV,
    tripId
}: TripFiltersProps) {
    return (
        <div className="bg-(--beheer-card-bg) border border-(--beheer-border)/60 rounded-4xl shadow-sm overflow-hidden">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 p-2.5">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-(--beheer-text-muted) opacity-40 group-focus-within:text-(--beheer-accent) group-focus-within:opacity-100 transition-all" />
                    <input
                        type="text"
                        placeholder="Zoek deelnemers..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="beheer-input w-full pl-11! pr-4 py-2"
                    />
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-2">
                    <div className="w-full sm:w-[180px]">
                        <select
                            value={statusFilter}
                            onChange={(e) => onStatusChange(e.target.value)}
                            className="beheer-select text-xs font-semibold"
                        >
                            <option value="all">Alle statussen</option>
                            <option value="registered">Geregistreerd</option>
                            <option value="confirmed">Bevestigd</option>
                            <option value="waitlist">Wachtlijst</option>
                            <option value="cancelled">Geannuleerd</option>
                        </select>
                    </div>

                    <div className="w-full sm:w-[150px]">
                        <select
                            value={roleFilter}
                            onChange={(e) => onRoleChange(e.target.value)}
                            className="beheer-select text-xs font-semibold"
                        >
                            <option value="all">Alle rollen</option>
                            <option value="participant">Deelnemer</option>
                            <option value="crew">Crew</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <Link
                            href={`/beheer/reis/activiteiten?tripId=${tripId}`}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-(--beheer-card-bg) border border-(--beheer-border) text-(--beheer-text) rounded-xl text-xs font-semibold hover:border-(--beheer-accent)/50 hover:bg-(--beheer-accent)/5 transition-all shadow-sm whitespace-nowrap"
                        >
                            <Compass className="h-3.5 w-3.5 text-(--beheer-accent)" />
                            Activiteiten
                        </Link>
                        <Link
                            href="/beheer/reis/mail"
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-(--beheer-card-bg) border border-(--beheer-border) text-(--beheer-text) rounded-xl text-xs font-semibold hover:border-(--beheer-accent)/50 hover:bg-(--beheer-accent)/5 transition-all shadow-sm whitespace-nowrap"
                        >
                            <Mail className="h-3.5 w-3.5 text-(--beheer-accent)" />
                            Mailen
                        </Link>
                        <button
                            onClick={onDownloadCSV}
                            className="flex items-center justify-center gap-2 px-6 py-2 bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm hover:bg-emerald-800 transition-all active:scale-95 border border-white/10 whitespace-nowrap"
                        >
                            <Download className="h-3.5 w-3.5" />
                            Export CSV
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
