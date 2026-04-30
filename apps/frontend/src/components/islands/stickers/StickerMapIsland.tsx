'use client';

import { useState, useTransition } from 'react';
import dynamic from 'next/dynamic';
import { 
    Plus, 
    X, 
    Camera, 
    Search, 
    Map as MapIcon,
    Loader2,
    Globe,
    Award,
    TrendingUp
} from 'lucide-react';
import { createStickerPublic, uploadFileAction } from '@/server/actions/stickers.actions';
import AdminToast from '@/components/ui/admin/AdminToast';
import { useAdminToast } from '@/hooks/use-admin-toast';

const StickerMap = dynamic(() => import('@/components/ui/maps/StickerMap'), {
    ssr: false,
    loading: () => (
        <div className="w-full rounded-[var(--radius-2xl)] overflow-hidden shadow-[var(--shadow-card)] ring-1 ring-[var(--border-color)]/30 bg-[var(--bg-soft)] animate-pulse" style={{ height: '600px' }} />
    ),
});

interface StickerMapIslandProps {
    initialStickers: any[];
    user: any | null;
}

// No client-side Directus URL needed anymore.

export default function StickerMapIsland({
    initialStickers,
    user,
    isAuthenticated: serverAuth = undefined
}: StickerMapIslandProps & { isAuthenticated?: boolean }) {
    const { toast, showToast, hideToast } = useAdminToast();
    const [stickers, setStickers] = useState(initialStickers);
    const [isPending, startTransition] = useTransition();
    const [isLocating, setIsLocating] = useState(false);

    // Resolve auth status for skeleton
    const isAuthenticated = serverAuth !== undefined ? serverAuth : !!user;

    // UI State
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
    
    // Filters
    const [filterCountry, setFilterCountry] = useState('');
    const [filterCity, setFilterCity] = useState('');
    const [filterUser, setFilterUser] = useState('');

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
                } catch (err) {
                    
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

                setStickers((prev: any[]) => [newSticker, ...prev]);
                setShowAddModal(false);
                setSelectedLocation(null);
                setFormData({ location_name: '', description: '', city: '', country: '', image: null });
                setImagePreview(null);
                showToast('Sticker succesvol toegevoegd! 🎨', 'success');
            } catch (err) {
                showToast('Fout bij toevoegen: ' + err, 'error');
            }
        });
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Stats Header Area */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Totaal" value={stickers.length} icon={MapIcon} color="text-purple-500" />
                <StatCard label="Landen" value={new Set(stickers.map((s: any) => s.country?.toLowerCase()).filter(Boolean)).size} icon={Globe} color="text-blue-500" />
                <StatCard label="Steden" value={new Set(stickers.map((s: any) => s.city?.toLowerCase()).filter(Boolean)).size} icon={Award} color="text-green-500" />
                <StatCard label="Top Land" value="NL" icon={TrendingUp} color="text-orange-500" />
            </div>

            {/* Map Container - LOCKED GEOMETRY */}
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
                    <div className="bg-[var(--bg-card)]/90 backdrop-blur-md rounded-2xl p-4 shadow-2xl pointer-events-auto border border-white/10">
                        <div className="flex items-center gap-2 mb-3">
                            <Search className="h-4 w-4 text-[var(--theme-purple)]" />
                            <h3 className="text-xs font-black uppercase tracking-widest text-[var(--text-main)]">Filteren</h3>
                        </div>
                        <div className="space-y-3">
                            <input 
                                type="text" 
                                placeholder="Land..." 
                                value={filterCountry}
                                onChange={(e) => setFilterCountry(e.target.value)}
                                suppressHydrationWarning
                                className="w-full bg-[var(--bg-main)]/50 border border-[var(--border-color)]/30 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-[var(--theme-purple)]/50 transition-all outline-none"
                            />
                            <input 
                                type="text" 
                                placeholder="Stad..." 
                                value={filterCity}
                                onChange={(e) => setFilterCity(e.target.value)}
                                suppressHydrationWarning
                                className="w-full bg-[var(--bg-main)]/50 border border-[var(--border-color)]/30 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-[var(--theme-purple)]/50 transition-all outline-none"
                            />
                        </div>
                    </div>

                    {user ? (
                        <div className="bg-[var(--bg-card)]/90 backdrop-blur-md rounded-2xl p-4 shadow-2xl pointer-events-auto border border-white/10">
                             <button
                                onClick={handlePlaceSticker}
                                disabled={isLocating}
                                className="w-full py-3 bg-gradient-to-r from-[var(--theme-purple)] to-orange-500 text-white rounded-xl shadow-lg hover:shadow-xl transition-all font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isLocating ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapIcon className="h-4 w-4" />}
                                Ik ben hier! 📍
                            </button>
                            <p className="text-[9px] text-[var(--text-muted)] mt-2 text-center uppercase font-bold tracking-tighter italic">
                                Plak een sticker op je huidige GPS locatie
                            </p>
                        </div>
                    ) : (
                        <div className="bg-orange-500/90 backdrop-blur-md text-white rounded-2xl p-4 shadow-2xl pointer-events-auto flex items-start gap-3 border border-white/20">
                            <div className="p-2 bg-white/20 rounded-lg">
                                <Plus className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-xs font-black uppercase tracking-tight">Login om ook te plakken!</p>
                                <p className="text-[10px] opacity-80 mt-1">Alleen leden kunnen nieuwe locaties toevoegen aan de wereldkaart.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Add Sticker Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="bg-[var(--bg-card)] rounded-3xl w-full max-w-xl shadow-2xl border border-white/10 overflow-hidden">
                        <div className="bg-gradient-to-r from-[var(--theme-purple)] to-[var(--theme-purple-dark)] p-6 text-white flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-black uppercase tracking-tighter italic">Nieuwe Sticker <span className="text-white/70">Plakken</span></h2>
                                <p className="text-[10px] uppercase tracking-widest font-black opacity-80 mt-1">Locatie geselecteerd op kaart</p>
                            </div>
                            <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-white/20 rounded-xl transition-colors">
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-2 ml-1">Naam van de Locatie</label>
                                    <input 
                                        required
                                        type="text" 
                                        placeholder="Bijv. Eiffeltoren, Fontys R10..."
                                        value={formData.location_name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, location_name: e.target.value }))}
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
                                            onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
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
                                            onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
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
                                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
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
                                                <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
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
            )}
            <AdminToast toast={toast} onClose={hideToast} />
        </div>
    );
}

function StatCard({ label, value, icon: Icon, color }: any) {
    return (
        <div className="bg-[var(--bg-card)] rounded-2xl p-4 shadow-xl border border-white/5 flex items-center justify-between">
            <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">{label}</p>
                <p className="text-2xl font-black text-[var(--text-main)] tracking-tighter uppercase">{value}</p>
            </div>
            <div className={`p-2 rounded-xl bg-slate-500/10 ${color}`}>
                <Icon className="h-5 w-5" />
            </div>
        </div>
    );
}
