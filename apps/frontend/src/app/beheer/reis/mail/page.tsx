import type { Metadata } from 'next';
import ReisMailIsland from '@/components/islands/admin/reis/ReisMailIsland';
import { notFound } from 'next/navigation';
import { type Trip, type TripSignup } from '@salvemundi/validations';
import AdminPageShell from '@/components/ui/admin/AdminPageShell';
import Link from 'next/link';
import { Ticket } from 'lucide-react';
import { getTripsForMail, getTripSignupsForMail } from '@/server/queries/reis/admin-reis.queries';

interface PageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export const metadata: Metadata = {
    title: 'Reis Mail Beheer | SV Salve Mundi'
};

export default async function ReisMailPage({ searchParams }: PageProps) {
    const resolvedSearchParams = await searchParams;
    const tripIdParam = typeof resolvedSearchParams.tripId === 'string' ? resolvedSearchParams.tripId : undefined;
    
    const tripsRaw = await getTripsForMail();
    const trips = tripsRaw as unknown as Trip[];

    if (trips.length === 0) {
        return (
            <AdminPageShell title="Reis Mail" backHref="/beheer/reis">
                <div className="mx-auto py-20 text-center">
                    <p className="font-bold tracking-widest text-slate-500 italic">Geen reizen gevonden.</p>
                </div>
            </AdminPageShell>
        );
    }

    const activeTripId = tripIdParam ? Number(tripIdParam) : (trips[0].id as number);
    const activeTrip = trips.find(t => t.id === activeTripId);

    if (!activeTrip) {
        notFound();
    }

    const signupsRaw = await getTripSignupsForMail(activeTripId);
    const signups = signupsRaw as unknown as TripSignup[];

    const confirmedCount = signups.filter(s => s.status === 'confirmed').length;
    const unpaidCount = signups.filter(s => s.status !== 'cancelled' && !s.full_payment_paid).length;

    return (
        <AdminPageShell
            title={`Reis Mail   ${activeTrip.name}`}
            subtitle="Verstuur bulk e-mails naar groepen reizigers"
            backHref="/beheer/reis"
            actions={
                <div className="flex items-center gap-4">
                    <div className="hidden items-center gap-4 rounded-2xl border border-border-color/50 bg-bg-soft px-4 py-2 shadow-sm md:flex">
                        <div className="flex flex-col items-center px-2">
                            <span className="mb-1 text-[10px] leading-none font-semibold text-text-muted">Bevestigde Reizigers</span>
                            <span className="text-sm leading-none font-bold text-beheer-active">{confirmedCount}</span>
                        </div>
                        <div className="h-6 w-px bg-border-color/20" />
                        <div className="flex flex-col items-center px-2">
                            <span className="mb-1 text-[10px] leading-none font-semibold text-text-muted">Openstaande Betalingen</span>
                            <span className="text-sm leading-none font-bold text-beheer-inactive">{unpaidCount}</span>
                        </div>
                    </div>
                    <Link
                        href={`/beheer/reis?tripId=${activeTripId}`}
                        className="flex items-center justify-center gap-1.5 rounded-xl border border-border-color bg-bg-card px-3 py-1.5 text-[11px] font-semibold text-text-main shadow-sm transition-all hover:border-theme-purple/50"
                    >
                        <Ticket className="size-3.5 text-theme-purple" />
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