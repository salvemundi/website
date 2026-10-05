import { getStickers } from '@/server/actions/beheer/stickers/beheer-stickers.actions';
import StickerManagementIsland from '@/components/islands/beheer/StickerManagementIsland';
import BeheerPageShell from '@/components/ui/beheer/BeheerPageShell';

export const metadata = {
    title: 'Sticker Beheer | SV Salve Mundi',
    description: 'Beheer en modereer stickerlocaties.'
};

export default async function StickersAdminPage() {
    const stickers = await getStickers();

    const publishedCount = stickers.filter(s => s.status === 'published').length;
    const draftCount = stickers.filter(s => s.status === 'draft' || !s.status).length;

    return (
        <BeheerPageShell
            title="Sticker Beheer"
            backHref="/beheer"
            actions={
                <div className="beheer-stat-strip">
                    <div className="flex flex-col items-center px-2">
                        <span className="stat-label-muted">Stickers</span>
                        <span className="text-sm leading-none font-bold text-text-main">{stickers.length}</span>
                    </div>
                    <div className="v-divider-sm" />
                    <div className="flex flex-col items-center px-2">
                        <span className="stat-label-muted">Gepubliceerd</span>
                        <span className="text-sm leading-none font-bold text-beheer-active">{publishedCount}</span>
                    </div>
                    <div className="v-divider-sm" />
                    <div className="flex flex-col items-center px-2">
                        <span className="stat-label-muted">Afwachting</span>
                        <span className={`text-sm leading-none font-bold ${draftCount > 0 ? 'text-geel' : 'text-text-main'}`}>{draftCount}</span>
                    </div>
                </div>
            }
        >
            <StickerManagementIsland initialStickers={stickers} />
        </BeheerPageShell>
    );
}

