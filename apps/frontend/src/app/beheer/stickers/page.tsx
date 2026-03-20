import { Suspense } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { getStickers } from '@/server/actions/admin-stickers.actions';
import StickerManagementIsland from '@/components/islands/admin/StickerManagementIsland';

export const metadata = {
    title: 'Sticker Beheer | Salve Mundi',
    description: 'Beheer en modereer stickerlocaties.',
};

export default async function StickersAdminPage() {
    // Fetch initial stickers on server
    const stickers = await getStickers().catch(() => []);

    return (
        <main className="min-h-screen bg-[var(--bg-main)]">
            {/* Page Header Area */}
            <div className="bg-[var(--bg-card)] border-b border-[var(--border-color)]">
                <div className="container mx-auto px-4 py-16 max-w-7xl">
                    <div className="flex items-center gap-5 mb-4">
                        <div className="h-14 w-14 rounded-[var(--radius-2xl)] bg-[var(--theme-purple)]/10 text-[var(--theme-purple)] flex items-center justify-center shadow-2xl shadow-[var(--theme-purple)]/10 animate-pulse">
                            <MapPin className="h-8 w-8" />
                        </div>
                        <h1 className="text-5xl font-black text-[var(--text-main)] tracking-widest uppercase">
                            Sticker<span className="text-[var(--theme-purple)]">Beheer</span>
                        </h1>
                    </div>
                    <p className="text-[var(--text-subtle)] text-xl max-w-3xl leading-relaxed font-medium">
                        Bekijk alle stickerlocaties, analyseer de wereldwijde spreiding en modereer inzendingen.
                    </p>
                </div>
            </div>

            <Suspense fallback={
                <div className="flex flex-col items-center justify-center py-40">
                    <Loader2 className="h-12 w-12 animate-spin text-[var(--theme-purple)] mb-6" />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)] animate-pulse">Geodata ophalen...</p>
                </div>
            }>
                <StickerManagementIsland initialStickers={stickers} />
            </Suspense>
        </main>
    );
}
