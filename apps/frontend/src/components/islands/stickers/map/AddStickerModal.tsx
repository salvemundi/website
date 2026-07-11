'use client';

import { X, Camera, Loader2, Plus, LocateFixed } from 'lucide-react';
import { useState } from 'react';
import MediaAsset from '@/components/ui/media/MediaAsset';
import { searchLocations, reverseGeocode, type LocationSearchResult } from '@/shared/lib/utils/geolocation';

interface AddStickerModalProps {
    show: boolean;
    onClose: () => void;
    onSubmit: (e: React.SyntheticEvent) => void;
    isPending: boolean;
    formData: {
        location_name: string;
        description: string;
        city: string;
        country: string;
        image: File | null;
    };
    setFormData: React.Dispatch<React.SetStateAction<{
        location_name: string;
        description: string;
        city: string;
        country: string;
        image: File | null;
    }>>;
    handleImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    imagePreview: string | null;
    selectedLocation: { lat: number; lng: number } | null;
    setSelectedLocation: React.Dispatch<React.SetStateAction<{ lat: number; lng: number } | null>>;
}


export default function AddStickerModal({
    show,
    onClose,
    onSubmit,
    isPending,
    formData,
    setFormData,
    handleImageChange,
    imagePreview,
    selectedLocation,
    setSelectedLocation
}: AddStickerModalProps) {
    const [addressQuery, setAddressQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<LocationSearchResult[]>([]);
    const [isLocatingCurrent, setIsLocatingCurrent] = useState(false);
    const [locationError, setLocationError] = useState<string | null>(null);

    if (!show) return null;

    const handleAddressSearch = async () => {
        if (!addressQuery) return;
        setIsSearching(true);
        setLocationError(null);
        const results = await searchLocations(addressQuery);
        setSearchResults(results);
        if (results.length === 0) {
            setLocationError('Geen locaties gevonden voor deze zoekopdracht.');
        }
        setIsSearching(false);
    };

    const handleAddressSearchSync = () => {
        void handleAddressSearch();
    };

    const handleSelectResult = (result: LocationSearchResult) => {
        setSelectedLocation({ lat: result.lat, lng: result.lng });
        setFormData((prev) => ({
            ...prev,
            city: result.city,
            country: result.country,
            location_name: prev.location_name || result.city
        }));
        setAddressQuery(result.displayName);
        setSearchResults([]);
        setLocationError(null);
    };

    const handleUseCurrentLocation = () => {
        if (!(navigator as Partial<Navigator>).geolocation) {
            setLocationError('Je browser ondersteunt geen geolocatie.');
            return;
        }

        setIsLocatingCurrent(true);
        setLocationError(null);

        navigator.geolocation.getCurrentPosition(
            (position) => {
                void (async () => {
                    const { latitude, longitude } = position.coords;
                    const { city, country } = await reverseGeocode(latitude, longitude);

                    setSelectedLocation({ lat: latitude, lng: longitude });
                    setFormData((prev) => ({
                        ...prev,
                        city,
                        country,
                        location_name: prev.location_name || city
                    }));
                    setAddressQuery(city && country ? `${city}, ${country}` : addressQuery);
                    setSearchResults([]);
                    setIsLocatingCurrent(false);
                })();
            },
            (error) => {
                setLocationError(error.code === 1 ? 'Locatie toegang geweigerd.' : 'Kon je locatie niet bepalen.');
                setIsLocatingCurrent(false);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const handleUseCurrentLocationSync = () => {
        handleUseCurrentLocation();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xl">
            <div className="bg-(--bg-card) rounded-3xl w-full max-w-xl shadow-2xl border border-white/10 overflow-hidden flex flex-col max-h-[95vh]">
                <div className="bg-gradient-to-r from-(--theme-purple) to-(--theme-purple-dark) p-4 sm:p-6 text-white flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tighter italic">Nieuwe Sticker <span className="text-white/70">Plakken</span></h2>
                        <p className="text-[10px] uppercase tracking-widest font-black opacity-80 mt-1">{selectedLocation ? 'Locatie geselecteerd op kaart' : 'Selecteer of zoek locatie'}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition-colors">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <form onSubmit={onSubmit} autoComplete="off" data-lpignore="true" data-1p-ignore data-bwignore data-form-type="other" className="p-4 sm:p-8 space-y-6 overflow-y-auto">
                    <div className="space-y-4">
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
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedLocation(null);
                                        setFormData((prev) => ({ ...prev, city: '', country: '' }));
                                        setAddressQuery('');
                                        setSearchResults([]);
                                    }}
                                    className="ml-auto inline-flex items-center gap-2 rounded-xl bg-(--bg-main)/60 px-3 py-2 text-xs font-black uppercase tracking-widest"
                                >
                                    Reset
                                </button>
                            </div>

                            <button
                                type="button"
                                onClick={handleUseCurrentLocationSync}
                                disabled={isLocatingCurrent}
                                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-(--bg-main)/60 border border-(--border-color)/30 px-3 py-2.5 text-xs font-black uppercase tracking-widest text-(--text-main) hover:border-(--theme-purple)/50 transition-colors disabled:opacity-50"
                            >
                                {isLocatingCurrent ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
                                Gebruik mijn huidige locatie
                            </button>

                            <div className="flex gap-2">
                                <input
                                    value={addressQuery}
                                    onChange={(e) => setAddressQuery(e.target.value)}
                                    placeholder="Zoek adres of plaats"
                                    className="flex-1 bg-(--bg-main)/50 border border-(--border-color)/30 rounded-xl px-3 py-2 text-sm outline-none"
                                />
                                <button
                                    type="button"
                                    onClick={handleAddressSearchSync}
                                    disabled={isSearching}
                                    className="inline-flex items-center gap-2 rounded-2xl bg-(--theme-purple)/90 px-3 py-2 text-white font-black uppercase text-xs"
                                >
                                    {isSearching ? 'Zoeken…' : 'Zoek'}
                                </button>
                            </div>

                            {searchResults.length > 0 && (
                                <div className="rounded-xl border border-(--border-color)/30 bg-(--bg-main)/80 overflow-hidden divide-y divide-(--border-color)/20">
                                    {searchResults.map((result, idx) => (
                                        <button
                                            key={`${result.lat}-${result.lng}-${idx}`}
                                            type="button"
                                            onClick={() => handleSelectResult(result)}
                                            className="w-full text-left px-3 py-2 text-xs text-(--text-main) hover:bg-(--theme-purple)/10 transition-colors"
                                        >
                                            {result.displayName}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {locationError && (
                                <p className="text-xs text-red-400 font-bold">{locationError}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-(--text-muted) mb-2 ml-1">Naam van de Locatie</label>
                            <input
                                required
                                type="text"
                                placeholder="Bijv. Eiffeltoren, Fontys R10..."
                                value={formData.location_name}
                                onChange={(e) => setFormData((prev) => ({ ...prev, location_name: e.target.value }))}
                                suppressHydrationWarning
                                className="w-full bg-(--bg-main)/50 border border-(--border-color)/30 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-(--theme-purple)/10 focus:border-(--theme-purple) transition-all outline-none"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-(--text-muted) mb-2 ml-1">Stad</label>
                                <input
                                    readOnly
                                    tabIndex={-1}
                                    type="text"
                                    placeholder="Kies via zoeken of huidige locatie"
                                    value={formData.city}
                                    suppressHydrationWarning
                                    className="w-full bg-(--bg-main)/30 border border-(--border-color)/20 rounded-xl px-4 py-3 text-sm text-(--text-muted) cursor-not-allowed outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-(--text-muted) mb-2 ml-1">Land</label>
                                <input
                                    readOnly
                                    tabIndex={-1}
                                    type="text"
                                    placeholder="Kies via zoeken of huidige locatie"
                                    value={formData.country}
                                    suppressHydrationWarning
                                    className="w-full bg-(--bg-main)/30 border border-(--border-color)/20 rounded-xl px-4 py-3 text-sm text-(--text-muted) cursor-not-allowed outline-none"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-(--text-muted) mb-2 ml-1">Beschrijving</label>
                            <textarea
                                rows={3}
                                placeholder="Wat een mooie plek voor een Salve sticker!"
                                value={formData.description}
                                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                                className="w-full bg-(--bg-main)/50 border border-(--border-color)/30 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-(--theme-purple)/10 focus:border-(--theme-purple) transition-all outline-none resize-none"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-(--text-muted) mb-2 ml-1">Foto Bewijs</label>
                            <div className="relative group/photo">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="hidden"
                                    id="photo-upload"
                                />
                                <label
                                    htmlFor="photo-upload"
                                    className="cursor-pointer flex flex-col items-center justify-center w-full h-40 bg-(--bg-main)/30 border-2 border-dashed border-(--border-color)/50 rounded-2xl hover:border-(--theme-purple)/50 hover:bg-(--theme-purple)/5 transition-all group-hover/photo:shadow-inner overflow-hidden"
                                >
                                    {imagePreview ? (
                                        <MediaAsset asset={imagePreview} className="w-full h-full object-cover" alt="Preview" fill />
                                    ) : (
                                        <>
                                            <Camera className="h-8 w-8 text-(--text-muted) mb-2" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-(--text-muted)">Foto Selecteren</span>
                                        </>
                                    )}
                                </label>
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isPending || !selectedLocation || !formData.city || !formData.country}
                        className="w-full py-4 bg-gradient-to-r from-(--theme-purple) to-orange-500 text-white rounded-2xl shadow-xl shadow-purple-500/20 hover:shadow-2xl hover:shadow-purple-500/30 transition-all font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                    >
                        {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
                        Sticker Registreren
                    </button>
                </form>
            </div>
        </div>
    );
}
