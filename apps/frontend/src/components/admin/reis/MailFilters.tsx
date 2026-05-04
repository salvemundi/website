'use client';

import { Layout, ChevronDown, Filter, Search, Users } from 'lucide-react';
import type { Trip } from '@salvemundi/validations/schema/admin-reis.zod';
import { Card, FilterField } from './MailComponents';

interface MailFiltersProps {
    trips: Trip[];
    selectedTripId: number;
    onTripChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    filterStatus: string;
    setFilterStatus: (v: string) => void;
    filterRole: string;
    setFilterRole: (v: string) => void;
    filterPayment: string;
    setFilterPayment: (v: string) => void;
    searchTerm: string;
    setSearchTerm: (v: string) => void;
    filteredCount: number;
}

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
    filteredCount
}: MailFiltersProps) {
    return (
        <div className="lg:col-span-1 space-y-6">
            {/* Trip Selector */}
            <Card title="Selecteer Reis" icon={<Layout className="h-4 w-4" />}>
                <div className="relative group">
                    <select 
                        value={selectedTripId}
                        onChange={onTripChange}
                        className="w-full pl-4 pr-10 py-3.5 bg-[var(--bg-main)]/50 border border-[var(--beheer-border)]/50 rounded-2xl text-[11px] font-semibold tracking-tight text-[var(--beheer-text)] focus:ring-2 focus:ring-[var(--beheer-accent)] focus:bg-[var(--bg-main)] transition-all appearance-none cursor-pointer shadow-inner"
                    >
                        {trips.map(trip => (
                            <option key={trip.id} value={trip.id} className="text-base font-semibold">{trip.name}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--beheer-text-muted)] pointer-events-none group-hover:text-[var(--beheer-accent)] transition-colors opacity-50" />
                </div>
            </Card>

            {/* Filters */}
            <Card title="Ontvangers Filter" icon={<Filter className="h-4 w-4" />}>
                <div className="space-y-6">
                    <FilterField label="Status" value={filterStatus} onChange={setFilterStatus}>
                        <option value="all">Alle Statussen</option>
                        <option value="registered">Geregistreerd</option>
                        <option value="confirmed">Bevestigd</option>
                        <option value="waitlist">Wachtlijst</option>
                        <option value="cancelled">Geannuleerd</option>
                    </FilterField>
                    <FilterField label="Rol" value={filterRole} onChange={setFilterRole}>
                        <option value="all">Alle Rollen</option>
                        <option value="participant">Deelnemer</option>
                        <option value="crew">Crew</option>
                    </FilterField>
                    <FilterField label="Betaling" value={filterPayment} onChange={setFilterPayment}>
                        <option value="all">Alle Betalingen</option>
                        <option value="unpaid">Onbetaald</option>
                        <option value="deposit_paid">Aanbetaling OK</option>
                        <option value="full_paid">Volledig OK</option>
                    </FilterField>
                    <div className="relative group/search pt-2">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--beheer-text-muted)] group-focus-within/search:text-[var(--beheer-accent)] transition-colors opacity-50" />
                        <input 
                            type="text" 
                            placeholder="Zoek deelnemer..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-[var(--bg-main)]/50 hover:bg-[var(--bg-main)] border border-[var(--beheer-border)]/50 rounded-2xl text-xs font-semibold text-[var(--beheer-text)] placeholder:text-[var(--beheer-text-muted)]/50 focus:ring-2 focus:ring-[var(--beheer-accent)] focus:bg-[var(--bg-main)] transition-all shadow-inner outline-none"
                        />
                    </div>
                </div>
            </Card>

            {/* Summary */}
            <div className="bg-[var(--beheer-accent)]/5 rounded-3xl border border-[var(--beheer-accent)]/20 p-8 shadow-sm group/summary relative overflow-hidden">
                <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-700">
                    <Users className="h-24 w-24 text-[var(--beheer-accent)]" />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-1 text-[var(--beheer-accent)]">
                        <Users className="h-5 w-5" />
                        <span className="text-3xl font-bold tracking-tight">{filteredCount}</span>
                    </div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--beheer-text-muted)] opacity-70">
                        Ontvangers geselecteerd
                    </p>
                </div>
            </div>
        </div>
    );
}
