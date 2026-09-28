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
            <div className="flex h-150 w-full animate-pulse items-center justify-center rounded-2xl border border-purple-500/10 bg-purple-950/5">
                <span className="text-sm font-semibold tracking-wide text-(--text-muted) uppercase">Kaart aan het laden...</span>
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
