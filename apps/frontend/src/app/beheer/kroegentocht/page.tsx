import { checkAdminAccess } from '@/server/actions/admin.actions';
import { unstable_noStore as noStore } from 'next/cache';
import { getPubCrawlEvents, getKroegentochtSettings } from '@/server/actions/admin-kroegentocht.actions';
import KroegentochtManagementIsland from '@/components/islands/admin/KroegentochtManagementIsland';

export const metadata = {
    title: 'Kroegentocht Beheer | Salve Mundi',
    description: 'Beheer aanmeldingen en instellingen voor de Kroegentocht.',
};

export default async function KroegentochtPage() {
    const { user } = await checkAdminAccess(); // Ensure authorized
    noStore();

    // NUCLEAR SSR: Fetch events and settings at the top level
    const [events, settings] = await Promise.all([
        getPubCrawlEvents().catch(() => []),
        getKroegentochtSettings().catch(() => ({ show: true }))
    ]);

    return (
        <div className="w-full">
            <KroegentochtManagementIsland 
                initialEvents={events} 
                initialSettings={settings} 
            />
        </div>
    );
}

