import { Suspense } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { getStickers } from '@/server/actions/admin-stickers.actions';
import StickerManagementIsland from '@/components/islands/admin/StickerManagementIsland';
import { checkAdminAccess } from '@/server/actions/admin.actions';

export const metadata = {
    title: 'Sticker Beheer | Salve Mundi',
    description: 'Beheer en modereer stickerlocaties.',
};

export default async function StickersAdminPage() {
    const { user } = await checkAdminAccess();

    return (
        <main className="min-h-screen bg-[var(--bg-main)]">
            <Suspense fallback={
                <div className="flex flex-col items-center justify-center py-40">
                    <Loader2 className="h-12 w-12 animate-spin text-[var(--beheer-accent)] mb-6" />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--beheer-text-muted)] animate-pulse">Geodata ophalen...</p>
                </div>
            }>
                <StickersDataLoader />
            </Suspense>
        </main>
    );
}

async function StickersDataLoader() {
    const stickers = await getStickers().catch(() => []);
    return <StickerManagementIsland initialStickers={stickers} />;
}
