'use client';

import { Map as MapIcon, Globe, Award, TrendingUp } from 'lucide-react';
import { type StickerPublic } from '@salvemundi/validations';
import StatCard from './StatCard';

interface StickerStatsProps {
    stickers: StickerPublic[];
}

export default function StickerStats({ stickers }: StickerStatsProps) {
    const totalStickers = stickers.length;
    const countriesCount = new Set(stickers.map((s) => s.country?.toLowerCase()).filter(Boolean)).size;
    const citiesCount = new Set(stickers.map((s) => s.city?.toLowerCase()).filter(Boolean)).size;

    const topCountry = (() => {
        const counts: Record<string, number> = {};
        stickers.forEach(s => {
            if (s.country) counts[s.country] = (counts[s.country] || 0) + 1;
        });
        return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || '..';
    })();

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Totaal" value={totalStickers} icon={MapIcon} color="text-purple-500" />
            <StatCard label="Landen" value={countriesCount} icon={Globe} color="text-blue-500" />
            <StatCard label="Steden" value={citiesCount} icon={Award} color="text-green-500" />
            <StatCard
                label="Top Land"
                value={topCountry}
                icon={TrendingUp}
                color="text-orange-500"
            />
        </div>
    );
}
