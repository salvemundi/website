import PublicPageShell from '@/components/ui/layout/PublicPageShell';
import type { EnrichedUser } from '@/types/auth';
import { getPublicStickers } from '@/server/actions/public/stickers.actions';
import { getEnrichedSession } from '@/server/auth/auth-utils';
import StickerMapBridge from '@/components/islands/stickers/StickerMapBridge';
import Leaderboard from '@/components/islands/stickers/Leaderboard';

export const dynamic = 'force-dynamic';

export const metadata = {
    title: 'Stickerkaart | Salve Mundi',
    description: 'Bekijk waar onze stickers over de hele wereld zijn geplakt!'
};

export default async function StickersPage() {
    const [stickers, session] = await Promise.all([
        getPublicStickers(),
        getEnrichedSession()
    ]);

    const currentUser = session?.user ? (session.user as unknown as EnrichedUser) : null;
    const isActiveMember = currentUser?.membership_status === 'active';
    const activeUser = isActiveMember ? currentUser : null;
    const isLoggedIn = !!activeUser;

    return (
        <PublicPageShell
            title="Stickerkaart"
            description="Onze leden reizen de hele wereld over. Bekijk hier waar de Salve Mundi stickers allemaal te vinden zijn!"
        >
            <div className="w-full px-4 md:px-8 py-4 md:py-8 h-[calc(100vh-var(--header-total-height))] min-h-[600px]">
                <div className="flex flex-col lg:flex-row gap-8 items-stretch h-full">
                    <div className={`flex-1 min-w-0 order-1 lg:h-full ${isLoggedIn ? 'h-[50vh]' : 'h-[80vh]'}`}>
                        <div className="h-full overflow-hidden squircle-lg">
                            <StickerMapBridge
                                initialStickers={stickers}
                                user={activeUser}
                                className="shadow-2xl"
                            />
                        </div>
                    </div>

                    {isLoggedIn && (
                        <div className="w-full lg:w-[400px] shrink-0 order-2 h-[40vh] lg:h-full">
                            <Leaderboard
                                stickers={stickers}
                                currentUser={activeUser}
                            />
                        </div>
                    )}
                </div>
            </div>
        </PublicPageShell>
    );
}
