'use client';

import { Layout, Filter, Search, Users } from 'lucide-react';
import type { Trip, TripSignup } from '@salvemundi/validations';
import { Card, FilterField } from './MailComponents';
import BeheerSelect from '@/components/ui/beheer/BeheerSelect';

interface MailFiltersProps {
    trips: Trip[];
    selectedTripId: number;
    onTripChange: (id: number) => void;
    filterStatus: string;
    setFilterStatus: (status: string) => void;
    filterRole: string;
    setFilterRole: (role: string) => void;
    filterPayment: string;
    setFilterPayment: (paymentStatus: string) => void;
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    filteredCount: number;
    filteredRecipients: TripSignup[];
}

const statusOptions = [
    { value: 'all', label: 'Alle Statussen' },
    { value: 'registered', label: 'Geregistreerd' },
    { value: 'confirmed', label: 'Bevestigd' },
    { value: 'waitlist', label: 'Wachtlijst' },
    { value: 'cancelled', label: 'Geannuleerd' }
];

const roleOptions = [
    { value: 'all', label: 'Alle Rollen' },
    { value: 'participant', label: 'Deelnemer' },
    { value: 'crew', label: 'Crew' }
];

const paymentOptions = [
    { value: 'all', label: 'Alle Betalingen' },
    { value: 'unpaid', label: 'Onbetaald' },
    { value: 'deposit_paid', label: 'Aanbetaling OK' },
    { value: 'full_paid', label: 'Volledig OK' }
];

export default function MailFilters({
    trips,
    selectedTripId,
    onTripChange,
    filterStatus,
    setFilterStatus,
    filterRole,
    setFilterRole,
    filterPayment,
    setFilterPayment,
    searchTerm,
    setSearchTerm,
    filteredCount,
    filteredRecipients
}: MailFiltersProps) {
    const tripOptions = trips.map(trip => ({
        value: trip.id,
        label: trip.name || 'Onbekende reis'
    }));

    return (
        <div className="space-y-6 lg:col-span-1">
            {/* Trip Selector */}
            <Card title="Selecteer Reis" icon={<Layout className="size-4" />}>
                <BeheerSelect
                    value={selectedTripId}
                    onChange={onTripChange}
                    options={tripOptions}
                    size="sm"
                />
            </Card>

            {/* Filters */}
            <Card title="Ontvangers Filter" icon={<Filter className="size-4" />}>
                <div className="space-y-6">
                    <FilterField label="Status" value={filterStatus} onChange={setFilterStatus} options={statusOptions} />
                    <FilterField label="Rol" value={filterRole} onChange={setFilterRole} options={roleOptions} />
                    <FilterField label="Betaling" value={filterPayment} onChange={setFilterPayment} options={paymentOptions} />
                    <div className="search-bar hover:bg-bg-main">
                        <Search className="size-4 shrink-0 text-beheer-text-muted opacity-50" />
                        <input 
                            type="text" 
                            placeholder="Zoek deelnemer..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="beheer-input p-0"
                        />
                    </div>
                </div>
            </Card>

            {/* Summary */}
            <div className="group/summary recipient-summary-card">
                <div className="recipient-summary-bg-icon">
                    <Users className="size-24 text-beheer-accent" />
                </div>
                <div className="relative z-10">
                    <div className="recipient-summary-header">
                        <Users className="size-5" />
                        <span className="text-3xl font-bold tracking-tight">{filteredCount}</span>
                    </div>
                    <p className="recipient-summary-label">
                        Ontvangers geselecteerd
                    </p>
                </div>
            </div>

            {/* Geselecteerde Ontvangers */}
            <Card title="Geselecteerde Ontvangers" icon={<Users className="size-4" />}>
                <div className="recipient-list">
                    {filteredRecipients.length === 0 ? (
                        <p className="recipient-empty-text">
                            Geen ontvangers geselecteerd
                        </p>
                    ) : (
                        filteredRecipients.map(recipient => (
                            <div 
                                key={recipient.id} 
                                className="recipient-card"
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <span className="truncate font-bold text-beheer-text">{recipient.first_name} {recipient.last_name}</span>
                                    <span className={
                                        recipient.status === 'confirmed' ? 'status-badge-mini-confirmed' :
                                        recipient.status === 'cancelled' ? 'status-badge-mini-cancelled' :
                                        recipient.status === 'waitlist' ? 'status-badge-mini-waitlist' :
                                        'status-badge-mini-registered'
                                    }>
                                        {recipient.status === 'confirmed' ? 'Bevestigd' :
                                         recipient.status === 'cancelled' ? 'Geannuleerd' :
                                         recipient.status === 'waitlist' ? 'Wachtlijst' :
                                         'Geregistreerd'}
                                    </span>
                                </div>
                                <span className="mt-0.5 truncate text-2xs text-beheer-text-muted">{recipient.email}</span>
                            </div>
                        ))
                    )}
                </div>
            </Card>
        </div>
    );
}
