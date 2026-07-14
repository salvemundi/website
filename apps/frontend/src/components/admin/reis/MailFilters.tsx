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
        <div className="lg:col-span-1 space-y-6">
            {/* Trip Selector */}
            <Card title="Selecteer Reis" icon={<Layout className="h-4 w-4" />}>
                <AdminSelect
                    value={selectedTripId}
                    onChange={onTripChange}
                    options={tripOptions}
                    size="sm"
                />
            </Card>

            {/* Filters */}
            <Card title="Ontvangers Filter" icon={<Filter className="h-4 w-4" />}>
                <div className="space-y-6">
                    <FilterField label="Status" value={filterStatus} onChange={setFilterStatus} options={statusOptions} />
                    <FilterField label="Rol" value={filterRole} onChange={setFilterRole} options={roleOptions} />
                    <FilterField label="Betaling" value={filterPayment} onChange={setFilterPayment} options={paymentOptions} />
                    <div className="relative group/search pt-2">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-(--beheer-text-muted) group-focus-within/search:text-(--beheer-accent) transition-colors opacity-50" />
                        <input 
                            type="text" 
                            placeholder="Zoek deelnemer..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-(--bg-main)/50 hover:bg-(--bg-main) border border-(--beheer-border)/50 rounded-2xl text-xs font-semibold text-(--beheer-text) placeholder:text-(--beheer-text-muted)/50 focus:ring-2 focus:ring-(--beheer-accent) focus:bg-(--bg-main) transition-all shadow-inner outline-none"
                        />
                    </div>
                </div>
            </Card>

            {/* Summary */}
            <div className="bg-(--beheer-accent)/5 rounded-3xl border border-(--beheer-accent)/20 p-8 shadow-sm group/summary relative overflow-hidden">
                <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-700">
                    <Users className="h-24 w-24 text-(--beheer-accent)" />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-1 text-(--beheer-accent)">
                        <Users className="h-5 w-5" />
                        <span className="text-3xl font-bold tracking-tight">{filteredCount}</span>
                    </div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-(--beheer-text-muted) opacity-70">
                        Ontvangers geselecteerd
                    </p>
                </div>
            </div>

            {/* Geselecteerde Ontvangers */}
            <Card title="Geselecteerde Ontvangers" icon={<Users className="h-4 w-4" />}>
                <div className="max-h-[250px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                    {filteredRecipients.length === 0 ? (
                        <p className="text-[10px] text-(--beheer-text-muted) opacity-50 italic text-center py-4">
                            Geen ontvangers geselecteerd
                        </p>
                    ) : (
                        filteredRecipients.map(recipient => (
                            <div 
                                key={recipient.id} 
                                className="flex flex-col p-3 bg-(--bg-main)/30 border border-(--beheer-border)/20 rounded-2xl text-[11px] hover:border-(--beheer-accent)/30 transition-all shadow-inner"
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <span className="font-bold text-(--beheer-text) truncate">{recipient.first_name} {recipient.last_name}</span>
                                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                                        recipient.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                                        recipient.status === 'cancelled' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                                        recipient.status === 'waitlist' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' :
                                        'bg-(--beheer-accent)/10 text-(--beheer-accent) border border-(--beheer-accent)/20'
                                    }`}>
                                        {recipient.status === 'confirmed' ? 'Bevestigd' :
                                         recipient.status === 'cancelled' ? 'Geannuleerd' :
                                         recipient.status === 'waitlist' ? 'Wachtlijst' :
                                         'Geregistreerd'}
                                    </span>
                                </div>
                                <span className="text-[10px] text-(--beheer-text-muted) truncate mt-0.5">{recipient.email}</span>
                            </div>
                        ))
                    )}
                </div>
            </Card>
        </div>
    );
}
