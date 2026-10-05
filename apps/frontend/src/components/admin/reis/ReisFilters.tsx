'use client';

import { Search, Download, Mail, Compass } from 'lucide-react';
import Link from 'next/link';
import BeheerSelect from '@/components/ui/beheer/BeheerSelect';

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
    { value: 'participant', label: 'Deelnemers' },
    { value: 'crew', label: 'Crew' },
    { value: 'driver', label: 'Bestuurders' }
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
        <div className="reis-filters-box">
            <div className="reis-filters-row">
                <div className="group relative flex-1">
                    <Search className="search-icon-left" />
                    <input
                        type="text"
                        placeholder="Zoek deelnemers..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="beheer-input pr-4 pl-11!"
                    />
                </div>

                <div className="reis-filters-controls">
                    <div className="w-full sm:w-44">
                        <BeheerSelect
                            value={statusFilter}
                            onChange={onStatusChange}
                            options={statusOptions}
                            size="sm"
                        />
                    </div>

                    <div className="w-full sm:w-40">
                        <BeheerSelect
                            value={roleFilter}
                            onChange={onRoleChange}
                            options={roleOptions}
                            size="sm"
                        />
                    </div>

                    <div className="reis-filter-actions">
                        <Link
                            href={`/beheer/reis/activiteiten?tripId=${tripId}`}
                            className="beheer-button-secondary whitespace-nowrap text-beheer-text"
                        >
                            <Compass className="size-3.5 text-beheer-accent" />
                            Activiteiten
                        </Link>
                        <Link
                            href="/beheer/reis/mail"
                            className="beheer-button-secondary whitespace-nowrap text-beheer-text"
                        >
                            <Mail className="size-3.5 text-beheer-accent" />
                            Mailen
                        </Link>
                        <button
                            onClick={onDownloadCSV}
                            className="beheer-button-secondary whitespace-nowrap"
                            type="button"
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
