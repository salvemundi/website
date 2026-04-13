import { Suspense } from 'react';
import { getStickers } from '@/server/actions/admin-stickers.actions';
import StickerManagementIsland from '@/components/islands/admin/StickerManagementIsland';
import { checkAdminAccess } from '@/server/actions/admin.actions';
import AdminPageShell from '@/components/ui/admin/AdminPageShell';

export const metadata = {
    title: 'Sticker Beheer | SV Salve Mundi',
    description: 'Beheer en modereer stickerlocaties.',
};

/**
 * StickersAdminPage: Ultra-PPR Modernization.
 * Wrapped in AdminPageShell for instant header rendering.
 * Uses Zero-Drift masking via StickerManagementIsland.
 */
export default async function StickersAdminPage() {
    const { user } = await checkAdminAccess();

    return (
        <AdminPageShell
            title="Sticker Beheer"
            subtitle="Beheer en modereer stickerlocaties wereldwijd."
            backHref="/beheer"
        >
            <Suspense fallback={<StickerManagementIsland isLoading={true} initialStickers={[]} />}>
                <StickersDataLoader />
            </Suspense>
        </AdminPageShell>
    );
}

async function StickersDataLoader() {
    const stickers = await getStickers().catch(() => []);
    return <StickerManagementIsland initialStickers={stickers} />;
}
