'use client';

import { X, Camera, Loader2, Plus } from 'lucide-react';
import { useState } from 'react';
import MediaAsset from '@/components/ui/media/MediaAsset';

interface AddStickerModalProps {
    show: boolean;
    onClose: () => void;
    onSubmit: (e: React.FormEvent) => void;
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
    imagePreview
    ,
    selectedLocation,
    setSelectedLocation
}: AddStickerModalProps) {
    if (!show) return null;

    const [addressQuery, setAddressQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    const handleAddressSearch = async () => {
        if (!addressQuery) return;
        setIsSearching(true);
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressQuery)}&limit=5&accept-language=nl`, {
                headers: { 'User-Agent': 'SalveMundi-Website' }
            });
            const items = await res.json();
            if (items && items.length > 0) {
                const first = items[0];
                const lat = parseFloat(first.lat);
                const lon = parseFloat(first.lon);
                setSelectedLocation({ lat, lng: lon });

                const addr = first.display_name || '';
                const parts = addr.split(',').map((s: string) => s.trim());
                const country = parts[parts.length - 1] || '';
                const city = parts.length > 1 ? parts[parts.length - 3] || parts[parts.length - 2] : '';
                setFormData((prev) => ({ ...prev, city, country }));
            }
        } catch (e) {
            // ignore
        }
        setIsSearching(false);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xl">
            <div className="bg-[var(--bg-card)] rounded-3xl w-full max-w-xl shadow-2xl border border-white/10 overflow-hidden flex flex-col max-h-[95vh]">
                <div className="bg-gradient-to-r from-[var(--theme-purple)] to-[var(--theme-purple-dark)] p-4 sm:p-6 text-white flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tighter italic">Nieuwe Sticker <span className="text-white/70">Plakken</span></h2>
                        <p className="text-[10px] uppercase tracking-widest font-black opacity-80 mt-1">{selectedLocation ? 'Locatie geselecteerd op kaart' : 'Selecteer of zoek locatie'}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition-colors">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <form onSubmit={onSubmit} className="p-4 sm:p-8 space-y-6 overflow-y-auto">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <p className="text-[10px] uppercase tracking-widest font-black opacity-80">Locatie</p>
                            <div className="flex items-center gap-3">
                                <div className="text-sm text-[var(--text-main)]">
                                    {selectedLocation ? (
                                        <span>Geselecteerde locatie: {selectedLocation.lat.toFixed(5)}, {selectedLocation.lng.toFixed(5)}</span>
                                    ) : (
                                        <span>Geen locatie geselecteerd</span>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setSelectedLocation(null)}
                                    className="ml-auto inline-flex items-center gap-2 rounded-xl bg-[var(--bg-main)]/60 px-3 py-2 text-xs font-black uppercase tracking-widest"
                                >
                                    Reset
                                </button>
                            </div>

                            <div className="flex gap-2">
                                <input
                                    value={addressQuery}
                                    onChange={(e) => setAddressQuery(e.target.value)}
                                    placeholder="Zoek adres of plaats"
                                    className="flex-1 bg-[var(--bg-main)]/50 border border-[var(--border-color)]/30 rounded-xl px-3 py-2 text-sm outline-none"
                                />
                                <button
                                    type="button"
                                    onClick={handleAddressSearch}
                                    disabled={isSearching}
                                    className="inline-flex items-center gap-2 rounded-2xl bg-[var(--theme-purple)]/90 px-3 py-2 text-white font-black uppercase text-xs"
                                >
                                    {isSearching ? 'Zoeken…' : 'Zoek'}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-2 ml-1">Naam van de Locatie</label>
                            <input
                                required
                                type="text"
                                placeholder="Bijv. Eiffeltoren, Fontys R10..."
                                value={formData.location_name}
                                onChange={(e) => setFormData((prev) => ({ ...prev, location_name: e.target.value }))}
                                suppressHydrationWarning
                                className="w-full bg-[var(--bg-main)]/50 border border-[var(--border-color)]/30 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-[var(--theme-purple)]/10 focus:border-[var(--theme-purple)] transition-all outline-none"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-2 ml-1">Stad</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="Eindhoven"
                                    value={formData.city}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
                                    suppressHydrationWarning
                                    className="w-full bg-[var(--bg-main)]/50 border border-[var(--border-color)]/30 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-[var(--theme-purple)]/10 focus:border-[var(--theme-purple)] transition-all outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-2 ml-1">Land</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="Nederland"
                                    value={formData.country}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, country: e.target.value }))}
                                    suppressHydrationWarning
                                    className="w-full bg-[var(--bg-main)]/50 border border-[var(--border-color)]/30 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-[var(--theme-purple)]/10 focus:border-[var(--theme-purple)] transition-all outline-none"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-2 ml-1">Beschrijving</label>
                            <textarea
                                rows={3}
                                placeholder="Wat een mooie plek voor een Salve sticker!"
                                value={formData.description}
                                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                                className="w-full bg-[var(--bg-main)]/50 border border-[var(--border-color)]/30 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-[var(--theme-purple)]/10 focus:border-[var(--theme-purple)] transition-all outline-none resize-none"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-2 ml-1">Foto Bewijs</label>
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
                                    className="cursor-pointer flex flex-col items-center justify-center w-full h-40 bg-[var(--bg-main)]/30 border-2 border-dashed border-[var(--border-color)]/50 rounded-2xl hover:border-[var(--theme-purple)]/50 hover:bg-[var(--theme-purple)]/5 transition-all group-hover/photo:shadow-inner overflow-hidden"
                                >
                                    {imagePreview ? (
                                        <MediaAsset asset={imagePreview} className="w-full h-full object-cover" alt="Preview" fill />
                                    ) : (
                                        <>
                                            <Camera className="h-8 w-8 text-[var(--text-muted)] mb-2" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Foto Selecteren</span>
                                        </>
                                    )}
                                </label>
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isPending}
                        className="w-full py-4 bg-gradient-to-r from-[var(--theme-purple)] to-orange-500 text-white rounded-2xl shadow-xl shadow-purple-500/20 hover:shadow-2xl hover:shadow-purple-500/30 transition-all font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                    >
                        {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
                        Sticker Registreren
                    </button>
                </form>
            </div>
        </div>
    );
}
