'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Mail, Ticket, Edit2, Download, ChevronDown, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import AdminVisibilityToggle from '@/components/ui/admin/AdminVisibilityToggle';
import type { Trip } from '@salvemundi/validations/schema/admin-reis.zod';

interface ReisManagementHeaderProps {
    title: string;
    backHref?: string;
    trips: Trip[];
    selectedId: string | number;
    onTripChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    onExport: () => void;
    hasResults: boolean;
}

export default function ReisManagementHeader({
    title,
    backHref,
    trips,
    selectedId,
    onTripChange,
    onExport,
    hasResults
}: ReisManagementHeaderProps) {
    const router = useRouter();

    return (
        <header className="bg-[var(--beheer-card-bg)] border-b border-[var(--beheer-border)] sticky top-[var(--header-total-height,80px)] z-30 w-full transition-all mb-4">
            <div className="container mx-auto px-4 py-2.5 max-w-7xl">
                <div className="flex flex-row justify-between items-center gap-4">
                    {/* Left: Title & Back */}
                    <div className="flex items-center gap-3 min-w-max">
                        {backHref && (
                            <Link 
                                href={backHref} 
                                title="Terug"
                                className="p-1.5 rounded-lg bg-[var(--beheer-card-bg)] border border-[var(--beheer-border)] text-[var(--beheer-text-muted)] hover:text-[var(--beheer-accent)] transition-all active:scale-95 shadow-sm"
                            >
                                <ChevronLeft className="h-3.5 w-3.5" />
                            </Link>
                        )}
                        <h1 className="text-lg font-semibold text-[var(--beheer-text)] tracking-tight leading-none whitespace-nowrap">
                            {title}
                        </h1>
                    </div>

                    {/* Right: Actions Row (Now flat and compact) */}
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                        {/* Selector */}
                        <div className="relative group min-w-[180px]">
                            <select
                                value={selectedId}
                                onChange={onTripChange}
                                className="beheer-select w-full pr-8 py-1.5 text-xs font-bold uppercase tracking-wider"
                            >
                                {trips.map(trip => {
                                    const displayStartDate = trip.start_date;
                                    if (!displayStartDate) return <option key={trip.id} value={trip.id}>{trip.name}</option>;

                                    const dateDisplay = trip.end_date
                                        ? `${format(new Date(displayStartDate), 'd MMM', { locale: nl })} - ${format(new Date(trip.end_date), 'd MMM', { locale: nl })}`
                                        : format(new Date(displayStartDate), 'd MMM', { locale: nl });

                                    return (
                                        <option key={trip.id} value={trip.id} className="bg-[var(--beheer-card-bg)] text-[var(--beheer-text)]">
                                            {trip.name} ({dateDisplay})
                                        </option>
                                    );
                                })}
                            </select>
                            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--beheer-text-muted)] opacity-40 group-hover:text-[var(--beheer-accent)] transition-colors pointer-events-none" />
                        </div>

                        {/* Buttons Group - Compact */}
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() => router.push('/beheer/reis/mail')}
                                className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[var(--beheer-card-bg)] border border-[var(--beheer-border)] text-[var(--beheer-text)] rounded-xl squircle text-[11px] font-bold uppercase tracking-tight hover:border-[var(--beheer-accent)]/50 transition-all active:scale-95 shadow-sm whitespace-nowrap"
                            >
                                <Mail className="h-3.5 w-3.5 text-[var(--beheer-accent)]" />
                                Email
                            </button>

                            <button
                                onClick={() => router.push('/beheer/reis/activiteiten')}
                                className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[var(--beheer-accent)] text-white rounded-xl squircle text-[11px] font-bold uppercase tracking-tight shadow-lg hover:opacity-90 transition-all active:scale-95 border border-white/10 whitespace-nowrap"
                            >
                                <Ticket className="h-3.5 w-3.5" />
                                Activiteiten
                            </button>
                            
                            <button
                                onClick={() => router.push('/beheer/reis/instellingen')}
                                className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[var(--beheer-card-bg)] border border-[var(--beheer-border)] text-[var(--beheer-text)] rounded-xl squircle text-[11px] font-bold uppercase tracking-tight hover:border-[var(--beheer-accent)]/50 transition-all active:scale-95 shadow-sm whitespace-nowrap"
                            >
                                <Edit2 className="h-3.5 w-3.5" />
                                Instellingen
                            </button>

                            <button
                                onClick={onExport}
                                disabled={!hasResults}
                                className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-700 text-white rounded-xl squircle text-[11px] font-bold uppercase tracking-tight shadow-lg hover:bg-emerald-800 transition-all active:scale-95 disabled:opacity-50 border border-white/10 whitespace-nowrap"
                            >
                                <Download className="h-3.5 w-3.5" />
                                Export
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
