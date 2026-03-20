import { Suspense } from 'react';
import { Loader2, MapPin } from 'lucide-react';
import { getPublicStickers } from '@/server/actions/stickers.actions';
import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';
import StickerMapIsland from '@/components/islands/stickers/StickerMapIsland';

export const metadata = {
    title: 'Sticker Kaart | Salve Mundi',
    description: 'Bekijk waar onze stickers overal ter wereld geplakt zijn en voeg je eigen locatie toe!',
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
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--theme-purple)]/10 text-[var(--theme-purple)] border border-[var(--theme-purple)]/20 animate-in fade-in slide-in-from-left-4 duration-500">
                                <MapPin className="h-4 w-4" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Wereldwijde Dekking</span>
                            </div>
                            <h1 className="text-5xl md:text-7xl font-black text-[var(--text-main)] tracking-widest uppercase italic leading-none animate-in fade-in slide-in-from-bottom-4 duration-700">
                                Sticker<span className="text-[var(--theme-purple)]">Kaart</span>
                            </h1>
                            <p className="text-[var(--text-subtle)] text-lg md:text-xl max-w-2xl font-medium leading-relaxed animate-in fade-in slide-in-from-bottom-6 duration-1000">
                                Van Eindhoven tot aan de andere kant van de wereld; onze stickers zijn overal. 
                                <span className="text-[var(--text-main)] font-black"> Waar heb jij hem geplakt?</span>
                            </p>
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
                <Suspense fallback={
                    <div className="flex flex-col items-center justify-center py-40 bg-[var(--bg-card)] rounded-[var(--radius-3xl)] border border-[var(--border-color)]/30 shadow-2xl">
                        <Loader2 className="h-10 w-10 animate-spin text-[var(--theme-purple)] mb-4" />
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)] animate-pulse">Kaartgegevens initialiseren...</p>
                    </div>
                }>
                    <StickerMapIsland initialStickers={stickers} user={session?.user || null} />
                </Suspense>
            </div>
        </main>
    );
}
