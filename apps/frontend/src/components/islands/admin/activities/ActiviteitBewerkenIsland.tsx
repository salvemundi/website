'use client';

import { useState, useRef, useOptimistic, useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Upload, X, Loader2 } from 'lucide-react';
import { updateActivityAction } from '@/server/actions/activiteiten.actions';
import { getImageUrl } from '@/lib/image-utils';

interface Committee {
    id: number;
    name: string;
}

interface EventProps {
    id: number;
    name: string;
    description: string;
    description_logged_in?: string | null;
    event_date: string;
    event_date_end?: string | null;
    event_time?: string | null;
    event_time_end?: string | null;
    location?: string | null;
    max_sign_ups?: number | null;
    price_members?: number | null;
    price_non_members?: number | null;
    inschrijf_deadline?: string | null;
    committee_id?: number | null;
    contact?: string | null;
    only_members?: boolean;
    image?: any;
    status?: 'published' | 'draft' | 'archived';
    publish_date?: string | null;
}

export default function ActiviteitBewerkenIsland({ event, committees }: { event: EventProps, committees: Committee[] }) {
    const router = useRouter();
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [removeExistingImage, setRemoveExistingImage] = useState(false);
    
    // Set initial image preview if event has an image
    const [imagePreview, setImagePreview] = useState<string | null>(getImageUrl(event.image));
    
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    
    // Initialize controlled UI state correctly handling draft vs scheduled vs published
    const determineStatus = () => {
        if (event.status === 'draft') return 'draft';
        if (event.publish_date) return 'scheduled';
        return 'published';
    };
    const [status, setStatus] = useState(determineStatus());
    const [onlyMembers, setOnlyMembers] = useState(!!event.only_members);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 5000);
    };

    // React 19 useActionState
    const [state, formAction, isPending] = useActionState(async (prevState: any, formData: FormData) => {
        if (imageFile) formData.append('imageFile', imageFile);
        if (removeExistingImage) formData.append('removeImage', 'true');
        formData.set('status', status);
        formData.set('only_members', onlyMembers ? 'on' : 'off');

        const res = await updateActivityAction(event.id, prevState, formData);
        if (res.success) {
            showToast('Activiteit succesvol bijgewerkt!', 'success');
        } else {
            showToast(res.error || 'Er is een fout opgetreden', 'error');
        }
        return res;
    }, { success: false });

    // Optimistic UI for the saving state
    const [optimisticSaving, setOptimisticSaving] = useOptimistic(isPending);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            setRemoveExistingImage(false);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = () => {
        setImageFile(null);
        setImagePreview(null);
        setRemoveExistingImage(true);
    };

    const formatDate = (dateStr?: string | null) => {
        if (!dateStr) return '';
        try { return new Date(dateStr).toISOString().slice(0, 10); } catch { return ''; }
    };
    
    const formatDateTime = (dateStr?: string | null) => {
        if (!dateStr) return '';
        try { 
            const d = new Date(dateStr);
            d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
            return d.toISOString().slice(0, 16);
        } catch { return ''; }
    };

    const formErrors = state.fieldErrors || {};

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl overflow-x-hidden">
            <button
                type="button"
                onClick={() => router.back()}
                className="mb-6 flex items-center gap-2 text-slate-700 dark:text-slate-200 hover:text-primary transition font-medium"
            >
                <ArrowLeft className="h-5 w-5" />
                Terug
            </button>

            <form action={formAction} className="bg-white dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 sm:p-8 space-y-6 text-slate-900 dark:text-white border border-slate-100 dark:border-slate-700/50">
                {/* Basic Info */}
                <div>
                    <label htmlFor="name" className="block text-sm font-bold text-slate-600 dark:text-slate-300 mb-2">Naam *</label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        defaultValue={event.name}
                        autoComplete="off"
                        className={`w-full px-4 py-3 rounded-lg border bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white ${formErrors.name ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition`}
                        placeholder="Bijv. Borrel: Back to School"
                    />
                    {formErrors.name && <p className="text-red-500 text-sm mt-1 font-medium">{formErrors.name[0]}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="lg:col-span-2">
                        <label htmlFor="event_date" className="block text-sm font-bold text-slate-600 dark:text-slate-300 mb-2">Startdatum *</label>
                        <input
                            type="date"
                            id="event_date"
                            name="event_date"
                            defaultValue={formatDate(event.event_date)}
                            className={`w-full px-4 py-3 rounded-lg border bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white ${formErrors.event_date ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition`}
                        />
                        {formErrors.event_date && <p className="text-red-500 text-sm mt-1 font-medium">{formErrors.event_date[0]}</p>}
                    </div>
                    <div className="lg:col-span-2">
                        <label htmlFor="event_time" className="block text-sm font-bold text-slate-600 dark:text-slate-300 mb-2">Starttijd</label>
                        <input type="time" id="event_time" name="event_time" defaultValue={event.event_time?.slice(0, 5) || ''} className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition" />
                    </div>
                    <div className="lg:col-span-2">
                        <label htmlFor="event_date_end" className="block text-sm font-bold text-slate-600 dark:text-slate-300 mb-2">Einddatum</label>
                        <input type="date" id="event_date_end" name="event_date_end" defaultValue={formatDate(event.event_date_end)} className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition" />
                    </div>
                    <div className="lg:col-span-2">
                        <label htmlFor="event_time_end" className="block text-sm font-bold text-slate-600 dark:text-slate-300 mb-2">Eindtijd</label>
                        <input type="time" id="event_time_end" name="event_time_end" defaultValue={event.event_time_end?.slice(0, 5) || ''} className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="inschrijf_deadline" className="block text-sm font-bold text-slate-600 dark:text-slate-300 mb-2">Inschrijfdeadline</label>
                        <input type="datetime-local" id="inschrijf_deadline" name="inschrijf_deadline" defaultValue={formatDateTime(event.inschrijf_deadline)} className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition" />
                    </div>
                    <div>
                        <label htmlFor="location" className="block text-sm font-bold text-slate-600 dark:text-slate-300 mb-2">Locatie</label>
                        <input type="text" id="location" name="location" defaultValue={event.location || ''} className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition" placeholder="Bijv. Fontys R10" />
                    </div>
                </div>

                <div>
                    <label htmlFor="description" className="block text-sm font-bold text-slate-600 dark:text-slate-300 mb-2">Beschrijving *</label>
                    <textarea id="description" name="description" rows={5} defaultValue={event.description} className={`w-full px-4 py-3 rounded-lg border bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white ${formErrors.description ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition`} placeholder="Beschrijving van de activiteit" />
                    {formErrors.description && <p className="text-red-500 text-sm mt-1 font-medium">{formErrors.description[0]}</p>}
                </div>

                <div>
                    <label htmlFor="description_logged_in" className="block text-sm font-bold text-slate-600 dark:text-slate-300 mb-2">Extra beschrijving (alleen ingelogd)</label>
                    <textarea id="description_logged_in" name="description_logged_in" rows={3} defaultValue={event.description_logged_in || ''} className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition" />
                </div>

                {/* Capacity & Pricing */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label htmlFor="max_sign_ups" className="block text-sm font-bold text-slate-600 dark:text-slate-300 mb-2">Capaciteit</label>
                        <input type="number" id="max_sign_ups" name="max_sign_ups" defaultValue={event.max_sign_ups || ''} min="0" className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition" placeholder="Max deelnemers" />
                    </div>
                    <div>
                        <label htmlFor="price_members" className="block text-sm font-bold text-slate-600 dark:text-slate-300 mb-2">Prijs Leden (€)</label>
                        <input type="number" id="price_members" name="price_members" defaultValue={event.price_members !== null && event.price_members !== undefined ? event.price_members : ''} min="0" step="0.01" className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition" placeholder="0.00" />
                    </div>
                    <div>
                        <label htmlFor="price_non_members" className="block text-sm font-bold text-slate-600 dark:text-slate-300 mb-2">Prijs Niet-leden (€)</label>
                        <input type="number" id="price_non_members" name="price_non_members" defaultValue={event.price_non_members !== null && event.price_non_members !== undefined ? event.price_non_members : ''} min="0" step="0.01" className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition" placeholder="0.00" />
                    </div>
                </div>

                {/* Committee & Contact */}
                <div>
                    <label htmlFor="committee_id" className="block text-sm font-bold text-slate-600 dark:text-slate-300 mb-2">Commissie</label>
                    <select id="committee_id" name="committee_id" defaultValue={event.committee_id || ''} className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition">
                        <option value="">Selecteer een commissie...</option>
                        {committees.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="contact" className="block text-sm font-bold text-slate-600 dark:text-slate-300 mb-2">Contact (email of telefoon)</label>
                    <input type="text" id="contact" name="contact" defaultValue={event.contact || ''} className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition" placeholder="naam@salvemundi.nl" />
                </div>

                {/* Image Upload */}
                <div>
                    <label className="block text-sm font-bold text-slate-600 dark:text-slate-300 mb-2">Afbeelding</label>
                    {!imagePreview ? (
                        <div onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer hover:border-primary hover:bg-primary/5 transition bg-slate-50 dark:bg-slate-900/50 text-slate-500">
                            <Upload className="h-8 w-8 mb-2" />
                            <span className="text-sm">Klik om een afbeelding te uploaden of wijzigen</span>
                            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                        </div>
                    ) : (
                        <div className="relative group">
                            <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover rounded-lg ring-1 ring-slate-200 dark:ring-slate-700" />
                            <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button type="button" onClick={() => fileInputRef.current?.click()} className="bg-white text-slate-900 p-2 rounded-full hover:bg-slate-100 transition shadow-lg cursor-pointer"><Upload className="h-4 w-4" /></button>
                                <button type="button" onClick={handleRemoveImage} className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition shadow-lg cursor-pointer"><X className="h-4 w-4" /></button>
                            </div>
                            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                        </div>
                    )}
                </div>

                {/* Status & Options */}
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-6 space-y-4 bg-slate-50 dark:bg-slate-900/30">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Publicatie Instellingen</h3>
                    <div className="space-y-4">
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <input type="radio" value="published" checked={status === 'published'} onChange={() => setStatus('published')} className="w-5 h-5 text-primary focus:ring-primary/20 border-slate-300 dark:border-slate-600" />
                            <span className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-primary transition">Direct publiceren</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <input type="radio" value="draft" checked={status === 'draft'} onChange={() => setStatus('draft')} className="w-5 h-5 text-primary focus:ring-primary/20 border-slate-300 dark:border-slate-600" />
                            <span className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-primary transition">Concept opslaan</span>
                        </label>
                        <label className="flex items-start gap-3 cursor-pointer group">
                            <input type="radio" value="scheduled" checked={status === 'scheduled'} onChange={() => setStatus('scheduled')} className="w-5 h-5 text-primary focus:ring-primary/20 border-slate-300 dark:border-slate-600 mt-1" />
                            <div className="flex-1">
                                <span className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-primary transition">Plannen voor later</span>
                                {status === 'scheduled' && (
                                    <input type="datetime-local" name="publish_date" defaultValue={formatDateTime(event.publish_date)} className="mt-2 w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary outline-none transition" />
                                )}
                            </div>
                        </label>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <input type="checkbox" id="only_members" checked={onlyMembers} onChange={(e) => setOnlyMembers(e.target.checked)} className="w-6 h-6 text-primary rounded-md border-slate-300 dark:border-slate-600 focus:ring-primary/20 cursor-pointer" />
                    <label htmlFor="only_members" className="text-sm font-bold text-slate-700 dark:text-slate-300 cursor-pointer hover:text-primary transition">Alleen voor leden</label>
                </div>

                {/* Submit */}
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <button type="submit" disabled={optimisticSaving} className="flex-1 bg-primary hover:bg-primary/90 text-white px-8 py-4 rounded-full font-bold shadow-lg shadow-primary/20 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed disabled:scale-100">
                        {optimisticSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                        {optimisticSaving ? 'Opslaan...' : 'Wijzigingen Opslaan'}
                    </button>
                    <button type="button" onClick={() => router.back()} className="px-8 py-4 rounded-full font-bold border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer">Annuleren</button>
                </div>
            </form>

            {/* Toast */}
            {toast && (
                <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className={`px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border ${toast.type === 'success' ? 'bg-green-500 border-green-600 text-white' : 'bg-red-500 border-red-600 text-white'}`}>
                        <span className="font-bold">{toast.message}</span>
                    </div>
                </div>
            )}
        </div>
    );
}
