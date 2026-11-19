'use client';

import { useEffect, useState, useTransition, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Filter, BarChart3 } from 'lucide-react';
import { Box, Button, Group, Stack } from '@mantine/core';

import { createStickerPublic, uploadFileAction } from '@/server/actions/public/stickers.actions';
import { useAdminToast } from '@/hooks/use-beheer-toast';
import StickerMap from '@/components/ui/maps/StickerMap';
import { type EnrichedUser } from '@/types/auth';
import { type StickerPublic } from '@salvemundi/validations';
import { compressStickerImage, readFileAsDataUrl } from '@/shared/lib/utils/image-compression';

import StickerStats from '../components/map/StickerStats';
import StickerFilters from '../components/map/StickerFilters';
import StickerActionPanel from '../components/map/StickerActionPanel';
import AddStickerModal from '../components/map/AddStickerModal';
import { MobileOverlays } from '../components/MobileOverlays';

interface StickerMapIslandProps {
    initialStickers: StickerPublic[];
    user: EnrichedUser | null;
}

interface CreatedStickerResponse {
    id: string | number;
    latitude: string | number;
    longitude: string | number;
    location_name?: string | null;
    description?: string | null;
    city?: string | null;
    country?: string | null;
    image?: string | null;
    date_created?: string | null;
}

const EMPTY_FORM_DATA = {
    location_name: '',
    description: '',
    city: '',
    country: '',
    image: null as File | null,
};

export default function StickerMapIsland({
    initialStickers,
    user,
}: StickerMapIslandProps) {
    const { showToast } = useAdminToast();
    const [stickers, setStickers] = useState<StickerPublic[]>(initialStickers);
    const [isPending, startTransition] = useTransition();

    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const [showMobileStats, setShowMobileStats] = useState(false);

    const [filterCountry, setFilterCountry] = useState('');
    const [filterCity, setFilterCity] = useState('');

    const [formData, setFormData] = useState(EMPTY_FORM_DATA);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const handlePlaceSticker = useCallback(() => {
        if (!user) {
            showToast('Log in om een sticker te plakken.', 'error');
            return;
        }

        setFormData(EMPTY_FORM_DATA);
        setImagePreview(null);
        setSelectedLocation(null);
        setShowAddModal(true);
    }, [user, showToast]);

    const searchParams = useSearchParams();
    const hasHandledAddShortcut = useRef(false);

    useEffect(() => {
        if (hasHandledAddShortcut.current) return;
        if (searchParams.get('action') !== 'add') return;

        hasHandledAddShortcut.current = true;
        handlePlaceSticker();

        const url = new URL(window.location.href);
        url.searchParams.delete('action');
        window.history.replaceState({}, '', url);
    }, [searchParams, handlePlaceSticker]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        void (async () => {
            const compressedFile = await compressStickerImage(file);
            const preview = await readFileAsDataUrl(compressedFile);
            setFormData((prev) => ({ ...prev, image: compressedFile }));
            setImagePreview(preview);
        })();
    };

    const handleSubmit = (e: React.SyntheticEvent) => {
        e.preventDefault();
        if (!selectedLocation) return;

        startTransition(async () => {
            try {
                let imageId: string | null = null;
                if (formData.image) {
                    const fd = new FormData();
                    fd.append('file', formData.image);
                    const uploadResult = await uploadFileAction(fd);
                    if (!uploadResult.success) {
                        throw new Error(uploadResult.error || 'Foto upload mislukt.');
                    }
                    imageId = uploadResult.data;
                }

                const response = (await createStickerPublic({
                    latitude: selectedLocation.lat,
                    longitude: selectedLocation.lng,
                    location_name: formData.location_name,
                    description: formData.description,
                    city: formData.city,
                    country: formData.country,
                    image: imageId,
                })) as { success: boolean; data?: unknown; error?: string };

                if (!response.success || !response.data) {
                    throw new Error(response.error || 'Kon sticker niet opslaan.');
                }

                const responseData = response.data as CreatedStickerResponse;
                const newSticker: StickerPublic = {
                    id: Number(responseData.id),
                    latitude: Number(responseData.latitude),
                    longitude: Number(responseData.longitude),
                    location_name: responseData.location_name || formData.location_name,
                    description: responseData.description || formData.description,
                    city: responseData.city || formData.city,
                    country: responseData.country || formData.country,
                    address: null,
                    status: 'published',
                    image: responseData.image || imageId,
                    date_created: responseData.date_created || new Date().toISOString(),
                    user_created: user
                        ? {
                            id: user.id,
                            first_name: user.first_name || null,
                            last_name: user.last_name || null,
                            avatar: user.avatar || null,
                        }
                        : null,
                };

                setStickers((prev) => [newSticker, ...prev]);
                setShowAddModal(false);
                setSelectedLocation(null);
                setFormData(EMPTY_FORM_DATA);
                setImagePreview(null);
                showToast('Sticker succesvol toegevoegd!', 'success');
            } catch (error: unknown) {
                const errMsg = error instanceof Error ? error.message : String(error);
                if (errMsg.includes('Failed to find Server Action')) {
                    showToast('Serveractie niet gevonden. Herlaad de pagina en probeer opnieuw (mogelijke verouderde deployment).', 'error');
                } else {
                    showToast(`Fout bij toevoegen: ${errMsg}`, 'error');
                }
            }
        });
    };

    return (
        <Stack h="100%" gap="md">
            <Box visibleFrom="md" style={{ flexShrink: 0 }}>
                <StickerStats stickers={stickers} />
            </Box>

            <Box pos="relative" flex={1} style={{ minHeight: 0 }}>
                <StickerMap
                    stickers={stickers}
                    user={user}
                    selectedLocation={selectedLocation}
                    filterCountry={filterCountry}
                    filterCity={filterCity}
                />

                <Box
                    pos="absolute"
                    top={16}
                    left={{ base: 0, md: 16 }}
                    right={{ base: 0, md: 'auto' }}
                    w={{ md: 320 }}
                    px={{ base: 'md', md: 0 }}
                    style={{ zIndex: 90, pointerEvents: 'none' }}
                >
                    <Group gap="sm" hiddenFrom="md" style={{ pointerEvents: 'auto' }}>
                        <Button
                            type="button"
                            flex={1}
                            variant="default"
                            size="sm"
                            leftSection={<Filter size={14} />}
                            onClick={() => {
                                setShowMobileStats(false);
                                setShowMobileFilters(true);
                            }}
                        >
                            Filters
                        </Button>
                        <Button
                            type="button"
                            flex={1}
                            variant="default"
                            size="sm"
                            leftSection={<BarChart3 size={14} />}
                            onClick={() => {
                                setShowMobileFilters(false);
                                setShowMobileStats(true);
                            }}
                        >
                            Stats
                        </Button>
                    </Group>

                    <Stack gap="sm" visibleFrom="md" style={{ pointerEvents: 'auto' }}>
                        <StickerFilters
                            filterCountry={filterCountry}
                            setFilterCountry={setFilterCountry}
                            filterCity={filterCity}
                            setFilterCity={setFilterCity}
                        />
                        <StickerActionPanel
                            user={user}
                            onPlaceSticker={handlePlaceSticker}
                        />
                    </Stack>
                </Box>

                <Box
                    pos="absolute"
                    bottom={16}
                    left={16}
                    right={16}
                    hiddenFrom="md"
                    style={{ zIndex: 90, pointerEvents: 'none' }}
                >
                    <Box w="100%" style={{ pointerEvents: 'auto' }}>
                        <StickerActionPanel
                            user={user}
                            onPlaceSticker={handlePlaceSticker}
                            compact
                        />
                    </Box>
                </Box>
            </Box>

            <MobileOverlays
                showMobileFilters={showMobileFilters}
                showMobileStats={showMobileStats}
                closeMobileOverlays={() => {
                    setShowMobileFilters(false);
                    setShowMobileStats(false);
                }}
                filterCountry={filterCountry}
                setFilterCountry={setFilterCountry}
                filterCity={filterCity}
                setFilterCity={setFilterCity}
                stickers={stickers}
            />

            <AddStickerModal
                show={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSubmit={handleSubmit}
                isPending={isPending}
                formData={formData}
                setFormData={setFormData}
                handleImageChange={handleImageChange}
                onRemoveImage={() => setImagePreview(null)}
                imagePreview={imagePreview}
                selectedLocation={selectedLocation}
                setSelectedLocation={setSelectedLocation}
            />
        </Stack>
    );
}
