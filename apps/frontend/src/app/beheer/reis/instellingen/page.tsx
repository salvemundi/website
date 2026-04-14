import { Suspense } from 'react';
import type { Metadata } from 'next';
import ReisInstellingenIsland from '@/components/islands/admin/ReisInstellingenIsland';
import { Loader2 } from 'lucide-react';
import { getTrips } from '@/server/queries/admin-reis.queries';

export const metadata: Metadata = {
    title: 'Reis Instellingen | SV Salve Mundi',
};

export default async function ReisInstellingenPage() {
    return (
        <div className="w-full">
            <Suspense fallback={
                <div className="flex flex-col items-center justify-center py-32">
                    <Loader2 className="animate-spin h-12 w-12 text-[var(--beheer-accent)] mb-4" />
                    <p className="text-[var(--beheer-text-muted)] font-black uppercase tracking-widest text-sm">Instellingen laden...</p>
                </div>
            }>
                <SettingsDataWrapper />
            </Suspense>
        </div>
    );
}

async function SettingsDataWrapper() {
    const trips = await getTrips();

    return (
        <ReisInstellingenIsland initialTrips={trips as any} />
    );
}
