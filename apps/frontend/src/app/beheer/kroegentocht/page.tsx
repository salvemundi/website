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
        <main className="min-h-screen bg-[var(--bg-main)]">
            <Suspense fallback={
                <div className="flex flex-col items-center justify-center py-40">
                    <Loader2 className="h-12 w-12 animate-spin text-[var(--beheer-accent)] mb-6" />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--beheer-text-muted)] animate-pulse">Data synchroniseren...</p>
                </div>
            }>
                <KroegentochtDataLoader />
            </Suspense>
        </main>
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
