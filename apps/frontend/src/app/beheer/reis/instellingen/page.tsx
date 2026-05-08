import type { Metadata } from 'next';
import ReisInstellingenIsland from '@/components/islands/admin/ReisInstellingenIsland';
import { getTrips } from '@/server/queries/admin-reis.queries';
import { getReisSiteSettings } from '@/server/actions/reis.actions';


export const metadata: Metadata = {
    title: 'Reis Instellingen | SV Salve Mundi',
};

export default async function ReisInstellingenPage() {
    // NUCLEAR SSR: Fetch all trip settings before flushing
    const [trips, settings] = await Promise.all([
        getTrips(),
        getReisSiteSettings()
    ]);

    return (
        <div className="w-full">
            <ReisInstellingenIsland 
                initialTrips={trips} 
                initialSettings={settings || { show: true }}
            />
        </div>
    );
}

