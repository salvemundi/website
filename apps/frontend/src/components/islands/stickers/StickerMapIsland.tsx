'use client';

import { useEffect, useState, useTransition, useRef } from 'react';
import { Filter, BarChart3, X } from 'lucide-react';


import { createStickerPublic, uploadFileAction } from '@/server/actions/public/stickers.actions';
import AdminToast from '@/components/ui/admin/AdminToast';
import { useAdminToast } from '@/hooks/use-admin-toast';

import StickerMap from '@/components/ui/maps/StickerMap';

import StickerStats from './map/StickerStats';
import StickerFilters from './map/StickerFilters';
import StickerActionPanel from './map/StickerActionPanel';
import AddStickerModal from './map/AddStickerModal';

import { type EnrichedUser } from '@/types/auth';
import { type StickerPublic } from '@salvemundi/validations';

type MapSticker = Omit<StickerPublic, 'user_updated' | 'date_updated' | 'address' | 'status'>;

interface StickerMapIslandProps {
    initialStickers: MapSticker[];
    user: EnrichedUser | null;
    className?: string;
}

interface DirectusStickerResponse {
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

import { compressStickerImage, readFileAsDataUrl } from '@/shared/lib/utils/image-compression';
import { reverseGeocode } from '@/shared/lib/utils/geolocation';

export default function StickerMapIsland({
    initialStickers,
    user,
    className
}: StickerMapIslandProps) {
    const { toast, showToast, hideToast } = useAdminToast();
    const [stickers, setStickers] = useState(initialStickers);
    const [isPending, startTransition] = useTransition();
    const [isLocating, setIsLocating] = useState(false);
    const cameraInputRef = useRef<HTMLInputElement>(null);

    // UI State
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const [showMobileStats, setShowMobileStats] = useState(false);

    // Filters
    const [filterCountry, setFilterCountry] = useState('');
    const [filterCity, setFilterCity] = useState('');

    // Form State
    const [formData, setFormData] = useState({
        location_name: '',
        description: '',
        city: '',
        country: '',
        image: null as File | null
    });
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const setStickerImage = async (file: File, overrides: Partial<typeof formData> = {}) => {
        const compressedFile = await compressStickerImage(file);
        const preview = await readFileAsDataUrl(compressedFile);

        setFormData(prev => ({
            ...prev,
            ...overrides,
            image: compressedFile
        }));
        setImagePreview(preview);
        return compressedFile;
    };

    useEffect(() => {
        document.body.style.overflow = (showMobileFilters || showMobileStats) ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [showMobileFilters, showMobileStats]);

    const closeMobileOverlays = () => {
        setShowMobileFilters(false);
        setShowMobileStats(false);
    };

    const openMobileFilters = () => {
        setShowMobileStats(false);
        setShowMobileFilters(true);
    };

    const openMobileStats = () => {
        setShowMobileFilters(false);
        setShowMobileStats(true);
    };

    const handlePlaceSticker = () => {
        if (!user) {
            showToast("Log in om een sticker te plakken.", 'error');
            return;
        }

        // On mobile we no longer immediately open the camera. Instead open the
        // add-sticker form and try to fill location automatically — adding a photo
        // becomes optional via the form.
        setIsLocating(true);

        if (!(navigator as Partial<Navigator>).geolocation) {
            showToast("Je browser ondersteunt geen geolocatie. We openen de handmatige kaartomgeving.", 'error');
            setSelectedLocation(null);
            setShowAddModal(true);
            setIsLocating(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                void (async () => {
                    const { latitude, longitude } = position.coords;
                    setSelectedLocation({ lat: latitude, lng: longitude });

                    const { city: reverseCity, country: reverseCountry } = await reverseGeocode(latitude, longitude);

                    setFormData({
                        location_name: reverseCity,
                        description: '',
                        city: reverseCity,
                        country: reverseCountry,
                        image: null
                    });
                    setImagePreview(null);
                    setShowAddModal(true);
                    setIsLocating(false);
                })();
            },
            (error) => {
                let msg = "Kon je locatie niet bepalen. We openen de handmatige kaartomgeving.";
                if (error.code === 1) msg = "Locatie toegang geweigerd. We openen de handmatige kaartomgeving.";
                showToast(msg, 'error');

                setFormData({
                    location_name: '',
                    description: '',
                    city: '',
                    country: '',
                    image: null
                });
                setImagePreview(null);
                setSelectedLocation(null);
                setShowAddModal(true);
                setIsLocating(false);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const handleAutomatedFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const compressedFile = await compressStickerImage(file);

        setIsLocating(true);
        showToast('Foto ontvangen! Locatie bepalen...', 'success');

        if (!(navigator as Partial<Navigator>).geolocation) {
            showToast("Je browser ondersteunt geen geolocatie. We openen de handmatige kaartomgeving.", 'error');
            void setStickerImage(compressedFile);
            setSelectedLocation(null);
            setShowAddModal(true);
            setIsLocating(false);
            e.target.value = '';
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                void (async () => {
                    const { latitude, longitude } = position.coords;
                    
                    const { city: reverseCity, country: reverseCountry } = await reverseGeocode(latitude, longitude);
                    
                    const city = reverseCity || 'Onbekende Stad';
                    const country = reverseCountry || 'Onbekend Land';

                    startTransition(async () => {
                        try {
                            showToast('Foto uploaden...', 'success');
                            const fileData = new FormData();
                            fileData.append('file', compressedFile);
                            const uploadResult = await uploadFileAction(fileData);
                            
                            if (!uploadResult.success) {
                                throw new Error(uploadResult.error || 'Foto upload mislukt.');
                            }
                            const imageId = uploadResult.data;

                            showToast('Sticker registreren...', 'success');
                            const locationName = `${city}`;
                            const response = (await createStickerPublic({
                                latitude,
                                longitude,
                                location_name: locationName,
                                description: '',
                                city,
                                country,
                                image: imageId
                            })) as { success: boolean; data?: unknown; error?: string };

                            if (!response.success || !response.data) {
                                throw new Error(response.error || 'Kon sticker niet opslaan.');
                            }

                            const userCreatedInfo = user ? {
                                id: user.id,
                                first_name: user.first_name || null,
                                last_name: user.last_name || null,
                                avatar: user.avatar || null
                            } : null;

                            const responseData = response.data as unknown as DirectusStickerResponse;
                            const stickerToAppend: MapSticker = {
                                id: Number(responseData.id),
                                latitude: Number(responseData.latitude),
                                longitude: Number(responseData.longitude),
                                location_name: responseData.location_name || locationName,
                                description: responseData.description || '',
                                city: responseData.city || city,
                                country: responseData.country || country,
                                image: responseData.image || imageId,
                                date_created: responseData.date_created || new Date().toISOString(),
                                user_created: userCreatedInfo
                            };

                            setStickers((prev: MapSticker[]) => [stickerToAppend, ...prev]);
                            showToast('Sticker succesvol geplaatst!', 'success');
                        } catch (err: unknown) {
                            const errMsg = err instanceof Error ? err.message : 'Fout bij automatisch plaatsen.';
                            if (typeof errMsg === 'string' && errMsg.includes('Failed to find Server Action')) {
                                showToast('Serveractie niet gevonden. Herlaad de pagina en probeer opnieuw (mogelijke verouderde deployment).', 'error');
                            } else {
                                showToast(errMsg, 'error');
                            }
                            
                            void setStickerImage(compressedFile, {
                                location_name: city !== 'Onbekende Stad' ? city : '',
                                description: '',
                                city: city !== 'Onbekende Stad' ? city : '',
                                country: country !== 'Onbekend Land' ? country : ''
                            });
                            setSelectedLocation({ lat: latitude, lng: longitude });
                            setShowAddModal(true);
                        } finally {
                            setIsLocating(false);
                        }
                    });
                })();
            },
            (error) => {
                let msg = "Kon je locatie niet bepalen. We openen de handmatige kaartomgeving.";
                if (error.code === 1) msg = "Locatie toegang geweigerd. We openen de handmatige kaartomgeving.";
                showToast(msg, 'error');

                void setStickerImage(compressedFile, {
                    city: '',
                    country: ''
                });
                setSelectedLocation(null);
                setShowAddModal(true);
                setIsLocating(false);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );

        e.target.value = '';
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            void setStickerImage(file);
        }
    };

    const uploadImage = async (file: File): Promise<string> => {
        const formData = new FormData();
        formData.append('file', file);
        const result = await uploadFileAction(formData);
        if (!result.success) {
            throw new Error(result.error || 'Foto upload mislukt.');
        }
        return result.data;
    };

    const handleSubmit = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        if (!selectedLocation) return;

        startTransition(async () => {
            try {
                let imageId: string | null = null;
                if (formData.image) {
                    imageId = await uploadImage(formData.image);
                }

                const response = (await createStickerPublic({
                    latitude: selectedLocation.lat,
                    longitude: selectedLocation.lng,
                    location_name: formData.location_name,
                    description: formData.description,
                    city: formData.city,
                    country: formData.country,
                    image: imageId
                })) as { success: boolean; data?: unknown; error?: string };

                if (!response.success || !response.data) {
                    throw new Error(response.error || 'Kon sticker niet opslaan.');
                }

                const userCreatedInfo = user ? {
                    id: user.id,
                    first_name: user.first_name || null,
                    last_name: user.last_name || null,
                    avatar: user.avatar || null
                } : null;

                const responseData = response.data as unknown as DirectusStickerResponse;
                const stickerToAppend: MapSticker = {
                    id: Number(responseData.id),
                    latitude: Number(responseData.latitude),
                    longitude: Number(responseData.longitude),
                    location_name: responseData.location_name || formData.location_name,
                    description: responseData.description || formData.description,
                    city: responseData.city || formData.city,
                    country: responseData.country || formData.country,
                    image: responseData.image || imageId,
                    date_created: responseData.date_created || new Date().toISOString(),
                    user_created: userCreatedInfo
                };

                setStickers((prev: MapSticker[]) => [stickerToAppend, ...prev]);
                setShowAddModal(false);
                setSelectedLocation(null);
                setFormData({ location_name: '', description: '', city: '', country: '', image: null });
                setImagePreview(null);
                showToast('Sticker succesvol toegevoegd!', 'success');
            } catch (error: unknown) {
                const errMsg = error instanceof Error ? error.message : String(error);
                if (typeof errMsg === 'string' && errMsg.includes('Failed to find Server Action')) {
                    showToast('Serveractie niet gevonden. Herlaad de pagina en probeer opnieuw (mogelijke verouderde deployment).', 'error');
                } else {
                    showToast('Fout bij toevoegen: ' + errMsg, 'error');
                }
            }
        });
    };

    const handleSubmitSync = (e: React.SyntheticEvent) => {
        void handleSubmit(e);
    };

    const handleAutomatedFileChangeSync = (e: React.ChangeEvent<HTMLInputElement>) => {
        void handleAutomatedFileChange(e);
    };


    return (
        <div className="flex flex-col h-full gap-4 sm:gap-6">
            <div className="hidden md:block shrink-0">
                <StickerStats stickers={stickers as unknown as StickerPublic[]} />
            </div>

            <div className="relative group flex-1 min-h-0">
                <div className="absolute inset-0 bg-linear-to-r from-purple-500/5 to-orange-500/5 blur-3xl -z-10" />

                <StickerMap
                    stickers={stickers as unknown as StickerPublic[]}
                    user={user}
                    selectedLocation={selectedLocation}
                    filterCountry={filterCountry}
                    filterCity={filterCity}
                    stretchToContainer
                    className={className}
                />

                {/* Floating Controls */}
                <div className="absolute inset-x-0 top-4 z-90 px-4 pointer-events-none md:inset-auto md:top-4 md:left-4 md:right-auto md:w-80 md:px-0 md:bottom-auto">
                    <div className="flex items-center gap-3 md:hidden pointer-events-auto">
                        <button
                            type="button"
                            onClick={openMobileFilters}
                            className="inline-flex flex-1 min-w-0 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-bg-card/95 px-3 py-2.5 text-[10px] font-black uppercase tracking-[0.18em] text-text-main shadow-2xl backdrop-blur-md whitespace-nowrap"
                        >
                            <Filter className="h-4 w-4 text-theme-purple shrink-0" />
                            Filters
                        </button>
                        <button
                            type="button"
                            onClick={openMobileStats}
                            className="inline-flex flex-1 min-w-0 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-bg-card/95 px-3 py-2.5 text-[10px] font-black uppercase tracking-[0.18em] text-text-main shadow-2xl backdrop-blur-md whitespace-nowrap"
                        >
                            <BarChart3 className="h-4 w-4 text-theme-purple shrink-0" />
                            Stats
                        </button>
                    </div>

                    <div className="hidden md:flex md:flex-col-reverse gap-3 pointer-events-auto">
                        <StickerActionPanel
                            user={user}
                            isLocating={isLocating}
                            onPlaceSticker={handlePlaceSticker}
                        />
                        <StickerFilters
                            filterCountry={filterCountry}
                            setFilterCountry={setFilterCountry}
                            filterCity={filterCity}
                            setFilterCity={setFilterCity}
                        />
                    </div>
                </div>

                <div className="absolute inset-x-4 bottom-4 z-90 md:hidden pointer-events-none">
                    <div className="pointer-events-auto w-full">
                        <StickerActionPanel
                            user={user}
                            isLocating={isLocating}
                            onPlaceSticker={handlePlaceSticker}
                            compact
                        />
                    </div>
                </div>
            </div>

            {(showMobileFilters || showMobileStats) && (
                <div className="fixed inset-0 z-210 md:hidden">
                    <button
                        type="button"
                        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
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
                                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-bg-card text-text-main shadow-sm"
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
                                <StickerStats stickers={stickers as unknown as StickerPublic[]} />
                            )}
                        </div>
                    </div>
                </div>
            )}

            <AddStickerModal
                show={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSubmit={handleSubmitSync}
                isPending={isPending}
                formData={formData}
                setFormData={setFormData}
                handleImageChange={handleImageChange}
                imagePreview={imagePreview}
                selectedLocation={selectedLocation}
                setSelectedLocation={setSelectedLocation}
            />

            <input
                type="file"
                ref={cameraInputRef}
                accept="image/*"
                capture="environment"
                onChange={handleAutomatedFileChangeSync}
                className="hidden"
            />

            <AdminToast toast={toast} onClose={hideToast} />
        </div>
    );
}

