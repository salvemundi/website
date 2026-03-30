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
            {/* Page Header Area - Tokenized */}
            <div className="bg-[var(--beheer-card-bg)] border-b border-[var(--beheer-border)]">
                <div className="container mx-auto px-4 py-16 max-w-7xl">
                    <div className="flex items-center gap-5 mb-4">
                        <div className="h-14 w-14 rounded-[var(--radius-2xl)] bg-[var(--beheer-accent)]/10 text-[var(--beheer-accent)] flex items-center justify-center shadow-2xl shadow-[var(--beheer-accent)]/10 animate-pulse">
                            <Beer className="h-8 w-8" />
                        </div>
                        <h1 className="text-5xl font-black text-[var(--beheer-text)] tracking-widest uppercase">
                            Kroegen<span className="text-[var(--beheer-accent)]">tocht</span>
                        </h1>
                    </div>
                    <p className="text-[var(--beheer-text-muted)] text-xl max-w-3xl leading-relaxed font-medium">
                        Bekijk inschrijvingen, beheer tickets en configureer pub crawl evenementen.
                    </p>
                </div>
            </div>

            <Suspense fallback={
                <div className="flex flex-col items-center justify-center py-40">
                    <Loader2 className="h-12 w-12 animate-spin text-[var(--beheer-accent)] mb-6" />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--beheer-text-muted)] animate-pulse">Data synchroniseren...</p>
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
