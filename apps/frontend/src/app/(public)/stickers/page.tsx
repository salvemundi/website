import PublicPageShell from '@/components/ui/layout/PublicPageShell';
import type { EnrichedUser } from '@/types/auth';
import { getPublicStickers } from '@/server/actions/public/stickers.actions';
import { getEnrichedSession } from '@/server/auth/auth-utils';
import StickerMapBridge from '@/features/stickers/islands/StickerMapBridge';
import Leaderboard from '@/features/stickers/components/Leaderboard';

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
            <div className="h-[calc(100vh-var(--header-total-height))] min-h-150 w-full p-4 md:p-8">
                <div className="flex h-full flex-col items-stretch gap-8 lg:flex-row">
                    <div className={`order-1 min-w-0 flex-1 lg:h-full ${isLoggedIn ? 'h-[42vh]' : 'h-[80vh]'}`}>
                        <div className="squircle-lg h-full overflow-hidden">
                            <StickerMapBridge
                                initialStickers={stickers}
                                user={activeUser}
                                className="shadow-2xl"
                            />
                        </div>
                    </div>

                    {isLoggedIn && (
                        <div className="order-2 h-[48vh] w-full shrink-0 lg:h-full lg:w-100">
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
