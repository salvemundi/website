'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Plane, Loader2, Edit2, ChevronDown } from 'lucide-react';
import type { Trip } from '@salvemundi/validations/schema/admin-reis.zod';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { useState, useTransition } from 'react';
import { toggleReisVisibility } from '@/server/actions/reis-admin-core.actions';
import AdminToolbar from '@/components/ui/admin/AdminToolbar';
import AdminVisibilityToggle from '@/components/ui/admin/AdminVisibilityToggle';
import AdminToast from '@/components/ui/admin/AdminToast';
import { useAdminToast } from '@/hooks/use-admin-toast';

interface AdminReisSelectorIslandProps {
    trips?: Trip[];
    initialSettings?: { show: boolean };
    isLoading?: boolean;
}

export default function AdminReisSelectorIsland({ 
    trips = [], 
    initialSettings = { show: false }
}: AdminReisSelectorIslandProps) {
    const router = useRouter();
    const { toast, showToast, hideToast } = useAdminToast();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();
    const [settings, setSettings] = useState(initialSettings);

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
                    showToast(`Reis is nu ${result.show ? 'zichtbaar' : 'verborgen'}`, 'success');
                    router.refresh();
                } else {
                    showToast(result.error || 'Fout bij bijwerken zichtbaarheid', 'error');
                }
            } catch (err) {
                showToast('Er is een onverwachte fout opgetreden', 'error');
            }
        });
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl animate-in fade-in duration-700">
            <div className="flex flex-wrap items-center gap-4">
                <div className="relative group min-w-[200px]">
                    <select
                        value={selectedId}
                        onChange={handleChange}
                        className="beheer-select"
                    >
                        {trips.map(trip => {
                            const displayStartDate = trip.start_date || trip.event_date;
                            if (!displayStartDate) return <option key={trip.id} value={trip.id} className="bg-[var(--beheer-card-bg)]">{trip.name}</option>;

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
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--beheer-text-muted)] group-hover:text-[var(--beheer-accent)] transition-colors opacity-40">
                        <ChevronDown className="h-4 w-4" />
                    </div>
                </div>

                <AdminVisibilityToggle 
                    isVisible={settings.show}
                    onToggle={handleToggleVisibility}
                    isPending={isPending}
                />

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.push('/beheer/reis/mail')}
                        className="flex items-center justify-center gap-2 px-8 py-2 bg-[var(--beheer-card-bg)] border border-[var(--beheer-border)] text-[var(--beheer-text)] rounded-[var(--beheer-radius)] text-[10px] font-black uppercase tracking-widest hover:border-[var(--beheer-accent)]/50 transition-all active:scale-95 disabled:opacity-50"
                    >
                        <Plane className="h-4 w-4 rotate-45 text-[var(--beheer-accent)]" />
                        Email
                    </button>

                    <button
                        onClick={() => router.push('/beheer/reis/activiteiten')}
                        className="flex items-center justify-center gap-2 px-8 py-2 bg-[var(--beheer-accent)] text-white font-black text-[10px] uppercase tracking-widest rounded-[var(--beheer-radius)] shadow-[var(--shadow-glow)] hover:opacity-90 transition-all active:scale-95 disabled:opacity-50"
                    >
                        <Plane className="h-4 w-4" />
                        Activiteiten
                    </button>
                    
                    <button
                        onClick={() => router.push('/beheer/reis/instellingen')}
                        className="flex items-center justify-center gap-2 px-8 py-2 bg-[var(--beheer-card-bg)] border border-[var(--beheer-border)] text-[var(--beheer-text)] rounded-[var(--beheer-radius)] text-[10px] font-black uppercase tracking-widest hover:border-[var(--beheer-accent)]/50 transition-all active:scale-95 disabled:opacity-50"
                    >
                        <Edit2 className="h-4 w-4" />
                        Instellingen
                    </button>
                </div>
            </div>
            
            <AdminToast toast={toast} onClose={hideToast} />
        </div>
    );
}
