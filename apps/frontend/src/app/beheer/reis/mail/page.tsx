import { Suspense } from 'react';
import type { Metadata } from 'next';
import PageHeader from '@/components/ui/layout/PageHeader';
import ReisMailIsland from '@/components/islands/admin/ReisMailIsland';
import { Loader2 } from 'lucide-react';
import { getSystemDirectus } from '@/lib/directus';
import { readItems } from '@directus/sdk';
import { notFound } from 'next/navigation';

interface PageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export const metadata: Metadata = {
    title: 'Reis Mail Beheer | SV Salve Mundi',
};

export default async function ReisMailPage({ searchParams }: PageProps) {
    return (
        <div className="min-h-screen bg-[var(--bg-main)]">
            <PageHeader 
                title="Bulk Mail: Reis" 
                description="Verstuur e-mails naar groepen deelnemers"
                backLink="/beheer/reis"
            />
            
            <Suspense fallback={
                <div className="flex justify-center py-20">
                    <Loader2 className="animate-spin h-10 w-10 text-[var(--theme-purple)]" />
                </div>
            }>
                <MailDataWrapper searchParams={searchParams} />
            </Suspense>
        </div>
    );
}

async function MailDataWrapper({ searchParams }: PageProps) {
    const resolvedSearchParams = await searchParams;
    const tripIdParam = typeof resolvedSearchParams.tripId === 'string' ? resolvedSearchParams.tripId : undefined;

    const trips = await getSystemDirectus().request(readItems('trips', {
        fields: ['id', 'name'] as any,
        sort: ['-event_date']
    }));

    if (!trips || trips.length === 0) {
        return (
            <div className="container mx-auto px-4 py-20 text-center">
                <p className="text-slate-500 font-bold italic uppercase tracking-widest">Geen reizen gevonden.</p>
            </div>
        );
    }

    const activeTripId = tripIdParam ? Number(tripIdParam) : trips[0].id;
    const activeTrip = trips.find(t => t.id === activeTripId);

    if (!activeTrip) {
        notFound();
    }

    // Fetch signups for the selected trip
    const signups = await getSystemDirectus().request(readItems('trip_signups', {
        filter: { trip_id: { _eq: activeTripId } },
        fields: ['id', 'first_name', 'last_name', 'email', 'status', 'role', 'deposit_paid', 'full_payment_paid'] as any,
        limit: -1
    }));

    return (
        <ReisMailIsland 
            trips={trips as any} 
            initialSignups={signups as any}
            initialSelectedTripId={activeTripId}
        />
    );
}
