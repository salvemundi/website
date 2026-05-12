'use client';

import { Map as MapIcon, Loader2, Plus } from 'lucide-react';
import { type EnrichedUser } from '@/types/auth';

interface StickerActionPanelProps {
    user: EnrichedUser | null;
    isLocating: boolean;
    onPlaceSticker: () => void;
}

export default function StickerActionPanel({ user, isLocating, onPlaceSticker }: StickerActionPanelProps) {
    if (!user) {
        return (
            <div className="bg-orange-500/90 backdrop-blur-md text-white rounded-2xl p-4 shadow-2xl pointer-events-auto flex items-start gap-3 border border-white/20">
                <div className="p-2 bg-white/20 rounded-lg">
                    <Plus className="h-5 w-5" />
                </div>
                <div>
                    <p className="text-xs font-black uppercase tracking-tight">Login om ook te plakken!</p>
                    <p className="text-[10px] opacity-80 mt-1">Alleen leden kunnen nieuwe locaties toevoegen aan de wereldkaart.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-[var(--bg-card)]/90 backdrop-blur-md rounded-2xl p-4 shadow-2xl pointer-events-auto border border-white/10">
            <button
                onClick={onPlaceSticker}
                disabled={isLocating}
                className="w-full py-3 bg-gradient-to-r from-[var(--theme-purple)] to-orange-500 text-white rounded-xl shadow-lg hover:shadow-xl transition-all font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 disabled:opacity-50"
            >
                {isLocating ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapIcon className="h-4 w-4" />}
                Ik ben hier! 📍
            </button>
            <p className="text-[9px] text-[var(--text-muted)] mt-2 text-center uppercase font-bold tracking-tighter italic">
                Plak een sticker op je huidige GPS locatie
            </p>
        </div>
    );
}
