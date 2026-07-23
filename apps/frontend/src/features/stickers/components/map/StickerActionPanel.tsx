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
            <div className={`bg-orange-500/90 backdrop-blur-md text-white rounded-2xl shadow-2xl pointer-events-auto border border-white/20 ${compact ? 'w-full px-4 py-2.5' : 'p-4 flex items-start gap-3'}`}>
                <div className={`p-2 bg-white/20 rounded-lg ${compact ? 'hidden' : ''}`}>
                    <Plus className="h-5 w-5" />
                </div>
                <div className={compact ? 'text-center w-full' : ''}>
                    <p className={`font-black uppercase tracking-tight ${compact ? 'text-[10px] leading-tight' : 'text-xs'}`}>Login om sticker te plakken</p>
                    {!compact && (
                        <p className="text-[10px] opacity-80 mt-1">Alleen leden kunnen nieuwe locaties toevoegen aan de wereldkaart.</p>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className={`bg-(--bg-card)/90 backdrop-blur-md rounded-2xl shadow-2xl pointer-events-auto border border-white/10 ${compact ? 'w-full p-2.5' : 'p-4'}`}>
            <button
                onClick={onPlaceSticker}
                disabled={isLocating}
                className={`form-button w-full bg-linear-to-r from-(--theme-purple) to-orange-500 text-white rounded-xl shadow-lg hover:shadow-xl transition-all font-black uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50 ${compact ? 'py-2 text-[10px] leading-tight px-3' : 'py-3 text-xs'}`}
            >
                {isLocating ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapIcon className="h-4 w-4 shrink-0" />}
                <span className="whitespace-normal text-center">Plaats sticker</span>
            </button>
            <p className={`text-[9px] text-(--text-muted) mt-2 text-center uppercase font-bold tracking-tighter italic ${compact ? 'leading-tight' : ''}`}>
                Plak een sticker op je huidige GPS locatie
            </p>
        </div>
    );
}
