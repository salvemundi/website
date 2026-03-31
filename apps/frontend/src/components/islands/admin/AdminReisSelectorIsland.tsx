'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Plane, Loader2, Edit2 } from 'lucide-react';
import type { Trip } from '@salvemundi/validations';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { useState, useTransition } from 'react';
import { toggleReisVisibility } from '@/server/actions/reis-admin-core.actions';
import AdminToolbar from '@/components/ui/admin/AdminToolbar';
import AdminVisibilityToggle from '@/components/ui/admin/AdminVisibilityToggle';

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

    const activeTrip = trips.find(t => t.id === selectedId) || trips[0];

    return (
        <AdminToolbar 
            title={activeTrip?.name || 'Reis Beheer'}
            subtitle="Bekijk aanmeldingen, beheer betalingen & configuratie"
            backHref="/beheer"
            actions={
                <>
                    <div className="relative group min-w-[200px]">
                        <select
                            value={selectedId}
                            onChange={handleChange}
                            className="w-full pl-4 pr-10 py-2.5 bg-[var(--beheer-card-bg)] border border-[var(--beheer-border)] text-[var(--beheer-text)] rounded-[var(--beheer-radius)] text-[10px] font-black uppercase tracking-widest focus:ring-2 focus:ring-[var(--beheer-accent)] focus:border-transparent transition-all appearance-none cursor-pointer shadow-sm"
                        >
                            {trips.map(trip => {
                                const displayStartDate = trip.start_date || trip.event_date;
                                if (!displayStartDate) return <option key={trip.id} value={trip.id}>{trip.name}</option>;

                                const dateDisplay = trip.end_date
                                    ? `${format(new Date(displayStartDate), 'd MMM yyyy', { locale: nl })} - ${format(new Date(trip.end_date), 'd MMM yyyy', { locale: nl })}`
                                    : format(new Date(displayStartDate), 'd MMM yyyy', { locale: nl });

                                return (
                                    <option key={trip.id} value={trip.id} className="text-sm font-black uppercase tracking-widest bg-[var(--beheer-card-bg)] text-[var(--beheer-text)]">
                                        {trip.name} ({dateDisplay})
                                    </option>
                                );
                            })}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--beheer-text-muted)] group-hover:text-[var(--beheer-accent)] transition-colors">
                            <span>▼</span>
                        </div>
                    </div>

                    <AdminVisibilityToggle 
                        isVisible={settings.show}
                        onToggle={handleToggleVisibility}
                        isPending={isPending}
                    />

                    <button
                        onClick={() => router.push('/beheer/reis/mail')}
                        className="flex items-center justify-center gap-2 px-[var(--beheer-btn-px)] py-[var(--beheer-btn-py)] bg-[var(--beheer-card-bg)] border border-[var(--beheer-border)] text-[var(--beheer-text)] rounded-[var(--beheer-radius)] text-xs font-black uppercase tracking-widest hover:border-[var(--beheer-accent)]/50 transition-all active:scale-95"
                    >
                        <Plane className="h-4 w-4 rotate-45 text-[var(--beheer-accent)]" />
                        Email
                    </button>

                    <button
                        onClick={() => router.push('/beheer/reis/activiteiten')}
                        className="flex items-center justify-center gap-2 px-[var(--beheer-btn-px)] py-[var(--beheer-btn-py)] bg-[var(--beheer-accent)] text-white font-black text-xs uppercase tracking-widest rounded-[var(--beheer-radius)] shadow-[var(--shadow-glow)] hover:opacity-90 transition-all active:scale-95"
                    >
                        <Plane className="h-4 w-4" />
                        Activiteiten
                    </button>
                    
                    <button
                        onClick={() => router.push('/beheer/reis/instellingen')}
                        className="flex items-center justify-center gap-2 px-[var(--beheer-btn-px)] py-[var(--beheer-btn-py)] bg-[var(--beheer-card-bg)] border border-[var(--beheer-border)] text-[var(--beheer-text)] rounded-[var(--beheer-radius)] text-xs font-black uppercase tracking-widest hover:border-[var(--beheer-accent)]/50 transition-all active:scale-95"
                    >
                        <Edit2 className="h-4 w-4" />
                        Instellingen
                    </button>
                </>
            }
        />
    );
}
