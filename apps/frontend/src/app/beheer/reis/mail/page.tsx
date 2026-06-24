import type { Metadata } from 'next';
import ReisMailIsland from '@/components/islands/admin/ReisMailIsland';
import { notFound } from 'next/navigation';

import { Trip, TripSignup } from '@salvemundi/validations';

import AdminPageShell from '@/components/ui/admin/AdminPageShell';
import Link from 'next/link';
import { Ticket } from 'lucide-react';
import { db, schema } from "@salvemundi/db";
import { eq, desc } from "drizzle-orm";

interface PageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export const metadata: Metadata = {
    title: 'Reis Mail Beheer | SV Salve Mundi'
};

export default async function ReisMailPage({ searchParams }: PageProps) {
    const resolvedSearchParams = await searchParams;
    const tripIdParam = typeof resolvedSearchParams.tripId === 'string' ? resolvedSearchParams.tripId : undefined;

    const trips = await db.query.trips.findMany({
        columns: { id: true, name: true },
        orderBy: [desc(schema.trips.start_date)]
    }) as unknown as Trip[];

    if (trips.length === 0) {
        return (
            <AdminPageShell title="Reis Mail" backHref="/beheer/reis">
                <div className="py-20 text-center mx-auto">
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
    const signups = await db.query.trip_signups.findMany({
        where: eq(schema.trip_signups.trip_id, activeTripId),
        columns: { id: true, first_name: true, last_name: true, email: true, status: true, role: true, deposit_paid: true, full_payment_paid: true }
    }) as unknown as TripSignup[];

    const confirmedCount = signups.filter(s => s.status === 'confirmed').length;
    const unpaidCount = signups.filter(s => s.status !== 'cancelled' && !s.full_payment_paid).length;

    return (
        <AdminPageShell
            title={`Reis Mail — ${activeTrip.name}`}
            subtitle="Verstuur bulk e-mails naar groepen reizigers"
            backHref="/beheer/reis"
            actions={
                <div className="flex items-center gap-4">
                    <div className="hidden md:flex items-center gap-4 bg-bg-soft px-4 py-2 rounded-2xl border border-border-color/50 shadow-sm">
                        <div className="flex flex-col items-center px-2">
                            <span className="text-[10px] font-semibold text-text-muted leading-none mb-1">Bevestigde Reizigers</span>
                            <span className="text-sm font-bold text-beheer-active leading-none">{confirmedCount}</span>
                        </div>
                        <div className="w-px h-6 bg-border-color/20" />
                        <div className="flex flex-col items-center px-2">
                            <span className="text-[10px] font-semibold text-text-muted leading-none mb-1">Openstaande Betalingen</span>
                            <span className="text-sm font-bold text-beheer-inactive leading-none">{unpaidCount}</span>
                        </div>
                    </div>
                    <Link
                        href={`/beheer/reis?tripId=${activeTripId}`}
                        className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-bg-card border border-border-color text-text-main rounded-xl text-[11px] font-semibold hover:border-theme-purple/50 transition-all shadow-sm"
                    >
                        <Ticket className="h-3.5 w-3.5 text-theme-purple" />
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


