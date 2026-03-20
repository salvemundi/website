'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Plane } from 'lucide-react';
import type { Trip } from '@salvemundi/validations';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

interface AdminReisSelectorIslandProps {
    trips: Trip[];
}

export default function AdminReisSelectorIsland({ trips }: AdminReisSelectorIslandProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Find currently selected from URL, or fallback to chronological zero
    const currentTripId = searchParams.get('tripId');
    const selectedId = currentTripId ? Number(currentTripId) : (trips.length > 0 ? trips[0].id : '');

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        router.push(`/beheer/reis${val ? `?tripId=${val}` : ''}`);
    };

    return (
        <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
                <label className="block text-sm font-semibold text-admin-muted mb-2">
                    Selecteer Reis
                </label>
                <select
                    value={selectedId}
                    onChange={handleChange}
                    className="w-full md:w-auto px-4 py-2 border border-admin bg-admin-card text-admin rounded-lg focus:ring-2 focus:ring-theme-purple focus:border-transparent"
                >
                    {trips.map(trip => {
                        const displayStartDate = trip.start_date || trip.event_date;
                        if (!displayStartDate) return <option key={trip.id} value={trip.id}>{trip.name}</option>;

                        const dateDisplay = trip.end_date
                            ? `${format(new Date(displayStartDate), 'd MMMM yyyy', { locale: nl })} - ${format(new Date(trip.end_date), 'd MMMM yyyy', { locale: nl })}`
                            : format(new Date(displayStartDate), 'd MMMM yyyy', { locale: nl });
                        return (
                            <option key={trip.id} value={trip.id}>
                                {trip.name} - {dateDisplay}
                            </option>
                        );
                    })}
                </select>
            </div>

            <div className="flex flex-wrap gap-4">
                <button
                    onClick={() => router.push('/beheer/reis/mail')}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-[var(--theme-purple)]/10 text-[var(--theme-purple)] border border-[var(--theme-purple)]/30 rounded-lg hover:bg-[var(--theme-purple)]/20 transition w-full sm:w-auto font-semibold"
                >
                    <Plane className={`h-5 w-5 rotate-45`} />
                    Email Versturen
                </button>
                <button
                    onClick={() => router.push('/beheer/reis/activiteiten')}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-[var(--theme-purple)] text-white rounded-lg hover:opacity-90 transition w-full sm:w-auto"
                >
                    <Plane className="h-5 w-5" />
                    Activiteiten Beheren
                </button>
            </div>
        </div>
    );
}
