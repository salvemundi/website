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

    const publishedCount = stickers.filter(s => s.status === 'published').length;
    const draftCount = stickers.filter(s => s.status === 'draft' || !s.status).length;

    return (
        <AdminPageShell
            title="Sticker Beheer"
            subtitle="Beheer en modereer stickerlocaties wereldwijd."
            backHref="/beheer"
            actions={
                <div className="flex items-center gap-4 bg-[var(--beheer-card-soft)] px-4 py-2 rounded-2xl border border-[var(--beheer-border)]/50 shadow-sm">
                    <div className="flex flex-col items-center px-2">
                        <span className="text-[10px] font-semibold text-[var(--beheer-text-muted)] leading-none mb-1">Stickers</span>
                        <span className="text-sm font-bold text-[var(--beheer-text)] leading-none">{stickers.length}</span>
                    </div>
                    <div className="w-px h-6 bg-[var(--beheer-border)]/20" />
                    <div className="flex flex-col items-center px-2">
                        <span className="text-[10px] font-semibold text-[var(--beheer-text-muted)] leading-none mb-1">Gepubliceerd</span>
                        <span className="text-sm font-bold text-emerald-500 leading-none">{publishedCount}</span>
                    </div>
                    <div className="w-px h-6 bg-[var(--beheer-border)]/20" />
                    <div className="flex flex-col items-center px-2">
                        <span className="text-[10px] font-semibold text-[var(--beheer-text-muted)] leading-none mb-1">Afwachting</span>
                        <span className={`text-sm font-bold leading-none ${draftCount > 0 ? 'text-amber-500' : 'text-[var(--beheer-text)]'}`}>{draftCount}</span>
                    </div>
                </div>
            }
        >
            <StickerManagementIsland initialStickers={stickers} />
        </AdminPageShell>
    );
}

