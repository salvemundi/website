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
            <div className={`pointer-events-auto rounded-2xl border border-white/20 bg-orange-500/90 text-white shadow-2xl backdrop-blur-md ${compact ? 'w-full px-4 py-2.5' : 'flex items-start gap-3 p-4'}`}>
                <div className={`rounded-lg bg-white/20 p-2 ${compact ? 'hidden' : ''}`}>
                    <Plus className="size-5" />
                </div>
                <div className={compact ? 'w-full text-center' : ''}>
                    <p className={`font-black tracking-tight uppercase ${compact ? 'text-[10px] leading-tight' : 'text-xs'}`}>Login om sticker te plakken</p>
                    {!compact && (
                        <p className="mt-1 text-[10px] opacity-80">Alleen leden kunnen nieuwe locaties toevoegen aan de wereldkaart.</p>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className={`pointer-events-auto rounded-2xl border border-white/10 bg-(--bg-card)/90 shadow-2xl backdrop-blur-md ${compact ? 'w-full p-2.5' : 'p-4'}`}>
            <button
                onClick={onPlaceSticker}
                disabled={isLocating}
                className={`form-button flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-(--theme-purple) to-orange-500 font-black tracking-widest text-white uppercase shadow-lg transition-all hover:shadow-xl disabled:opacity-50 ${compact ? 'px-3 py-2 text-[10px] leading-tight' : 'py-3 text-xs'}`}
            >
                {isLocating ? <Loader2 className="size-4 animate-spin" /> : <MapIcon className="size-4 shrink-0" />}
                <span className="text-center whitespace-normal">Plaats sticker</span>
            </button>
            <p className={`mt-2 text-center text-[9px] font-bold tracking-tighter text-(--text-muted) uppercase italic ${compact ? 'leading-tight' : ''}`}>
                Plak een sticker op je huidige GPS locatie
            </p>
        </div>
    );
}
