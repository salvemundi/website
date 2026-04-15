import { getStickers } from '@/server/actions/admin-stickers.actions';
import StickerManagementIsland from '@/components/islands/admin/StickerManagementIsland';
import AdminToolbar from '@/components/ui/admin/AdminToolbar';
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

    // NUCLEAR SSR: Fetch stickers at the top level
    const stickers = await getStickers().catch(() => []);

    return (
        <AdminPageShell
            title="Sticker Beheer"
            subtitle="Beheer en modereer stickerlocaties wereldwijd."
            backHref="/beheer"
        >
            <StickerManagementIsland initialStickers={stickers} />
        </AdminPageShell>
    );
}

