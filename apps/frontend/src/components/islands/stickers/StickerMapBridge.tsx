'use client';

import type { EnrichedUser } from '@/types/auth';
import { z } from 'zod';
import { stickerPublicSchema } from "@salvemundi/validations";
import StickerMapIsland from './StickerMapIsland';

type Sticker = z.infer<typeof stickerPublicSchema>;

interface StickerMapBridgeProps {
    initialStickers: Sticker[];
    user: EnrichedUser | null;
    className?: string;
}

export default function StickerMapBridge(props: StickerMapBridgeProps) {
    return <StickerMapIsland {...props} />;
}
