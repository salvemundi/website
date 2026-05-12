'use client';

import { X, Camera, Loader2, Plus } from 'lucide-react';
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
}: AddStickerModalProps) {
    if (!show) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl animate-in fade-in duration-300">
            <div className="bg-[var(--bg-card)] rounded-3xl w-full max-w-xl shadow-2xl border border-white/10 overflow-hidden">
                <div className="bg-gradient-to-r from-[var(--theme-purple)] to-[var(--theme-purple-dark)] p-6 text-white flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-black uppercase tracking-tighter italic">Nieuwe Sticker <span className="text-white/70">Plakken</span></h2>
                        <p className="text-[10px] uppercase tracking-widest font-black opacity-80 mt-1">Locatie geselecteerd op kaart</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition-colors">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <form onSubmit={onSubmit} className="p-8 space-y-6">
                    <div className="space-y-4">
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
