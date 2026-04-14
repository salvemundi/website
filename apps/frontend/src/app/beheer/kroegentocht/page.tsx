import { Suspense } from 'react';
import { Beer, Loader2 } from 'lucide-react';
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

    return (
        <div className="w-full">
            <Suspense fallback={<KroegentochtManagementIsland isLoading={true} />}>
                <KroegentochtDataLoader />
            </Suspense>
        </div>
    );
}

async function KroegentochtDataLoader() {
    const [events, settings] = await Promise.all([
        getPubCrawlEvents().catch(() => []),
        getKroegentochtSettings().catch(() => ({ show: true }))
    ]);

    return (
        <KroegentochtManagementIsland 
            initialEvents={events} 
            initialSettings={settings} 
        />
    );
}
