import { Suspense } from 'react';
import type { Metadata } from 'next';
import AnimatedBeheerHeader from '@/components/ui/admin/AnimatedBeheerHeader';
import ReisInstellingenIsland from '@/components/islands/admin/ReisInstellingenIsland';
import { Settings, Loader2 } from 'lucide-react';
import { getSystemDirectus } from '@/lib/directus';
import { readItems } from '@directus/sdk';

export const metadata: Metadata = {
    title: 'Reis Instellingen | SV Salve Mundi',
};

export default async function ReisInstellingenPage() {
    return (
        <main className="min-h-screen bg-[var(--bg-main)]">
            <Suspense fallback={
                <div className="flex flex-col items-center justify-center py-32">
                    <Loader2 className="animate-spin h-12 w-12 text-[var(--beheer-accent)] mb-4" />
                    <p className="text-[var(--beheer-text-muted)] font-black uppercase tracking-widest text-xs">Instellingen laden...</p>
                </div>
            }>
                <SettingsDataWrapper />
            </Suspense>
        </main>
    );
}

async function SettingsDataWrapper() {
    const trips = await getSystemDirectus().request(readItems('trips', {
        fields: [
            'id', 'name', 'description', 'start_date', 'end_date', 'max_participants', 
            'max_crew', 'base_price', 'deposit_amount', 'crew_discount', 'image', 
            'registration_open', 'allow_final_payments', 'is_bus_trip', 
            'registration_start_date', 'event_date'
        ] as any,
        sort: ['-event_date']
    }));

    return (
        <ReisInstellingenIsland initialTrips={trips as any} />
    );
}
