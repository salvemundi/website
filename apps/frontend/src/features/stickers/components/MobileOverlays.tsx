import { X } from 'lucide-react';
import StickerFilters from './map/StickerFilters';
import StickerStats from './map/StickerStats';
import { type StickerPublic } from '@salvemundi/validations';

interface MobileOverlaysProps {
    showMobileFilters: boolean;
    showMobileStats: boolean;
    closeMobileOverlays: () => void;
    filterCountry: string;
    setFilterCountry: (country: string) => void;
    filterCity: string;
    setFilterCity: (city: string) => void;
    stickers: StickerPublic[];
}

export const MobileOverlays = ({
    showMobileFilters,
    showMobileStats,
    closeMobileOverlays,
    filterCountry,
    setFilterCountry,
    filterCity,
    setFilterCity,
    stickers
}: MobileOverlaysProps) => {
    if (!showMobileFilters && !showMobileStats) return null;

    return (
        <div className="fixed inset-0 z-210 md:hidden">
            <button
                type="button"
                className="form-button absolute inset-0 bg-black/45 backdrop-blur-[2px]"
                onClick={closeMobileOverlays}
                aria-label="Sluit overlay"
            />
            <div className="absolute inset-x-0 bottom-0 max-h-[78dvh] overflow-y-auto rounded-t-4xl border-t border-white/10 bg-bg-main shadow-[0_-20px_60px_rgba(0,0,0,0.35)]">
                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border-color/10 bg-bg-main/95 px-4 py-4 backdrop-blur-md">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-text-muted">
                            Salve Mundi
                        </p>
                        <h2 className="text-base font-black uppercase tracking-widest text-text-main">
                            {showMobileFilters ? 'Filters' : 'Statistieken'}
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={closeMobileOverlays}
                        className="form-button inline-flex h-10 w-10 items-center justify-center rounded-full bg-bg-card text-text-main shadow-sm"
                        aria-label="Sluit paneel"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="p-4">
                    {showMobileFilters ? (
                        <StickerFilters
                            filterCountry={filterCountry}
                            setFilterCountry={setFilterCountry}
                            filterCity={filterCity}
                            setFilterCity={setFilterCity}
                        />
                    ) : (
                        <StickerStats stickers={stickers} />
                    )}
                </div>
            </div>
        </div>
    );
};
