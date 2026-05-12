'use client';

import { useState, useTransition } from 'react';
import dynamic from 'next/dynamic';


import { createStickerPublic, uploadFileAction } from '@/server/actions/public/stickers.actions';
import AdminToast from '@/components/ui/admin/AdminToast';
import { useAdminToast } from '@/hooks/use-admin-toast';

const StickerMap = dynamic(() => import('@/components/ui/maps/StickerMap'), {
    ssr: false,
    loading: () => (
        <div className="w-full rounded-[var(--radius-2xl)] overflow-hidden shadow-[var(--shadow-card)] ring-1 ring-[var(--border-color)]/30 bg-[var(--bg-soft)]" style={{ height: '600px' }} />
    )
});

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

    // Filters
    const [filterCountry, setFilterCountry] = useState('');
    const [filterCity, setFilterCity] = useState('');
    const [filterUser] = useState('');

    // Form State
    const [formData, setFormData] = useState({
        location_name: '',
        description: '',
        city: '',
        country: '',
        image: null as File | null
    });
    const [imagePreview, setImagePreview] = useState<string | null>(null);

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
        <div className="space-y-8 animate-in fade-in duration-700">
            <StickerStats stickers={stickers} />

            <div className="relative group min-h-[600px]">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-orange-500/10 blur-3xl -z-10 group-hover:from-purple-500/20 group-hover:to-orange-500/20 transition-all duration-1000" />

                <StickerMap
                    stickers={stickers}
                    user={user}
                    selectedLocation={selectedLocation}
                    filterCountry={filterCountry}
                    filterCity={filterCity}
                    filterUser={filterUser}
                />

                {/* Floating Controls */}
                <div className="absolute top-4 left-4 right-4 md:right-auto md:w-80 space-y-3 pointer-events-none">
                    <StickerFilters
                        filterCountry={filterCountry}
                        setFilterCountry={setFilterCountry}
                        filterCity={filterCity}
                        setFilterCity={setFilterCity}
                    />

                    <StickerActionPanel
                        user={user}
                        isLocating={isLocating}
                        onPlaceSticker={handlePlaceSticker}
                    />
                </div>
            </div>

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

