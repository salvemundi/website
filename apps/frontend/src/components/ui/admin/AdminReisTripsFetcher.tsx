import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getTrips } from '@/server/queries/admin-reis.queries';
import Link from 'next/link';
import { Plane, Plus } from 'lucide-react';

import AdminReisSelectorIsland from '@/components/islands/admin/AdminReisSelectorIsland';
import AdminReisDataFetcher from '@/components/ui/admin/AdminReisDataFetcher';
import AdminReisDashboardSkeleton from '@/components/ui/admin/AdminReisDashboardSkeleton';

import { getReisSiteSettings } from '@/server/actions/reis.actions';

import type { Trip } from '@salvemundi/validations';

interface AdminReisTripsFetcherProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AdminReisTripsFetcher({ searchParams }: AdminReisTripsFetcherProps) {
    const resolvedSearchParams = await searchParams;
    const tripIdParam = typeof resolvedSearchParams.tripId === 'string' ? resolvedSearchParams.tripId : undefined;

    let trips: Trip[] = [];
    let reisSettings = { show: true };
    try {
        const [tripsRes, settingsRes] = await Promise.all([
            getTrips(),
            getReisSiteSettings()
        ]);
        trips = tripsRes || [];
        reisSettings = settingsRes || { show: true };
    } catch (e) {
        const message = e instanceof Error ? e.message : 'Onbekende fout';
        
        // Do not throw to prevent build failures, return empty
    }

    if (!trips || trips.length === 0) {
        return (
            <div className="container mx-auto px-4 py-20 max-w-2xl text-center">
                <div className="bg-[var(--bg-card)] rounded-[var(--radius-2xl)] p-12 shadow-[var(--shadow-card)] ring-1 ring-[var(--border-color)] animate-in fade-in zoom-in duration-500">
                    <div className="h-20 w-20 rounded-full bg-[var(--theme-purple)]/10 text-[var(--theme-purple)] flex items-center justify-center mx-auto mb-6">
                        <Plane className="h-10 w-10 rotate-45" />
                    </div>
                    <h2 className="text-2xl font-bold text-[var(--text-main)] italic mb-2">Geen reizen gevonden</h2>
                    <p className="text-[var(--text-muted)] font-medium mb-8">Er zijn momenteel geen actieve of geplande reizen in het systeem.</p>
                    
                    <Link 
                        href="/beheer/reis/instellingen"
                        className="inline-flex items-center gap-2 px-8 py-4 bg-[var(--theme-purple)] text-white rounded-2xl font-bold shadow-xl shadow-[var(--theme-purple)]/20 transition-all hover:scale-[1.02] active:scale-95 group"
                    >
                        <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform" />
                        <span className="italic uppercase tracking-wider text-sm">Nieuwe reis aanmaken</span>
                    </Link>
                </div>
            </div>
        );
    }

    // Determine currently selected trip
    const activeTripId = tripIdParam ? Number(tripIdParam) : trips[0].id;
    const activeTrip = trips.find((t) => t.id === activeTripId);

    if (!activeTrip) {
        notFound();
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            {/* 2. Dropdown and controls */}
            <AdminReisSelectorIsland 
                trips={trips} 
                initialSettings={reisSettings}
            />

            {/* 3. Granular Streaming: The heavy data fetch and table rendering is suspended */}
            <Suspense fallback={<AdminReisDashboardSkeleton />} key={activeTrip.id}>
                <AdminReisDataFetcher tripId={activeTrip.id} trip={activeTrip} />
            </Suspense>
        </div>
    );
}
