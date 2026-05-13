import PublicPageShell from '@/components/ui/layout/PublicPageShell';
import type { EnrichedUser } from '@/types/auth';
import { getPublicStickers } from '@/server/actions/public/stickers.actions';
import { getEnrichedSession } from '@/server/auth/auth-utils';
import StickerMapBridge from '@/components/islands/stickers/StickerMapBridge';

export const dynamic = 'force-dynamic';
export const metadata = {
    title: 'Stickerkaart | SV Salve Mundi',
    description: 'Bekijk waar onze stickers over de hele wereld zijn geplakt!'
};

export default async function StickersPage() {
    const [stickers, session] = await Promise.all([
        getPublicStickers(),
        getEnrichedSession()
    ]);

    return (
        <PublicPageShell
            title="STICKERKAART"
            description="Onze leden reizen de hele wereld over. Bekijk hier waar de Salve Mundi stickers allemaal te vinden zijn!"
        >
            <div className="container mx-auto px-4 py-12 max-w-7xl">
                <div className="rounded-3xl border border-[var(--beheer-border)] overflow-hidden shadow-2xl bg-[var(--bg-card)]">
                    {/* We gebruiken de bridge, die de ssr: false logica afhandelt */}
                    <StickerMapBridge
                        initialStickers={stickers}
                        user={(session?.user as unknown as EnrichedUser ?? null)}
                    />
                </div>
            </div>
        </PublicPageShell>
    );
}