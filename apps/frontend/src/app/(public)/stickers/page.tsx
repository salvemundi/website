export const dynamic = 'force-dynamic';
import { Suspense } from 'react';
import { Loader2, MapPin } from 'lucide-react';
import { getPublicStickers } from '@/server/actions/stickers.actions';
import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';
import StickerMapIsland from '@/components/islands/stickers/StickerMapIsland';
import { Skeleton } from '@/components/ui/Skeleton';

export const metadata = {
    title: 'Sticker Kaart | Salve Mundi',
};

export default async function StickersPage() {
    const stickersPromise = getPublicStickers();
    const sessionPromise = auth.api.getSession({
        headers: await headers(),
    });

    const [stickers, session] = await Promise.all([
        stickersPromise.catch(() => []),
        sessionPromise.catch(() => null)
    ]);

    return (
        <main className="min-h-screen bg-[var(--bg-main)]">
            {/* Hero Section */}
            <div className="relative overflow-hidden bg-[var(--bg-card)] border-b border-[var(--border-color)]/30">
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--theme-purple)]/5 to-orange-500/5 -z-10" />
                <div className="container mx-auto px-4 py-20 max-w-7xl relative">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                        <div className="space-y-4">
                            <h1 className="text-5xl md:text-7xl font-black text-[var(--text-main)] tracking-widest uppercase italic leading-none animate-in fade-in slide-in-from-bottom-4 duration-700">
                                Sticker<span className="text-[var(--theme-purple)]">Kaart</span>
                            </h1>
                        </div>
                        
                        <div className="flex flex-col items-center md:items-end gap-2 animate-in fade-in zoom-in-95 duration-1000">
                            <div className="text-3xl font-black text-[var(--theme-purple)] tracking-tighter">
                                {stickers.length}+
                            </div>
                            <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                                Locaties Geregistreerd
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Application Area */}
            <div className="container mx-auto px-4 py-12 max-w-7xl">
                <Suspense fallback={<StickerMapIsland isLoading initialStickers={[]} user={null} />}>
                    <StickerMapIsland initialStickers={stickers} user={session?.user || null} />
                </Suspense>
            </div>
        </main>
    );
}

