'use client';

import nextDynamic from 'next/dynamic';
import type { EnrichedUser } from '@/types/auth';
import { z } from 'zod';
import { stickerPublicSchema } from "@salvemundi/validations";

type Sticker = z.infer<typeof stickerPublicSchema>;

interface StickerMapBridgeProps {
    initialStickers: Sticker[];
    user: EnrichedUser | null;
    className?: string;
}

// Hier mag ssr: false wel, omdat dit een Client Component is
const StickerMapIsland = nextDynamic(
    () => import('./StickerMapIsland'),
    {
        ssr: false,
        loading: () => <div className="h-[600px] w-full bg-slate-100 dark:bg-white/5 rounded-3xl" />
    }
);

export default function StickerMapBridge(props: StickerMapBridgeProps) {
    return <StickerMapIsland {...props} />;
}
