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
        <div className="bg-(--bg-card)/90 backdrop-blur-md rounded-2xl p-4 shadow-2xl pointer-events-auto border border-white/10">
            <div className="flex items-center gap-2 mb-3">
                <Search className="h-4 w-4 text-(--theme-purple)" />
                <h3 className="text-xs font-black uppercase tracking-widest text-(--text-main)">Filteren</h3>
            </div>
            <div className="space-y-3">
                <input
                    type="text"
                    placeholder="Land..."
                    value={filterCountry}
                    onChange={(e) => setFilterCountry(e.target.value)}
                    suppressHydrationWarning
                    className="form-input w-full bg-(--bg-main)/50 border border-(--border-color)/30 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-(--theme-purple)/50 transition-all outline-none"
                />
                <input
                    type="text"
                    placeholder="Stad..."
                    value={filterCity}
                    onChange={(e) => setFilterCity(e.target.value)}
                    suppressHydrationWarning
                    className="form-input w-full bg-(--bg-main)/50 border border-(--border-color)/30 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-(--theme-purple)/50 transition-all outline-none"
                />
            </div>
        </div>
    );
}
