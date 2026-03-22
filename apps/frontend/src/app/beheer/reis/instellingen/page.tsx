import { Suspense } from 'react';
import type { Metadata } from 'next';
import PageHeader from '@/components/ui/layout/PageHeader';
import ReisInstellingenIsland from '@/components/islands/admin/ReisInstellingenIsland';
import { Loader2 } from 'lucide-react';
import { getSystemDirectus } from '@/lib/directus';
import { readItems } from '@directus/sdk';

export const metadata: Metadata = {
    title: 'Reis Instellingen | SV Salve Mundi',
};

export default async function ReisInstellingenPage() {
    return (
        <div className="min-h-screen bg-[var(--bg-main)]">
            <PageHeader 
                title="Reis Instellingen" 
                description="Beheer reizen, configuratie en algemene instellingen"
                backLink="/beheer/reis"
            />
            
            <Suspense fallback={
                <div className="flex justify-center py-20">
                    <Loader2 className="animate-spin h-10 w-10 text-[var(--theme-purple)]" />
                </div>
            }>
                <SettingsDataWrapper />
            </Suspense>
        </div>
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
