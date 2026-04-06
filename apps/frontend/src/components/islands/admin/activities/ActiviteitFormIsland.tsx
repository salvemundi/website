'use client';

import { useState, useRef, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { 
    ArrowLeft, 
    Upload, 
    X, 
    Save, 
    Loader2 
} from 'lucide-react';
import { createActivityAction } from '@/server/actions/activiteiten.actions';
import AdminToast from '@/components/ui/admin/AdminToast';
import { useAdminToast } from '@/hooks/use-admin-toast';

interface Committee {
    id: number;
    name: string;
}

export default function ActiviteitFormIsland({ committees }: { committees: Committee[] }) {
    const router = useRouter();
    const { toast, showToast, hideToast } = useAdminToast();
    const [isPending, startTransition] = useTransition();
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [formErrors, setFormErrors] = useState<Record<string, string[]>>({});
    
    // Controlled inputs for some UX (like radio/checkboxes)
    const [status, setStatus] = useState('published');
    const [onlyMembers, setOnlyMembers] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        setImageFile(null);
        setImagePreview(null);
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        if (imageFile) formData.append('imageFile', imageFile);
        formData.set('status', status);
        formData.set('only_members', onlyMembers ? 'on' : 'off');

        startTransition(async () => {
            const res = await createActivityAction(null, formData);
            if (!res.success) {
                if (res.fieldErrors) setFormErrors(res.fieldErrors);
                showToast(res.error || 'Er is een fout opgetreden', 'error');
            } else {
                setFormErrors({});
                showToast('Activiteit succesvol aangemaakt!', 'success');
                setTimeout(() => router.push('/beheer/activiteiten'), 1500);
            }
        });
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl overflow-x-hidden">
            <button
                type="button"
                onClick={() => router.back()}
                className="mb-6 flex items-center gap-2 text-slate-700 dark:text-slate-200 hover:text-purple-600 transition"
            >
                <ArrowLeft className="h-5 w-5" />
                Terug
            </button>

            <form onSubmit={handleSubmit} className="bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] shadow-sm p-6 sm:p-8 space-y-6 text-[var(--beheer-text)] border border-[var(--beheer-border)]">
                {/* Basic Info */}
                <div>
                    <label htmlFor="name" className="block text-sm font-bold text-[var(--beheer-text-muted)] mb-2 uppercase tracking-widest text-[10px]">Naam *</label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        className={`beheer-input ${formErrors.name ? 'border-red-500' : ''}`}
                        placeholder="Bijv. Borrel: Back to School"
                    />
                    {formErrors.name && <p className="text-red-500 text-sm mt-1">{formErrors.name[0]}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="lg:col-span-2">
                        <label htmlFor="event_date" className="block text-sm font-bold text-[var(--beheer-text-muted)] mb-2 uppercase tracking-widest text-[10px]">Startdatum *</label>
                        <input
                            type="date"
                            id="event_date"
                            name="event_date"
                            className={`beheer-input ${formErrors.event_date ? 'border-red-500' : ''}`}
                        />
                        {formErrors.event_date && <p className="text-red-500 text-sm mt-1">{formErrors.event_date[0]}</p>}
                    </div>
                    <div className="lg:col-span-2">
                        <label htmlFor="event_time" className="block text-sm font-bold text-[var(--beheer-text-muted)] mb-2 uppercase tracking-widest text-[10px]">Starttijd</label>
                        <input type="time" id="event_time" name="event_time" className="beheer-input" />
                    </div>
                    <div className="lg:col-span-2">
                        <label htmlFor="event_date_end" className="block text-sm font-bold text-[var(--beheer-text-muted)] mb-2 uppercase tracking-widest text-[10px]">Einddatum</label>
                        <input type="date" id="event_date_end" name="event_date_end" className="beheer-input" />
                    </div>
                    <div className="lg:col-span-2">
                        <label htmlFor="event_time_end" className="block text-sm font-bold text-[var(--beheer-text-muted)] mb-2 uppercase tracking-widest text-[10px]">Eindtijd</label>
                        <input type="time" id="event_time_end" name="event_time_end" className="beheer-input" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="registration_deadline" className="block text-sm font-bold text-[var(--beheer-text-muted)] mb-2 uppercase tracking-widest text-[10px]">Inschrijfdeadline</label>
                        <input type="datetime-local" id="registration_deadline" name="registration_deadline" className="beheer-input" />
                    </div>
                    <div>
                        <label htmlFor="location" className="block text-sm font-bold text-[var(--beheer-text-muted)] mb-2 uppercase tracking-widest text-[10px]">Locatie</label>
                        <input type="text" id="location" name="location" className="beheer-input" placeholder="Bijv. Fontys R10" />
                    </div>
                </div>

                <div>
                    <label htmlFor="description" className="block text-sm font-bold text-[var(--beheer-text-muted)] mb-2 uppercase tracking-widest text-[10px]">Beschrijving *</label>
                    <textarea id="description" name="description" rows={5} className={`beheer-input ${formErrors.description ? 'border-red-500' : ''}`} placeholder="Beschrijving van de activiteit" />
                    {formErrors.description && <p className="text-red-500 text-sm mt-1">{formErrors.description[0]}</p>}
                </div>

                <div>
                    <label htmlFor="description_logged_in" className="block text-sm font-bold text-[var(--beheer-text-muted)] mb-2 uppercase tracking-widest text-[10px]">Extra beschrijving (alleen ingelogd)</label>
                    <textarea id="description_logged_in" name="description_logged_in" rows={3} className="beheer-input" />
                </div>

                {/* Capacity & Pricing */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label htmlFor="max_sign_ups" className="block text-sm font-bold text-[var(--beheer-text-muted)] mb-2 uppercase tracking-widest text-[10px]">Capaciteit</label>
                        <input type="number" id="max_sign_ups" name="max_sign_ups" min="0" className="beheer-input" placeholder="Max deelnemers" />
                    </div>
                    <div>
                        <label htmlFor="price_members" className="block text-sm font-bold text-[var(--beheer-text-muted)] mb-2 uppercase tracking-widest text-[10px]">Prijs Leden (€)</label>
                        <input type="number" id="price_members" name="price_members" min="0" step="0.01" className="beheer-input" placeholder="0.00" />
                    </div>
                    <div>
                        <label htmlFor="price_non_members" className="block text-sm font-bold text-[var(--beheer-text-muted)] mb-2 uppercase tracking-widest text-[10px]">Prijs Niet-leden (€)</label>
                        <input type="number" id="price_non_members" name="price_non_members" min="0" step="0.01" className="beheer-input" placeholder="0.00" />
                    </div>
                </div>

                {/* Committee & Contact */}
                <div>
                    <label htmlFor="committee_id" className="block text-sm font-bold text-[var(--beheer-text-muted)] mb-2 uppercase tracking-widest text-[10px]">Commissie</label>
                    <select id="committee_id" name="committee_id" className="beheer-select">
                        <option value="">Selecteer een commissie...</option>
                        {committees.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="contact" className="block text-sm font-bold text-[var(--beheer-text-muted)] mb-2 uppercase tracking-widest text-[10px]">Contact (email of telefoon)</label>
                    <input type="text" id="contact" name="contact" className="beheer-input" placeholder="naam@salvemundi.nl" />
                </div>

                {/* Image Upload */}
                <div>
                    <label className="block text-sm font-bold text-slate-600 dark:text-slate-300 mb-2">Afbeelding</label>
                    {!imagePreview ? (
                        <div onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer hover:border-purple-500 transition bg-slate-50 dark:bg-slate-900 text-slate-500">
                            <Upload className="h-8 w-8 mb-2" />
                            <span className="text-sm">Klik om een afbeelding te uploaden</span>
                            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                        </div>
                    ) : (
                        <div className="relative">
                            <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
                            <div className="absolute top-2 right-2 flex gap-2">
                                <button type="button" onClick={() => fileInputRef.current?.click()} className="bg-white text-slate-900 p-2 rounded-full hover:bg-slate-100 transition shadow cursor-pointer">Edit</button>
                                <button type="button" onClick={removeImage} className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition cursor-pointer"><X className="h-4 w-4" /></button>
                            </div>
                            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                        </div>
                    )}
                </div>

                {/* Status & Options */}
                <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-6 space-y-4 bg-slate-50 dark:bg-slate-900/50">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Publicatie Instellingen</h3>
                    <div className="space-y-3">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input type="radio" value="published" checked={status === 'published'} onChange={() => setStatus('published')} className="w-4 h-4 text-purple-600 focus:ring-purple-500" />
                            <div>
                                <div className="text-sm font-semibold text-slate-900 dark:text-white">Direct publiceren</div>
                            </div>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input type="radio" value="draft" checked={status === 'draft'} onChange={() => setStatus('draft')} className="w-4 h-4 text-purple-600 focus:ring-purple-500" />
                            <div>
                                <div className="text-sm font-semibold text-slate-900 dark:text-white">Concept opslaan</div>
                            </div>
                        </label>
                        <label className="flex items-start gap-3 cursor-pointer mt-2">
                            <input type="radio" value="scheduled" checked={status === 'scheduled'} onChange={() => setStatus('scheduled')} className="w-4 h-4 text-purple-600 focus:ring-purple-500 mt-1" />
                            <div className="flex-1">
                                <div className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Plannen voor later</div>
                                {status === 'scheduled' && (
                                    <input type="datetime-local" name="publish_date" className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-purple-500 outline-none transition" />
                                )}
                            </div>
                        </label>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <input type="checkbox" id="only_members" checked={onlyMembers} onChange={(e) => setOnlyMembers(e.target.checked)} className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500 cursor-pointer" />
                    <label htmlFor="only_members" className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">Alleen voor leden</label>
                </div>

                {/* Submit */}
                <div className="flex justify-end gap-3 pt-6 border-t border-[var(--beheer-border)]">
                    <button type="button" onClick={() => router.back()} className="px-[var(--beheer-btn-px)] py-[var(--beheer-btn-py)] rounded-[var(--beheer-radius)] font-black text-xs uppercase tracking-widest border border-[var(--beheer-border)] bg-transparent text-[var(--beheer-text)] hover:bg-[var(--beheer-card-soft)] transition cursor-pointer">Annuleren</button>
                    <button type="submit" disabled={isPending || committees.length === 0} className="px-[var(--beheer-btn-px)] py-[var(--beheer-btn-py)] rounded-[var(--beheer-radius)] font-black text-xs uppercase tracking-widest bg-[var(--beheer-accent)] text-white shadow-[var(--shadow-glow)] hover:opacity-90 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                        {isPending ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" /> : <Save className="h-4 w-4" />}
                        {isPending ? 'Opslaan...' : 'Aanmaken'}
                    </button>
                </div>
            </form>

            <AdminToast toast={toast} onClose={hideToast} />
        </div>
    );
}
