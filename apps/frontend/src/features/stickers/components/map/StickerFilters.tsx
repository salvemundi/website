'use client';

import { Search } from 'lucide-react';

interface StickerFiltersProps {
    filterCountry: string;
    setFilterCountry: (val: string) => void;
    filterCity: string;
    setFilterCity: (val: string) => void;
}

export default function StickerFilters({
    filterCountry,
    setFilterCountry,
    filterCity,
    setFilterCity
}: StickerFiltersProps) {
    return (
        <div className="pointer-events-auto rounded-2xl border border-white/10 bg-(--bg-card)/90 p-4 shadow-2xl backdrop-blur-md">
            <div className="mb-3 flex items-center gap-2">
                <Search className="size-4 text-(--theme-purple)" />
                <h3 className="text-xs font-black tracking-widest text-(--text-main) uppercase">Filteren</h3>
            </div>
            <div className="space-y-3">
                <input
                    type="text"
                    placeholder="Land..."
                    value={filterCountry}
                    onChange={(e) => setFilterCountry(e.target.value)}
                    suppressHydrationWarning
                    className="form-input w-full rounded-lg border border-(--border-color)/30 bg-(--bg-main)/50 px-3 py-2 text-xs transition-all outline-none focus:ring-2 focus:ring-(--theme-purple)/50"
                />
                <input
                    type="text"
                    placeholder="Stad..."
                    value={filterCity}
                    onChange={(e) => setFilterCity(e.target.value)}
                    suppressHydrationWarning
                    className="form-input w-full rounded-lg border border-(--border-color)/30 bg-(--bg-main)/50 px-3 py-2 text-xs transition-all outline-none focus:ring-2 focus:ring-(--theme-purple)/50"
                />
            </div>
        </div>
    );
}
