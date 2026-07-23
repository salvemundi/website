'use client';

import { X, Loader2, Plus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { searchLocations, reverseGeocode, type LocationSearchResult } from '@/shared/lib/utils/geolocation';
import { IconButton } from '@/components/ui/buttons/IconButton';
import { Button } from '@/components/ui/buttons/Button';
import { LocationPicker } from '../LocationPicker';
import { PhotoUploader } from '../PhotoUploader';

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
    onRemoveImage?: () => void;
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
    onRemoveImage,
    imagePreview,
    selectedLocation,
    setSelectedLocation
}: AddStickerModalProps) {
    const [addressQuery, setAddressQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<LocationSearchResult[]>([]);
    const [isLocatingCurrent, setIsLocatingCurrent] = useState(false);
    const [locationError, setLocationError] = useState<string | null>(null);
    const [isAutoFilledName, setIsAutoFilledName] = useState(false);

    useEffect(() => {
        if (!addressQuery.trim()) {
            setSearchResults([]);
            return;
        }

        const timer = setTimeout(() => {
            void (async () => {
                setIsSearching(true);
                setLocationError(null);
                const results = await searchLocations(addressQuery);
                setSearchResults(results);
                if (results.length === 0) {
                    setLocationError('Geen locaties gevonden voor deze zoekopdracht.');
                }
                setIsSearching(false);
            })();
        }, 400);

        return () => clearTimeout(timer);
    }, [addressQuery]);

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
        setFormData((prev) => {
            const shouldAutoFill = !prev.location_name || isAutoFilledName;
            if (shouldAutoFill) {
                setIsAutoFilledName(true);
            }
            return {
                ...prev,
                city: result.city,
                country: result.country,
                location_name: shouldAutoFill ? result.city : prev.location_name
            };
        });
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
                    setFormData((prev) => {
                        const shouldAutoFill = !prev.location_name || isAutoFilledName;
                        if (shouldAutoFill) {
                            setIsAutoFilledName(true);
                        }
                        return {
                            ...prev,
                            city,
                            country,
                            location_name: shouldAutoFill ? city : prev.location_name
                        };
                    });
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

    const handleResetLocation = () => {
        setSelectedLocation(null);
        setFormData((prev) => ({
            ...prev,
            city: '',
            country: '',
            location_name: isAutoFilledName ? '' : prev.location_name
        }));
        setIsAutoFilledName(false);
        setAddressQuery('');
        setSearchResults([]);
    };

    const handleRemovePhoto = () => {
        setFormData((prev) => ({ ...prev, image: null }));
        if (onRemoveImage) {
            onRemoveImage();
        }
    };

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xl">
            <div className="bg-(--bg-card) rounded-3xl w-full max-w-xl shadow-2xl border border-white/10 overflow-hidden flex flex-col max-h-[95vh]">
                <div className="bg-linear-to-r from-(--theme-purple) to-(--theme-purple-dark) p-4 sm:p-6 text-white flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tighter italic">Nieuwe Sticker <span className="text-white/70">Plakken</span></h2>
                        <p className="text-[10px] uppercase tracking-widest font-black opacity-80 mt-1">{selectedLocation ? 'Locatie geselecteerd op kaart' : 'Selecteer of zoek locatie'}</p>
                    </div>
                    <IconButton onClick={onClose} aria-label="Sluiten">
                        <X className="h-6 w-6" />
                    </IconButton>
                </div>

                <form onSubmit={onSubmit} autoComplete="off" data-lpignore="true" data-1p-ignore data-bwignore data-form-type="other" className="p-4 sm:p-8 space-y-6 overflow-y-auto">
                    <div className="space-y-4">
                        <LocationPicker
                            selectedLocation={selectedLocation}
                            formData={formData}
                            onReset={handleResetLocation}
                            onUseCurrentLocation={handleUseCurrentLocationSync}
                            isLocatingCurrent={isLocatingCurrent}
                            addressQuery={addressQuery}
                            onAddressQueryChange={setAddressQuery}
                            onAddressSearch={handleAddressSearchSync}
                            isSearching={isSearching}
                            searchResults={searchResults}
                            onSelectResult={handleSelectResult}
                            locationError={locationError}
                        />

                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-(--text-muted) mb-2 ml-1">Naam van de Locatie</label>
                            <input
                                required
                                type="text"
                                placeholder="Bijv. Eiffeltoren, Fontys R10..."
                                value={formData.location_name}
                                onChange={(e) => {
                                    setIsAutoFilledName(false);
                                    setFormData((prev) => ({ ...prev, location_name: e.target.value }));
                                }}
                                suppressHydrationWarning
                                className="form-input w-full bg-(--bg-main)/50 border border-(--border-color)/30 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-(--theme-purple)/10 focus:border-(--theme-purple) transition-all outline-none"
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
                                    className="form-input w-full bg-(--bg-main)/30 border border-(--border-color)/20 rounded-xl px-4 py-3 text-sm text-(--text-muted) cursor-not-allowed outline-none"
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
                                    className="form-input w-full bg-(--bg-main)/30 border border-(--border-color)/20 rounded-xl px-4 py-3 text-sm text-(--text-muted) cursor-not-allowed outline-none"
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
                                className="form-input w-full bg-(--bg-main)/50 border border-(--border-color)/30 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-(--theme-purple)/10 focus:border-(--theme-purple) transition-all outline-none resize-none"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-(--text-muted) mb-2 ml-1">Foto Bewijs</label>
                            <PhotoUploader
                                imagePreview={imagePreview}
                                onImageChange={handleImageChange}
                                onRemoveImage={handleRemovePhoto}
                            />
                        </div>
                    </div>

                    <Button
                        type="submit"
                        size="lg"
                        disabled={isPending || !selectedLocation || !formData.city || !formData.country}
                        className="w-full bg-linear-to-r from-(--theme-purple) to-orange-500 text-white rounded-2xl shadow-xl hover:shadow-2xl font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 active:scale-95"
                    >
                        {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
                        Sticker Registreren
                    </Button>
                </form>
            </div>
        </div>
    );
}
