import type { Metadata } from 'next';
import ReisInstellingenIsland from '@/components/islands/admin/ReisInstellingenIsland';
import { getTrips } from '@/server/queries/admin-reis.queries';

export const metadata: Metadata = {
    title: 'Reis Instellingen | SV Salve Mundi',
};

export default async function ReisInstellingenPage() {
    // NUCLEAR SSR: Fetch all trip settings before flushing
    const trips = await getTrips();

    return (
        <div className="w-full">
            <ReisInstellingenIsland initialTrips={trips as any} />
        </div>
    );
}

