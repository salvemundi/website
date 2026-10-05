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
            <div className="map-loader-box">
                <span className="map-loader-text">Kaart aan het laden...</span>
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
