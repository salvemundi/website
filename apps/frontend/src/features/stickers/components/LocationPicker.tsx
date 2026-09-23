import { LocateFixed, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/buttons/Button';
import { type LocationSearchResult } from '@/shared/lib/utils/geolocation';

interface LocationPickerProps {
    selectedLocation: { lat: number; lng: number } | null;
    formData: { city: string; country: string; location_name: string };
    onReset: () => void;
    onUseCurrentLocation: () => void;
    isLocatingCurrent: boolean;
    addressQuery: string;
    onAddressQueryChange: (query: string) => void;
    onAddressSearch: () => void;
    isSearching: boolean;
    searchResults: LocationSearchResult[];
    onSelectResult: (result: LocationSearchResult) => void;
    locationError: string | null;
}

export const LocationPicker = ({
    selectedLocation,
    formData,
    onReset,
    onUseCurrentLocation,
    isLocatingCurrent,
    addressQuery,
    onAddressQueryChange,
    onAddressSearch,
    isSearching,
    searchResults,
    onSelectResult,
    locationError
}: LocationPickerProps) => {
    return (
        <div className="space-y-2">
            <p className="text-[10px] font-black tracking-widest uppercase opacity-80">Locatie</p>
            <div className="flex items-center gap-3">
                <div className="text-sm text-(--text-main)">
                    {selectedLocation ? (
                        <span>
                            {formData.city && formData.country ? `${formData.city}, ${formData.country}` : 'Locatie geselecteerd'}
                            {' '}({selectedLocation.lat.toFixed(5)}, {selectedLocation.lng.toFixed(5)})
                        </span>
                    ) : (
                        <span>Geen locatie geselecteerd</span>
                    )}
                </div>
                <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={onReset}
                    className="ml-auto inline-flex items-center gap-2 text-xs font-black tracking-widest uppercase"
                >
                    Reset
                </Button>
            </div>

            <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={onUseCurrentLocation}
                disabled={isLocatingCurrent}
                className="inline-flex w-full items-center justify-center gap-2 text-xs font-black tracking-widest text-(--text-main) uppercase"
            >
                {isLocatingCurrent ? <Loader2 className="size-4 animate-spin" /> : <LocateFixed className="size-4" />}
                Gebruik mijn huidige locatie
            </Button>

            <div className="relative">
                <div className="flex gap-2">
                    <input
                        value={addressQuery}
                        onChange={(e) => onAddressQueryChange(e.target.value)}
                        placeholder="Zoek adres of plaats"
                        className="form-input flex-1 rounded-xl border border-(--border-color)/30 bg-(--bg-main)/50 px-3 py-2 text-sm outline-none"
                    />
                    <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={onAddressSearch}
                        disabled={isSearching}
                        className="inline-flex items-center gap-2 text-xs uppercase sm:hidden"
                    >
                        {isSearching ? 'Zoeken…' : 'Zoek'}
                    </Button>
                </div>

                {searchResults.length > 0 && (
                    <div className="absolute inset-x-0 top-full z-20 mt-1 divide-y divide-(--border-color)/20 overflow-hidden rounded-xl border border-(--border-color)/30 bg-(--bg-card) shadow-2xl">
                        {searchResults.map((result, idx) => (
                            <Button
                                key={`${result.lat}-${result.lng}-${idx}`}
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => onSelectResult(result)}
                                className="w-full justify-start px-3 py-2 text-left text-xs text-(--text-main) transition-colors hover:bg-(--theme-purple)/10"
                            >
                                {result.displayName}
                            </Button>
                        ))}
                    </div>
                )}
            </div>

            {locationError && (
                <p className="text-xs font-bold text-red-400">{locationError}</p>
            )}
        </div>
    );
};
