import type { Metadata } from 'next';
import ReisMailIsland from '@/components/islands/admin/ReisMailIsland';
import { getSystemDirectus } from '@/lib/directus';
import { readItems } from '@directus/sdk';
import { notFound } from 'next/navigation';

import { Trip, TripSignup } from '@salvemundi/validations';

import AdminPageShell from '@/components/ui/admin/AdminPageShell';
import Link from 'next/link';
import { Ticket } from 'lucide-react';

interface PageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export const metadata: Metadata = {
    title: 'Reis Mail Beheer | SV Salve Mundi'
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
            <AdminPageShell title="Reis Mail" backHref="/beheer/reis">
                <div className="container mx-auto px-4 py-20 text-center">
                    <p className="text-slate-500 font-bold italic tracking-widest">Geen reizen gevonden.</p>
                </div>
            </AdminPageShell>
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

    const confirmedCount = signups.filter(s => s.status === 'confirmed').length;
    const unpaidCount = signups.filter(s => !s.full_payment_paid).length;

    return (
        <AdminPageShell
            title={`Reis Mail — ${activeTrip.name}`}
            subtitle="Verstuur bulk e-mails naar groepen reizigers"
            backHref="/beheer/reis"
            actions={
                <div className="flex items-center gap-4">
                    <div className="hidden md:flex items-center gap-4 bg-[var(--beheer-card-soft)] px-4 py-2 rounded-2xl border border-[var(--beheer-border)]/50 shadow-sm">
                        <div className="flex flex-col items-center px-2">
                            <span className="text-[10px] font-semibold text-[var(--beheer-text-muted)] leading-none mb-1">Bevestigd</span>
                            <span className="text-sm font-bold text-[var(--beheer-active)] leading-none">{confirmedCount}</span>
                        </div>
                        <div className="w-px h-6 bg-[var(--beheer-border)]/20" />
                        <div className="flex flex-col items-center px-2">
                            <span className="text-[10px] font-semibold text-[var(--beheer-text-muted)] leading-none mb-1">Openstaand</span>
                            <span className="text-sm font-bold text-[var(--beheer-inactive)] leading-none">{unpaidCount}</span>
                        </div>
                    </div>
                    <Link
                        href={`/beheer/reis?tripId=${activeTripId}`}
                        className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[var(--beheer-card-bg)] border border-[var(--beheer-border)] text-[var(--beheer-text)] rounded-xl text-[11px] font-semibold hover:border-[var(--beheer-accent)]/50 transition-all shadow-sm"
                    >
                        <Ticket className="h-3.5 w-3.5 text-[var(--beheer-accent)]" />
                        Dashboard
                    </Link>
                </div>
            }
        >
            <ReisMailIsland
                trips={trips}
                initialSignups={signups}
                initialSelectedTripId={activeTripId}
            />
        </AdminPageShell>
    );
}


