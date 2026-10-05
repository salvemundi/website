'use client';

import { Map as MapIcon, Loader2, Plus } from 'lucide-react';
import { type EnrichedUser } from '@/types/auth';

interface StickerActionPanelProps {
    user: EnrichedUser | null;
    isLocating: boolean;
    onPlaceSticker: () => void;
    compact?: boolean;
}

export default function StickerActionPanel({ user, isLocating, onPlaceSticker, compact = false }: StickerActionPanelProps) {
    if (!user) {
        return (
            <div className={compact ? 'sticker-login-prompt-compact' : 'sticker-login-prompt'}>
                <div className={`rounded-lg bg-wit-paars/20 p-2 ${compact ? 'hidden' : ''}`}>
                    <Plus className="size-5" />
                </div>
                <div className={compact ? 'w-full text-center' : ''}>
                    <p className={`font-black tracking-tight uppercase ${compact ? 'text-2xs leading-tight' : 'text-xs'}`}>
                        Login om sticker te plakken
                    </p>
                    {!compact && (
                        <p className="mt-1 text-2xs opacity-80">Alleen leden kunnen nieuwe locaties toevoegen aan de wereldkaart.</p>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className={`sticker-action-box ${compact ? 'w-full p-2.5' : 'p-4'}`}>
            <button
                onClick={onPlaceSticker}
                disabled={isLocating}
                className={`beheer-button flex w-full items-center justify-center gap-2 rounded-xl font-black tracking-widest text-wit-paars uppercase shadow-lg transition-all hover:shadow-xl disabled:opacity-50 ${compact ? 'px-3 py-2 text-2xs leading-tight' : 'py-3 text-xs'}`}
                type="button">
                {isLocating ? <Loader2 className="size-4 animate-spin" /> : <MapIcon className="size-4 shrink-0" />}
                <span className="text-center whitespace-normal">Plaats sticker</span>
            </button>
            <p className={`mt-2 text-center text-2xs font-bold tracking-tighter text-text-muted uppercase italic ${compact ? 'leading-tight' : ''}`}>
                Plak een sticker op je huidige GPS locatie
            </p>
        </div>
    );
}
