import PublicPageShell from '@/components/ui/layout/PublicPageShell';
import type { EnrichedUser } from '@/types/auth';
import { getPublicStickers } from '@/server/actions/public/stickers.actions';
import { getEnrichedSession } from '@/server/auth/auth-utils';
import StickerMapBridge from '@/components/islands/stickers/StickerMapBridge';
import Leaderboard from '@/components/islands/stickers/Leaderboard';

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
            <div className="w-full px-0 py-0 sm:py-12">
                <div className="overflow-hidden border border-[var(--beheer-border)]/80 bg-[var(--bg-card)] shadow-2xl sm:rounded-3xl">
                    {/* We gebruiken de bridge, die de ssr: false logica afhandelt */}
                    <StickerMapBridge
                        initialStickers={stickers}
                        user={(session?.user as unknown as EnrichedUser ?? null)}
                    />
                </div>

                <Leaderboard stickers={stickers} currentUser={(session?.user as unknown as EnrichedUser ?? null)} />
            </div>
        </PublicPageShell>
    );
}