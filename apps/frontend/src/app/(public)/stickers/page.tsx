import { Box, Flex } from '@mantine/core';
import PublicPageShell from '@/components/ui/layout/PublicPageShell';
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

    const currentUser = session?.user ?? null;
    const isActiveMember = currentUser?.membership_status === 'active';
    const activeUser = isActiveMember ? currentUser : null;
    const isLoggedIn = !!activeUser;

    return (
        <PublicPageShell
            title="Stickerkaart"
            description="Onze leden reizen de hele wereld over. Bekijk hier waar de Salve Mundi stickers allemaal te vinden zijn!"
        >
            <Box
                h={{ base: 'auto', lg: 'calc(100dvh - var(--header-total-height))' }}
                mih={600}
                w="100%"
                p={{ base: 'md', md: 'xl' }}
            >
                <Flex h="100%" direction={{ base: 'column', lg: 'row' }} align="stretch" gap="xl">
                    <Box
                        flex={1}
                        miw={0}
                        h={{ base: isLoggedIn ? '56vh' : '78vh', lg: '100%' }}
                        style={{ order: 1 }}
                    >
                        <StickerMapBridge
                            initialStickers={stickers}
                            user={activeUser}
                        />
                    </Box>

                    {isLoggedIn && (
                        <Box
                            w={{ base: '100%', lg: 380 }}
                            h={{ base: '48vh', lg: '100%' }}
                            style={{ order: 2, flexShrink: 0 }}
                        >
                            <Leaderboard
                                stickers={stickers}
                                currentUser={activeUser}
                            />
                        </Box>
                    )}
                </Flex>
            </Box>
        </PublicPageShell>
    );
}
