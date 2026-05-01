import type { Metadata } from 'next';
import ReisMailIsland from '@/components/islands/admin/ReisMailIsland';
import { getSystemDirectus } from '@/lib/directus';
import { readItems } from '@directus/sdk';
import { notFound } from 'next/navigation';

import { Trip, TripSignup } from '@salvemundi/validations';

interface PageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export const metadata: Metadata = {
    title: 'Reis Mail Beheer | SV Salve Mundi',
};

export default async function ReisMailPage({ searchParams }: PageProps) {
    const resolvedSearchParams = await searchParams;
    const tripIdParam = typeof resolvedSearchParams.tripId === 'string' ? resolvedSearchParams.tripId : undefined;

    // NUCLEAR SSR: Fetch all trips and signups before flushing any part of the page
    const trips = await getSystemDirectus().request(readItems('trips', {
        fields: ['id', 'name'],
        sort: ['-start_date']
    })) as unknown as Trip[];

    if (!trips || trips.length === 0) {
        return (
            <div className="container mx-auto px-4 py-20 text-center">
                <p className="text-slate-500 font-bold italic uppercase tracking-widest">Geen reizen gevonden.</p>
            </div>
        );
    }

    const activeTripId = tripIdParam ? Number(tripIdParam) : (trips[0].id as number);
    const activeTrip = trips.find(t => t.id === activeTripId);

    if (!activeTrip) {
        notFound();
    }

    // Fetch signups for the selected trip
    const signups = await getSystemDirectus().request(readItems('trip_signups', {
        filter: { trip_id: { _eq: activeTripId } },
        fields: ['id', 'first_name', 'last_name', 'email', 'status', 'role', 'deposit_paid', 'full_payment_paid'],
        limit: -1
    })) as unknown as TripSignup[];

    return (
        <div className="w-full">
            <ReisMailIsland 
                trips={trips} 
                initialSignups={signups}
                initialSelectedTripId={activeTripId}
            />
        </div>
    );
}


