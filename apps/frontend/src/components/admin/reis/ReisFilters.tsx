'use client';

import { Search, Download, Mail, Compass } from 'lucide-react';
import Link from 'next/link';
import AdminSelect from '@/components/ui/admin/AdminSelect';

interface ReisFiltersProps {
    searchQuery: string;
    onSearchChange: (value: string) => void;
    statusFilter: string;
    onStatusChange: (value: string) => void;
    roleFilter: string;
    onRoleChange: (value: string) => void;
    onDownloadCSV: () => void;
    tripId: number;
}

const statusOptions = [
    { value: 'all', label: 'Alle statussen' },
    { value: 'registered', label: 'Geregistreerd' },
    { value: 'confirmed', label: 'Bevestigd' },
    { value: 'waitlist', label: 'Wachtlijst' },
    { value: 'cancelled', label: 'Geannuleerd' }
];

const roleOptions = [
    { value: 'all', label: 'Alle rollen' },
    { value: 'participant', label: 'Deelnemer' },
    { value: 'crew', label: 'Crew' }
];

export default function ReisFilters({
    searchQuery,
    onSearchChange,
    statusFilter,
    onStatusChange,
    roleFilter,
    onRoleChange,
    onDownloadCSV,
    tripId
}: ReisFiltersProps) {
    return (
        <div className="rounded-4xl border border-(--beheer-border)/60 bg-(--beheer-card-bg) shadow-sm">
            <div className="flex flex-col items-stretch gap-3 p-2.5 lg:flex-row lg:items-center">
                <div className="group relative flex-1">
                    <Search className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-(--beheer-text-muted) opacity-40 transition-all group-focus-within:text-(--beheer-accent) group-focus-within:opacity-100" />
                    <input
                        type="text"
                        placeholder="Zoek deelnemers..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="beheer-input w-full py-2 pr-4 pl-11!"
                    />
                </div>

                <div className="flex flex-col items-center gap-2 sm:flex-row">
                    <div className="w-full sm:w-45">
                        <AdminSelect
                            value={statusFilter}
                            onChange={onStatusChange}
                            options={statusOptions}
                            size="sm"
                        />
                    </div>

                    <div className="w-full sm:w-[150px]">
                        <AdminSelect
                            value={roleFilter}
                            onChange={onRoleChange}
                            options={roleOptions}
                            size="sm"
                        />
                    </div>

                    <div className="flex w-full flex-wrap items-center justify-center gap-1.5 sm:w-auto">
                        <Link
                            href={`/beheer/reis/activiteiten?tripId=${tripId}`}
                            className="flex items-center justify-center gap-2 rounded-xl border border-(--beheer-border) bg-(--beheer-card-bg) px-4 py-2 text-xs font-semibold whitespace-nowrap text-(--beheer-text) shadow-sm transition-all hover:border-(--beheer-accent)/50 hover:bg-(--beheer-accent)/5"
                        >
                            <Compass className="size-3.5 text-(--beheer-accent)" />
                            Activiteiten
                        </Link>
                        <Link
                            href="/beheer/reis/mail"
                            className="flex items-center justify-center gap-2 rounded-xl border border-(--beheer-border) bg-(--beheer-card-bg) px-4 py-2 text-xs font-semibold whitespace-nowrap text-(--beheer-text) shadow-sm transition-all hover:border-(--beheer-accent)/50 hover:bg-(--beheer-accent)/5"
                        >
                            <Mail className="size-3.5 text-(--beheer-accent)" />
                            Mailen
                        </Link>
                        <button
                            onClick={onDownloadCSV}
                            className="beheer-button flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-emerald-700 px-6 py-2 text-xs font-semibold whitespace-nowrap text-white shadow-sm transition-all hover:bg-emerald-800 active:scale-95"
                        >
                            <Download className="size-3.5" />
                            Exporteer CSV
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
