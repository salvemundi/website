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
            <p className="text-[10px] uppercase tracking-widest font-black opacity-80">Locatie</p>
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
                    className="ml-auto inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest"
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
                className="w-full inline-flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest text-(--text-main)"
            >
                {isLocatingCurrent ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
                Gebruik mijn huidige locatie
            </Button>

            <div className="relative">
                <div className="flex gap-2">
                    <input
                        value={addressQuery}
                        onChange={(e) => onAddressQueryChange(e.target.value)}
                        placeholder="Zoek adres of plaats"
                        className="form-input flex-1 bg-(--bg-main)/50 border border-(--border-color)/30 rounded-xl px-3 py-2 text-sm outline-none"
                    />
                    <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={onAddressSearch}
                        disabled={isSearching}
                        className="sm:hidden inline-flex items-center gap-2 uppercase text-xs"
                    >
                        {isSearching ? 'Zoeken…' : 'Zoek'}
                    </Button>
                </div>

                {searchResults.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 z-20 rounded-xl border border-(--border-color)/30 bg-(--bg-card) shadow-2xl overflow-hidden divide-y divide-(--border-color)/20">
                        {searchResults.map((result, idx) => (
                            <Button
                                key={`${result.lat}-${result.lng}-${idx}`}
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => onSelectResult(result)}
                                className="w-full justify-start text-left px-3 py-2 text-xs text-(--text-main) hover:bg-(--theme-purple)/10 transition-colors"
                            >
                                {result.displayName}
                            </Button>
                        ))}
                    </div>
                )}
            </div>

            {locationError && (
                <p className="text-xs text-red-400 font-bold">{locationError}</p>
            )}
        </div>
    );
};
