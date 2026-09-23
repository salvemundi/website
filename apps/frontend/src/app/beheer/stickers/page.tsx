import { getStickers } from '@/server/actions/admin/admin-stickers.actions';
import StickerManagementIsland from '@/components/islands/admin/StickerManagementIsland';
import AdminPageShell from '@/components/ui/admin/AdminPageShell';

export const metadata = {
    title: 'Sticker Beheer | SV Salve Mundi',
    description: 'Beheer en modereer stickerlocaties.'
};

export default async function StickersAdminPage() {
    const stickers = await getStickers();

    const publishedCount = stickers.filter(s => s.status === 'published').length;
    const draftCount = stickers.filter(s => s.status === 'draft' || !s.status).length;

    return (
        <AdminPageShell
            title="Sticker Beheer"
            backHref="/beheer"
            actions={
                <div className="flex items-center gap-4 rounded-2xl border border-border-color/50 bg-bg-soft px-4 py-2 shadow-sm">
                    <div className="flex flex-col items-center px-2">
                        <span className="mb-1 text-[10px] leading-none font-semibold text-text-muted">Stickers</span>
                        <span className="text-sm leading-none font-bold text-text-main">{stickers.length}</span>
                    </div>
                    <div className="h-6 w-px bg-border-color/20" />
                    <div className="flex flex-col items-center px-2">
                        <span className="mb-1 text-[10px] leading-none font-semibold text-text-muted">Gepubliceerd</span>
                        <span className="text-sm leading-none font-bold text-emerald-500">{publishedCount}</span>
                    </div>
                    <div className="h-6 w-px bg-border-color/20" />
                    <div className="flex flex-col items-center px-2">
                        <span className="mb-1 text-[10px] leading-none font-semibold text-text-muted">Afwachting</span>
                        <span className={`text-sm leading-none font-bold ${draftCount > 0 ? 'text-amber-500' : 'text-text-main'}`}>{draftCount}</span>
                    </div>
                </div>
            }
        >
            <StickerManagementIsland initialStickers={stickers} />
        </AdminPageShell>
    );
}

