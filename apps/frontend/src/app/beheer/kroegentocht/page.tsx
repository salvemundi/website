import { Suspense } from 'react';
import { Beer, Loader2 } from 'lucide-react';
import { getPubCrawlEvents, getKroegentochtSettings } from '@/server/actions/admin-kroegentocht.actions';
import KroegentochtManagementIsland from '@/components/islands/admin/KroegentochtManagementIsland';

export const metadata = {
    title: 'Kroegentocht Beheer | Salve Mundi',
    description: 'Beheer aanmeldingen en instellingen voor de Kroegentocht.',
};

export default async function KroegentochtPage() {
    // Fetch initial data on server (PPR / SSR)
    const [events, settings] = await Promise.all([
        getPubCrawlEvents().catch(() => []),
        getKroegentochtSettings().catch(() => ({ show: true }))
    ]);

    return (
        <main className="min-h-screen bg-[var(--bg-main)]">
            {/* Page Header Area */}
            <div className="bg-[var(--bg-card)] border-b border-[var(--border-color)]">
                <div className="container mx-auto px-4 py-16 max-w-7xl">
                    <div className="flex items-center gap-5 mb-4">
                        <div className="h-14 w-14 rounded-[var(--radius-2xl)] bg-[var(--theme-purple)]/10 text-[var(--theme-purple)] flex items-center justify-center shadow-2xl shadow-[var(--theme-purple)]/10 animate-pulse">
                            <Beer className="h-8 w-8" />
                        </div>
                        <h1 className="text-5xl font-black text-[var(--text-main)] tracking-widest uppercase">
                            Kroegen<span className="text-[var(--theme-purple)]">tocht</span>
                        </h1>
                    </div>
                    <p className="text-[var(--text-subtle)] text-xl max-w-3xl leading-relaxed font-medium">
                        Bekijk inschrijvingen, beheer tickets en configureer pub crawl evenementen.
                    </p>
                </div>
            </div>

            <Suspense fallback={
                <div className="flex flex-col items-center justify-center py-40">
                    <Loader2 className="h-12 w-12 animate-spin text-[var(--theme-purple)] mb-6" />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)] animate-pulse">Data synchroniseren...</p>
                </div>
            }>
                <KroegentochtManagementIsland 
                    initialEvents={events} 
                    initialSettings={settings} 
                />
            </Suspense>
        </main>
    );
}
