'use client';

import { Plus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button, Modal, SimpleGrid, Stack, Text, Textarea, TextInput, Title } from '@mantine/core';
import { searchLocations, reverseGeocode, type LocationSearchResult } from '@/shared/lib/utils/geolocation';
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
    setSelectedLocation,
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
                location_name: shouldAutoFill ? result.city : prev.location_name,
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
                            location_name: shouldAutoFill ? city : prev.location_name,
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

    const handleResetLocation = () => {
        setSelectedLocation(null);
        setFormData((prev) => ({
            ...prev,
            city: '',
            country: '',
            location_name: isAutoFilledName ? '' : prev.location_name,
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
        <Modal
            opened={show}
            onClose={onClose}
            size="lg"
            radius="lg"
            centered
            title={
                <Stack gap={2}>
                    <Title order={3} size="h4" c="brand">
                        Nieuwe Sticker Plakken
                    </Title>
                    <Text size="xs" c="dimmed">
                        {selectedLocation ? 'Locatie geselecteerd op kaart' : 'Selecteer of zoek locatie'}
                    </Text>
                </Stack>
            }
        >
            <form onSubmit={onSubmit} autoComplete="off" data-lpignore="true" data-1p-ignore data-bwignore data-form-type="other">
                <Stack gap="md">
                    <LocationPicker
                        selectedLocation={selectedLocation}
                        formData={formData}
                        onReset={handleResetLocation}
                        onUseCurrentLocation={handleUseCurrentLocation}
                        isLocatingCurrent={isLocatingCurrent}
                        addressQuery={addressQuery}
                        onAddressQueryChange={setAddressQuery}
                        onAddressSearch={handleAddressSearchSync}
                        isSearching={isSearching}
                        searchResults={searchResults}
                        onSelectResult={handleSelectResult}
                        locationError={locationError}
                    />

                    <TextInput
                        label="Naam van de Locatie"
                        required
                        placeholder="Bijv. Eiffeltoren, Fontys R10..."
                        value={formData.location_name}
                        onChange={(e) => {
                            setIsAutoFilledName(false);
                            setFormData((prev) => ({ ...prev, location_name: e.currentTarget.value }));
                        }}
                    />

                    <SimpleGrid cols={2} spacing="md">
                        <TextInput
                            label="Stad"
                            placeholder="Vul de stad in"
                            value={formData.city}
                            onChange={(e) => setFormData((prev) => ({ ...prev, city: e.currentTarget.value }))}
                        />
                        <TextInput
                            label="Land"
                            placeholder="Vul het land in"
                            value={formData.country}
                            onChange={(e) => setFormData((prev) => ({ ...prev, country: e.currentTarget.value }))}
                        />
                    </SimpleGrid>

                    {selectedLocation && (!formData.city || !formData.country) && (
                        <Text size="sm" c="dimmed">
                            Stad en land konden niet automatisch worden bepaald. Vul ze hierboven in.
                        </Text>
                    )}

                    <Textarea
                        label="Beschrijving"
                        rows={3}
                        placeholder="Wat een mooie plek voor een Salve sticker!"
                        value={formData.description}
                        onChange={(e) => setFormData((prev) => ({ ...prev, description: e.currentTarget.value }))}
                    />

                    <Stack gap={6}>
                        <Text size="sm" fw={500}>
                            Foto Bewijs
                        </Text>
                        <PhotoUploader
                            imagePreview={imagePreview}
                            onImageChange={handleImageChange}
                            onRemoveImage={handleRemovePhoto}
                        />
                    </Stack>

                    <Button
                        type="submit"
                        size="lg"
                        fullWidth
                        loading={isPending}
                        disabled={isPending || !selectedLocation || !formData.city.trim() || !formData.country.trim()}
                        leftSection={<Plus size={18} />}
                    >
                        Sticker Registreren
                    </Button>
                </Stack>
            </form>
        </Modal>
    );
}
