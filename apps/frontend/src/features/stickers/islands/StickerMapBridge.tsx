'use client';

import type { EnrichedUser } from '@/types/auth';
import { z } from 'zod';
import { stickerPublicSchema } from "@salvemundi/validations";
import dynamic from 'next/dynamic';

const StickerMapIsland = dynamic(
    () => import('./StickerMapIsland'),
    {
        ssr: false,
        loading: () => (
            <div className="w-full h-150 bg-purple-950/5 border border-purple-500/10 rounded-2xl flex items-center justify-center animate-pulse">
                <span className="text-(--text-muted) text-sm font-semibold tracking-wide uppercase">Kaart aan het laden...</span>
            </div>
        )
    }
);

type Sticker = z.infer<typeof stickerPublicSchema>;

interface StickerMapBridgeProps {
    initialStickers: Sticker[];
    user: EnrichedUser | null;
    className?: string;
}

export default function StickerMapBridge(props: StickerMapBridgeProps) {
    return <StickerMapIsland {...props} />;
}
