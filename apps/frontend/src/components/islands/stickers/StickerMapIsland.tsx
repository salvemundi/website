'use client';

import { useEffect, useState, useTransition } from 'react';
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

interface StickerMapIslandProps {
    initialStickers: StickerPublic[];
    user: EnrichedUser | null;
}

export default function StickerMapIsland({
    initialStickers,
    user
}: StickerMapIslandProps) {
    const { toast, showToast, hideToast } = useAdminToast();
    const [stickers, setStickers] = useState(initialStickers);
    const [isPending, startTransition] = useTransition();
    const [isLocating, setIsLocating] = useState(false);

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
        if (!user) return;

        setIsLocating(true);

        if (!navigator.geolocation) {
            showToast("Je browser ondersteunt geen geolocatie.", 'error');
            setIsLocating(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                setSelectedLocation({ lat: latitude, lng: longitude });

                // Reverse Geocoding to pre-fill city and country
                try {
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=nl`, {
                        headers: { 'User-Agent': 'SalveMundi-Website' }
                    });
                    const geoData = await response.json();
                    const addr = geoData.address || {};
                    const city = addr.city || addr.town || addr.village || addr.suburb || '';
                    const country = addr.country || '';

                    setFormData(prev => ({
                        ...prev,
                        city,
                        country
                    }));
                } catch (_error) {

                }

                setShowAddModal(true);
                setIsLocating(false);
            },
            (error) => {
                let msg = "Kon je locatie niet bepalen.";
                if (error.code === 1) msg = "Locatie toegang geweigerd. Zet dit aan in je browser.";
                showToast(msg, 'error');
                setIsLocating(false);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFormData(prev => ({ ...prev, image: file }));
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const uploadImage = async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return await uploadFileAction(formData);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedLocation) return;

        startTransition(async () => {
            try {
                let imageId = null;
                if (formData.image) {
                    imageId = await uploadImage(formData.image);
                }

                const newSticker = await createStickerPublic({
                    latitude: selectedLocation.lat,
                    longitude: selectedLocation.lng,
                    location_name: formData.location_name,
                    description: formData.description,
                    city: formData.city,
                    country: formData.country,
                    image: imageId
                });

                setStickers((prev: StickerPublic[]) => [newSticker as unknown as StickerPublic, ...prev]);
                setShowAddModal(false);
                setSelectedLocation(null);
                setFormData({ location_name: '', description: '', city: '', country: '', image: null });
                setImagePreview(null);
                showToast('Sticker succesvol toegevoegd! 🎨', 'success');
            } catch (error) {
                showToast('Fout bij toevoegen: ' + error, 'error');
            }
        });
    };

    return (
        <div className="space-y-4 sm:space-y-8">
            <div className="hidden md:block">
                <StickerStats stickers={stickers} />
            </div>

            <div className="relative group h-[calc(100dvh-4.5rem)] md:h-[600px]">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-orange-500/5 blur-3xl -z-10" />

                <StickerMap
                    stickers={stickers}
                    user={user}
                    selectedLocation={selectedLocation}
                    filterCountry={filterCountry}
                    filterCity={filterCity}
                    stretchToContainer
                />

                {/* Floating Controls */}
                <div className="absolute inset-x-0 top-4 z-[90] px-4 pointer-events-none md:inset-auto md:top-4 md:left-4 md:right-auto md:w-80 md:px-0 md:bottom-auto">
                    <div className="flex items-center gap-3 md:hidden pointer-events-auto">
                        <button
                            type="button"
                            onClick={openMobileFilters}
                            className="inline-flex flex-1 min-w-0 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-[var(--bg-card)]/95 px-3 py-2.5 text-[10px] font-black uppercase tracking-[0.18em] text-[var(--text-main)] shadow-2xl backdrop-blur-md whitespace-nowrap"
                        >
                            <Filter className="h-4 w-4 text-[var(--theme-purple)] shrink-0" />
                            Filters
                        </button>
                        <button
                            type="button"
                            onClick={openMobileStats}
                            className="inline-flex flex-1 min-w-0 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-[var(--bg-card)]/95 px-3 py-2.5 text-[10px] font-black uppercase tracking-[0.18em] text-[var(--text-main)] shadow-2xl backdrop-blur-md whitespace-nowrap"
                        >
                            <BarChart3 className="h-4 w-4 text-[var(--theme-purple)] shrink-0" />
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

                <div className="absolute inset-x-4 bottom-4 z-[90] md:hidden pointer-events-none">
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
                <div className="fixed inset-0 z-[210] md:hidden">
                    <button
                        type="button"
                        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
                        onClick={closeMobileOverlays}
                        aria-label="Sluit overlay"
                    />
                    <div className="absolute inset-x-0 bottom-0 max-h-[78dvh] overflow-y-auto rounded-t-[2rem] border-t border-white/10 bg-[var(--bg-main)] shadow-[0_-20px_60px_rgba(0,0,0,0.35)]">
                        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--border-color)]/10 bg-[var(--bg-main)]/95 px-4 py-4 backdrop-blur-md">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)]">
                                    Salve Mundi
                                </p>
                                <h2 className="text-base font-black uppercase tracking-widest text-[var(--text-main)]">
                                    {showMobileFilters ? 'Filters' : 'Statistieken'}
                                </h2>
                            </div>
                            <button
                                type="button"
                                onClick={closeMobileOverlays}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--bg-card)] text-[var(--text-main)] shadow-sm"
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
            )}

            <AddStickerModal
                show={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSubmit={handleSubmit}
                isPending={isPending}
                formData={formData}
                setFormData={setFormData}
                handleImageChange={handleImageChange}
                imagePreview={imagePreview}
            />
            <AdminToast toast={toast} onClose={hideToast} />
        </div>
    );
}

