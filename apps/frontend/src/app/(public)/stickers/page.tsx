import React from 'react';
import { getPublicStickers } from '@/server/actions/public/stickers.actions';
import { getEnrichedSession } from '@/server/auth/auth-utils';
import StickerMapIsland from '@/components/islands/stickers/StickerMapIsland';
import PublicPageShell from '@/components/ui/layout/PublicPageShell';
import { type EnrichedUser } from '@/types/auth';

export const metadata = {
    title: 'Sticker Kaart | Salve Mundi' };

import { connection } from 'next/server';

export default async function StickersPage() {
    return (
        <PublicPageShell
            title="STICKER KAART"
            description="Bekijk waar Salve Mundi stikkers zijn geplakt over de hele wereld. Heb je er zelf een geplakt? Log in en voeg hem toe!"
            backgroundImage="/img/backgrounds/stickers-banner.jpg" 
        >
            <StickersContent />
        </PublicPageShell>
    );
}

async function StickersContent() {
    await connection();
    // NUCLEAR SSR: Fetch all data before flushing any part of the page content
    const stickersPromise = getPublicStickers();
    const sessionPromise = getEnrichedSession();
    const [stickers, session] = await Promise.all([
        stickersPromise,
        sessionPromise.catch(() => null)
    ]);

    return (
        <div className="container mx-auto px-4 py-12 max-w-7xl">
            <div className="rounded-3xl border border-[var(--beheer-border)] overflow-hidden shadow-2xl">
                <StickerMapIsland initialStickers={stickers} user={(session?.user as unknown as EnrichedUser) || null} />
            </div>
        </div>
    );
}

