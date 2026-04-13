import React, { Suspense } from 'react';
import { getPublicStickers } from '@/server/actions/stickers.actions';
import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';
import StickerMapIsland from '@/components/islands/stickers/StickerMapIsland';
import PublicPageShell from '@/components/ui/layout/PublicPageShell';

export const metadata = {
    title: 'Sticker Kaart | Salve Mundi',
};

async function StickersDataLoader() {
    const stickersPromise = getPublicStickers();
    const sessionPromise = auth.api.getSession({
        headers: await headers(),
    });

    const [stickers, session] = await Promise.all([
        stickersPromise.catch(() => []),
        sessionPromise.catch(() => null)
    ]);

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex justify-between items-center mb-8 bg-[var(--bg-card)] border border-[var(--beheer-border)] p-6 rounded-3xl shadow-sm">
                <div className="space-y-1">
                    <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Totaal Geplakt</p>
                    <p className="text-3xl font-black text-[var(--theme-purple)] tracking-tighter">{stickers.length}+</p>
                </div>
                <div className="p-3 bg-[var(--theme-purple)]/10 rounded-2xl">
                    <span className="text-2xl">📍</span>
                </div>
            </div>
            
            <div className="rounded-3xl border border-[var(--beheer-border)] overflow-hidden shadow-2xl">
                <StickerMapIsland initialStickers={stickers} user={session?.user || null} />
            </div>
        </div>
    );
}

export default async function StickersPage() {
    return (
        <PublicPageShell
            title="STICKER KAART"
            description="Bekijk waar Salve Mundi stikkers zijn geplakt over de hele wereld. Heb je er zelf een geplakt? Log in en voeg hem toe!"
            backgroundImage="/img/backgrounds/stickers-banner.jpg" 
            fallback={
                <div className="space-y-8 animate-pulse">
                    <div className="h-24 w-full bg-[var(--bg-card)] rounded-3xl skeleton-active" />
                    <div className="h-[600px] w-full bg-[var(--bg-card)] rounded-3xl skeleton-active shadow-xl" />
                </div>
            }
        >
            <div className="container mx-auto px-4 py-12 max-w-7xl">
                <StickersDataLoader />
            </div>
        </PublicPageShell>
    );
}

