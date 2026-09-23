'use client';

import { Layout, Filter, Search, Users } from 'lucide-react';
import type { Trip, TripSignup } from '@salvemundi/validations/schema/admin-trip.zod';
import { Card, FilterField } from './MailComponents';
import AdminSelect from '@/components/ui/admin/AdminSelect';

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
                <AdminSelect
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
                    <div className="flex items-center gap-3 rounded-2xl border border-(--beheer-border)/50 bg-(--bg-main)/50 px-4 py-3 shadow-inner transition-all focus-within:border-(--beheer-accent) focus-within:ring-2 focus-within:ring-(--beheer-accent) hover:bg-(--bg-main)">
                        <Search className="size-4 shrink-0 text-(--beheer-text-muted) opacity-50" />
                        <input 
                            type="text" 
                            placeholder="Zoek deelnemer..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="beheer-input w-full border-none bg-transparent p-0 text-xs font-semibold text-(--beheer-text) outline-none placeholder:text-(--beheer-text-muted)/50"
                        />
                    </div>
                </div>
            </Card>

            {/* Summary */}
            <div className="group/summary relative overflow-hidden rounded-3xl border border-(--beheer-accent)/20 bg-(--beheer-accent)/5 p-8 shadow-sm">
                <div className="absolute -right-4 -bottom-4 opacity-5 transition-transform duration-700 group-hover:scale-110 group-hover:rotate-12">
                    <Users className="size-24 text-(--beheer-accent)" />
                </div>
                <div className="relative z-10">
                    <div className="mb-1 flex items-center gap-3 text-(--beheer-accent)">
                        <Users className="size-5" />
                        <span className="text-3xl font-bold tracking-tight">{filteredCount}</span>
                    </div>
                    <p className="text-[10px] font-semibold tracking-widest text-(--beheer-text-muted) uppercase opacity-70">
                        Ontvangers geselecteerd
                    </p>
                </div>
            </div>

            {/* Geselecteerde Ontvangers */}
            <Card title="Geselecteerde Ontvangers" icon={<Users className="size-4" />}>
                <div className="custom-scrollbar max-h-62.5 space-y-2 overflow-y-auto pr-1">
                    {filteredRecipients.length === 0 ? (
                        <p className="py-4 text-center text-[10px] text-(--beheer-text-muted) italic opacity-50">
                            Geen ontvangers geselecteerd
                        </p>
                    ) : (
                        filteredRecipients.map(recipient => (
                            <div 
                                key={recipient.id} 
                                className="flex flex-col rounded-2xl border border-(--beheer-border)/20 bg-(--bg-main)/30 p-3 text-[11px] shadow-inner transition-all hover:border-(--beheer-accent)/30"
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <span className="truncate font-bold text-(--beheer-text)">{recipient.first_name} {recipient.last_name}</span>
                                    <span className={`rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ${
                                        recipient.status === 'confirmed' ? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-500' :
                                        recipient.status === 'cancelled' ? 'border border-red-500/20 bg-red-500/10 text-red-500' :
                                        recipient.status === 'waitlist' ? 'border border-yellow-500/20 bg-yellow-500/10 text-yellow-500' :
                                        'border border-(--beheer-accent)/20 bg-(--beheer-accent)/10 text-(--beheer-accent)'
                                    }`}>
                                        {recipient.status === 'confirmed' ? 'Bevestigd' :
                                         recipient.status === 'cancelled' ? 'Geannuleerd' :
                                         recipient.status === 'waitlist' ? 'Wachtlijst' :
                                         'Geregistreerd'}
                                    </span>
                                </div>
                                <span className="mt-0.5 truncate text-[10px] text-(--beheer-text-muted)">{recipient.email}</span>
                            </div>
                        ))
                    )}
                </div>
            </Card>
        </div>
    );
}
