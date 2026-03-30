'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Plane, Loader2 } from 'lucide-react';
import type { Trip } from '@salvemundi/validations';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { useState, useTransition } from 'react';
import { toggleReisVisibility } from '@/server/actions/admin-reis.actions';

interface AdminReisSelectorIslandProps {
    trips: Trip[];
    initialSettings: { show: boolean };
}

export default function AdminReisSelectorIsland({ trips, initialSettings }: AdminReisSelectorIslandProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();
    const [settings, setSettings] = useState(initialSettings);

    // Find currently selected from URL, or fallback to chronological zero
    const currentTripId = searchParams.get('tripId');
    const selectedId = currentTripId ? Number(currentTripId) : (trips.length > 0 ? trips[0].id : '');

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        router.push(`/beheer/reis${val ? `?tripId=${val}` : ''}`);
    };

    const handleToggleVisibility = () => {
        startTransition(async () => {
            try {
                const result = await toggleReisVisibility();
                if (result.success) {
                    setSettings({ show: result.show ?? false });
                    router.refresh();
                }
            } catch (err) {
                console.error(err);
            }
        });
    };

    return (
        <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--beheer-text-muted)] mb-3 px-1">
                    Selecteer Reis
                </label>
                <div className="relative group">
                    <select
                        value={selectedId}
                        onChange={handleChange}
                        className="w-full md:w-auto pl-4 pr-10 py-3 bg-[var(--beheer-card-bg)] border border-[var(--beheer-border)] text-[var(--beheer-text)] rounded-[var(--beheer-radius)] text-[10px] font-black uppercase tracking-widest focus:ring-2 focus:ring-[var(--beheer-accent)] focus:border-transparent transition-all appearance-none cursor-pointer shadow-sm"
                    >
                        {trips.map(trip => {
                            const displayStartDate = trip.start_date || trip.event_date;
                            if (!displayStartDate) return <option key={trip.id} value={trip.id}>{trip.name}</option>;

                        const dateDisplay = trip.end_date
                            ? `${format(new Date(displayStartDate), 'd MMMM yyyy', { locale: nl })} - ${format(new Date(trip.end_date), 'd MMMM yyyy', { locale: nl })}`
                            : format(new Date(displayStartDate), 'd MMMM yyyy', { locale: nl });

                        return (
                            <option key={trip.id} value={trip.id} className="text-sm font-black uppercase tracking-widest bg-[var(--beheer-card-bg)] text-[var(--beheer-text)]">
                                {trip.name} ({dateDisplay})
                            </option>
                        );
                    })}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--beheer-text-muted)] group-hover:text-[var(--beheer-accent)] transition-colors">
                        <Loader2 className="h-4 w-4 animate-spin hidden group-aria-disabled:block" />
                        <span className="group-aria-disabled:hidden">▼</span>
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                {/* Visibility Toggle - Beheer Page Tokens */}
                <div className="flex items-center gap-3 px-4 py-2 bg-[var(--beheer-card-bg)] border border-[var(--beheer-border)] rounded-[var(--beheer-radius)] shadow-sm">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[var(--beheer-text-muted)]">Zichtbaarheid</span>
                    <button
                        onClick={handleToggleVisibility}
                        disabled={isPending}
                        className={`w-12 h-6 rounded-full p-1 transition-colors relative flex items-center ${settings.show ? 'bg-[var(--beheer-active)]' : 'bg-[var(--beheer-inactive)]'} disabled:opacity-50 hover:opacity-90 active:scale-95 transition-all`}
                    >
                        {isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin text-white mx-auto" />
                        ) : (
                            <div className={`w-4 h-4 bg-white rounded-full transition-transform ${settings.show ? 'translate-x-[1.5rem]' : 'translate-x-0'} shadow-sm`} />
                        )}
                    </button>
                </div>
                <button
                    onClick={() => router.push('/beheer/reis/mail')}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-[var(--beheer-btn-px)] py-[var(--beheer-btn-py)] bg-[var(--beheer-card-bg)] border border-[var(--beheer-border)] text-[var(--beheer-text)] rounded-[var(--beheer-radius)] text-xs font-black uppercase tracking-widest hover:border-[var(--beheer-accent)]/50 transition-all active:scale-95"
                >
                    <Plane className={`h-5 w-5 rotate-45 text-[var(--beheer-accent)]`} />
                    Email Versturen
                </button>
                <button
                    onClick={() => router.push('/beheer/reis/activiteiten')}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-[var(--beheer-btn-px)] py-[var(--beheer-btn-py)] bg-[var(--beheer-accent)] text-white font-black text-xs uppercase tracking-widest rounded-[var(--beheer-radius)] shadow-[var(--shadow-glow)] hover:opacity-90 transition-all active:scale-95"
                >
                    <Plane className="h-5 w-5" />
                    Activiteiten Beheren
                </button>
            </div>
        </div>
    );
}
