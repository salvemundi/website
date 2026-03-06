import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getTrips } from '@/server/actions/admin-reis.actions';

import AdminReisSelectorIsland from '@/components/islands/beheer/AdminReisSelectorIsland';
import AdminReisDataFetcher from '@/components/ui/beheer/AdminReisDataFetcher';
import AdminReisDashboardSkeleton from '@/components/ui/beheer/AdminReisDashboardSkeleton';

import type { Trip } from '@salvemundi/validations';

interface AdminReisTripsFetcherProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AdminReisTripsFetcher({ searchParams }: AdminReisTripsFetcherProps) {
    const resolvedSearchParams = await searchParams;
    const tripIdParam = typeof resolvedSearchParams.tripId === 'string' ? resolvedSearchParams.tripId : undefined;

    let trips: Trip[] = [];
    try {
        trips = await getTrips();
    } catch (e: any) {
        console.error('[AdminReisTripsFetcher] Error fetching trips:', e.message);
        // Do not throw to prevent build failures, return empty
    }

    if (!trips || trips.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-theme-bg">
                <div className="text-center py-12">
                    <p className="text-admin-muted">Geen reizen gevonden om te beheren.</p>
                </div>
            </div>
        );
    }

    // Determine currently selected trip
    const activeTripId = tripIdParam ? Number(tripIdParam) : trips[0].id;
    const activeTrip = trips.find((t: any) => t.id === activeTripId);

    if (!activeTrip) {
        notFound();
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            {/* 2. Dropdown and controls */}
            <AdminReisSelectorIsland trips={trips} />

            {/* 3. Granular Streaming: The heavy data fetch and table rendering is suspended */}
            <Suspense fallback={<AdminReisDashboardSkeleton />} key={activeTrip.id}>
                <AdminReisDataFetcher tripId={activeTrip.id} trip={activeTrip} />
            </Suspense>
        </div>
    );
}
