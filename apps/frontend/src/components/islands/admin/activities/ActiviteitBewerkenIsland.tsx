'use client';

import { auth } from '@/server/auth/auth';
import { useState, useRef, useOptimistic, useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Upload, X, Loader2 } from 'lucide-react';
import { updateActivityAction } from '@/server/actions/activiteiten.actions';
import { getImageUrl } from '@/lib/image-utils';
import AdminToolbar from '@/components/ui/admin/AdminToolbar';

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
    registration_deadline?: string | null;
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
        <>
            <AdminToolbar 
                title="Bewerk Activiteit"
                subtitle={`Wijzig de gegevens van "${event.name}"`}
                backHref="/beheer/activiteiten"
            />
            <div className="container mx-auto px-4 py-12 max-w-4xl overflow-x-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
                <form action={formAction} className="bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] shadow-2xl p-6 sm:p-10 space-y-8 text-[var(--beheer-text)] border border-[var(--beheer-border)] relative overflow-hidden">
                    {/* Glow effect */}
                    <div className="absolute -top-24 -right-24 h-48 w-48 bg-[var(--beheer-accent)]/5 blur-3xl rounded-full" />

                    {/* Basic Info */}
                    <div className="relative z-10">
                        <label htmlFor="name" className="block text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest mb-2">Naam *</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            defaultValue={event.name}
                            autoComplete="off"
                            className={`w-full px-5 py-4 rounded-xl border bg-[var(--beheer-card-soft)] text-[var(--beheer-text)] placeholder:text-[var(--beheer-text-muted)] ${formErrors.name ? 'border-red-500 ring-4 ring-red-500/10' : 'border-[var(--beheer-border)]'} focus:border-[var(--beheer-accent)] focus:ring-4 focus:ring-[var(--beheer-accent)]/10 outline-none transition-all font-bold`}
                            placeholder="Bijv. Borrel: Back to School"
                        />
                        {formErrors.name && <p className="text-red-500 text-[10px] font-black uppercase tracking-widest mt-2">{formErrors.name[0]}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
                        <div className="lg:col-span-2">
                            <label htmlFor="event_date" className="block text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest mb-2">Startdatum *</label>
                            <input
                                type="date"
                                id="event_date"
                                name="event_date"
                                defaultValue={formatDate(event.event_date)}
                                className={`w-full px-5 py-4 rounded-xl border bg-[var(--beheer-card-soft)] text-[var(--beheer-text)] ${formErrors.event_date ? 'border-red-500 ring-4 ring-red-500/10' : 'border-[var(--beheer-border)]'} focus:border-[var(--beheer-accent)] focus:ring-4 focus:ring-[var(--beheer-accent)]/10 outline-none transition-all font-bold`}
                            />
                            {formErrors.event_date && <p className="text-red-500 text-[10px] font-black uppercase tracking-widest mt-2">{formErrors.event_date[0]}</p>}
                        </div>
                        <div className="lg:col-span-2">
                            <label htmlFor="event_time" className="block text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest mb-2">Starttijd</label>
                            <input type="time" id="event_time" name="event_time" defaultValue={event.event_time?.slice(0, 5) || ''} className="w-full px-5 py-4 rounded-xl border border-[var(--beheer-border)] bg-[var(--beheer-card-soft)] text-[var(--beheer-text)] focus:border-[var(--beheer-accent)] focus:ring-4 focus:ring-[var(--beheer-accent)]/10 outline-none transition-all font-bold" />
                        </div>
                        <div className="lg:col-span-2">
                            <label htmlFor="event_date_end" className="block text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest mb-2">Einddatum</label>
                            <input type="date" id="event_date_end" name="event_date_end" defaultValue={formatDate(event.event_date_end)} className="w-full px-5 py-4 rounded-xl border border-[var(--beheer-border)] bg-[var(--beheer-card-soft)] text-[var(--beheer-text)] focus:border-[var(--beheer-accent)] focus:ring-4 focus:ring-[var(--beheer-accent)]/10 outline-none transition-all font-bold" />
                        </div>
                        <div className="lg:col-span-2">
                            <label htmlFor="event_time_end" className="block text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest mb-2">Eindtijd</label>
                            <input type="time" id="event_time_end" name="event_time_end" defaultValue={event.event_time_end?.slice(0, 5) || ''} className="w-full px-5 py-4 rounded-xl border border-[var(--beheer-border)] bg-[var(--beheer-card-soft)] text-[var(--beheer-text)] focus:border-[var(--beheer-accent)] focus:ring-4 focus:ring-[var(--beheer-accent)]/10 outline-none transition-all font-bold" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                        <div>
                            <label htmlFor="registration_deadline" className="block text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest mb-2">Inschrijfdeadline</label>
                            <input type="datetime-local" id="registration_deadline" name="registration_deadline" defaultValue={formatDateTime(event.registration_deadline)} className="w-full px-5 py-4 rounded-xl border border-[var(--beheer-border)] bg-[var(--beheer-card-soft)] text-[var(--beheer-text)] focus:border-[var(--beheer-accent)] focus:ring-4 focus:ring-[var(--beheer-accent)]/10 outline-none transition-all font-bold" />
                        </div>
                        <div>
                            <label htmlFor="location" className="block text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest mb-2">Locatie</label>
                            <input type="text" id="location" name="location" defaultValue={event.location || ''} className="w-full px-5 py-4 rounded-xl border border-[var(--beheer-border)] bg-[var(--beheer-card-soft)] text-[var(--beheer-text)] focus:border-[var(--beheer-accent)] focus:ring-4 focus:ring-[var(--beheer-accent)]/10 outline-none transition-all font-bold" placeholder="Bijv. Fontys R10" />
                        </div>
                    </div>

                    <div className="relative z-10">
                        <label htmlFor="description" className="block text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest mb-2">Beschrijving *</label>
                        <textarea id="description" name="description" rows={5} defaultValue={event.description} className={`w-full px-5 py-4 rounded-xl border bg-[var(--beheer-card-soft)] text-[var(--beheer-text)] ${formErrors.description ? 'border-red-500 ring-4 ring-red-500/10' : 'border-[var(--beheer-border)]'} focus:border-[var(--beheer-accent)] focus:ring-4 focus:ring-[var(--beheer-accent)]/10 outline-none transition-all font-medium resize-none text-[15px] leading-relaxed`} placeholder="Beschrijving van de activiteit" />
                        {formErrors.description && <p className="text-red-500 text-[10px] font-black uppercase tracking-widest mt-2">{formErrors.description[0]}</p>}
                    </div>

                    <div className="relative z-10">
                        <label htmlFor="description_logged_in" className="block text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest mb-2">Extra beschrijving (alleen ingelogd)</label>
                        <textarea id="description_logged_in" name="description_logged_in" rows={3} defaultValue={event.description_logged_in || ''} className="w-full px-5 py-4 rounded-xl border border-[var(--beheer-border)] bg-[var(--beheer-card-soft)] text-[var(--beheer-text)] focus:border-[var(--beheer-accent)] focus:ring-4 focus:ring-[var(--beheer-accent)]/10 outline-none transition-all font-medium resize-none text-[15px] leading-relaxed" />
                    </div>

                    {/* Capacity & Pricing */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                        <div>
                            <label htmlFor="max_sign_ups" className="block text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest mb-2">Capaciteit</label>
                            <input type="number" id="max_sign_ups" name="max_sign_ups" defaultValue={event.max_sign_ups || ''} min="0" className="w-full px-5 py-4 rounded-xl border border-[var(--beheer-border)] bg-[var(--beheer-card-soft)] text-[var(--beheer-text)] focus:border-[var(--beheer-accent)] focus:ring-4 focus:ring-[var(--beheer-accent)]/10 outline-none transition-all font-bold" placeholder="Max deelnemers" />
                        </div>
                        <div>
                            <label htmlFor="price_members" className="block text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest mb-2">Prijs Leden (€)</label>
                            <input type="number" id="price_members" name="price_members" defaultValue={event.price_members !== null && event.price_members !== undefined ? event.price_members : ''} min="0" step="0.01" className="w-full px-5 py-4 rounded-xl border border-[var(--beheer-border)] bg-[var(--beheer-card-soft)] text-[var(--beheer-text)] focus:border-[var(--beheer-accent)] focus:ring-4 focus:ring-[var(--beheer-accent)]/10 outline-none transition-all font-bold" placeholder="0.00" />
                        </div>
                        <div>
                            <label htmlFor="price_non_members" className="block text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest mb-2">Prijs Niet-leden (€)</label>
                            <input type="number" id="price_non_members" name="price_non_members" defaultValue={event.price_non_members !== null && event.price_non_members !== undefined ? event.price_non_members : ''} min="0" step="0.01" className="w-full px-5 py-4 rounded-xl border border-[var(--beheer-border)] bg-[var(--beheer-card-soft)] text-[var(--beheer-text)] focus:border-[var(--beheer-accent)] focus:ring-4 focus:ring-[var(--beheer-accent)]/10 outline-none transition-all font-bold" placeholder="0.00" />
                        </div>
                    </div>

                    {/* Committee & Contact */}
                    <div className="relative z-10">
                        <label htmlFor="committee_id" className="block text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest mb-2">Commissie</label>
                        <select id="committee_id" name="committee_id" defaultValue={event.committee_id || ''} className="w-full px-5 py-4 rounded-xl border border-[var(--beheer-border)] bg-[var(--beheer-card-soft)] text-[var(--beheer-text)] focus:border-[var(--beheer-accent)] focus:ring-4 focus:ring-[var(--beheer-accent)]/10 outline-none transition-all font-bold cursor-pointer">
                            <option value="">Selecteer een commissie...</option>
                            {committees.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div className="relative z-10">
                        <label htmlFor="contact" className="block text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest mb-2">Contact (email of telefoon)</label>
                        <input type="text" id="contact" name="contact" defaultValue={event.contact || ''} className="w-full px-5 py-4 rounded-xl border border-[var(--beheer-border)] bg-[var(--beheer-card-soft)] text-[var(--beheer-text)] focus:border-[var(--beheer-accent)] focus:ring-4 focus:ring-[var(--beheer-accent)]/10 outline-none transition-all font-bold" placeholder="naam@salvemundi.nl" />
                    </div>

                    {/* Image Upload */}
                    <div className="relative z-10">
                        <label className="block text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest mb-2">Afbeelding</label>
                        {!imagePreview ? (
                            <div onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-[var(--beheer-border)] rounded-[var(--beheer-radius)] cursor-pointer hover:border-[var(--beheer-accent)] hover:bg-[var(--beheer-accent)]/5 transition-all bg-[var(--beheer-card-soft)] group">
                                <Upload className="h-8 w-8 mb-3 text-[var(--beheer-text-muted)] group-hover:text-[var(--beheer-accent)] transition-colors" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--beheer-text-muted)] group-hover:text-[var(--beheer-accent)] transition-colors text-center px-4">Klik om een afbeelding te uploaden of wijzigen</span>
                                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                            </div>
                        ) : (
                            <div className="relative group overflow-hidden rounded-[var(--beheer-radius)] border border-[var(--beheer-border)] max-w-2xl">
                                <img src={imagePreview} alt="Preview" className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-700" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                    <button type="button" onClick={() => fileInputRef.current?.click()} className="bg-white text-slate-900 p-3 rounded-2xl hover:scale-110 transition shadow-xl cursor-pointer"><Upload className="h-5 w-5" /></button>
                                    <button type="button" onClick={handleRemoveImage} className="bg-red-500 text-white p-3 rounded-2xl hover:scale-110 transition shadow-xl cursor-pointer"><X className="h-5 w-5" /></button>
                                </div>
                                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                            </div>
                        )}
                    </div>

                    {/* Status & Options */}
                    <div className="border border-[var(--beheer-border)] rounded-[var(--beheer-radius)] p-8 space-y-6 bg-[var(--beheer-card-soft)] relative z-10">
                        <h3 className="text-sm font-black text-[var(--beheer-text)] uppercase tracking-tight">Publicatie Instellingen</h3>
                        <div className="space-y-4">
                            <label className="flex items-center gap-4 cursor-pointer group">
                                <div className="relative flex items-center justify-center">
                                    <input type="radio" value="published" checked={status === 'published'} onChange={() => setStatus('published')} className="peer sr-only" />
                                    <div className="w-6 h-6 border-2 border-[var(--beheer-border)] rounded-full peer-checked:border-[var(--beheer-accent)] peer-checked:bg-[var(--beheer-accent)] transition-all"></div>
                                    <div className="absolute w-2 h-2 bg-white rounded-full opacity-0 peer-checked:opacity-100 transition-opacity"></div>
                                </div>
                                <span className="text-[10px] font-black text-[var(--beheer-text-muted)] group-hover:text-[var(--beheer-text)] uppercase tracking-widest transition-colors">Direct publiceren</span>
                            </label>
                            <label className="flex items-center gap-4 cursor-pointer group">
                                <div className="relative flex items-center justify-center">
                                    <input type="radio" value="draft" checked={status === 'draft'} onChange={() => setStatus('draft')} className="peer sr-only" />
                                    <div className="w-6 h-6 border-2 border-[var(--beheer-border)] rounded-full peer-checked:border-[var(--beheer-accent)] peer-checked:bg-[var(--beheer-accent)] transition-all"></div>
                                    <div className="absolute w-2 h-2 bg-white rounded-full opacity-0 peer-checked:opacity-100 transition-opacity"></div>
                                </div>
                                <span className="text-[10px] font-black text-[var(--beheer-text-muted)] group-hover:text-[var(--beheer-text)] uppercase tracking-widest transition-colors">Concept opslaan</span>
                            </label>
                            <label className="flex items-start gap-4 cursor-pointer group">
                                <div className="relative flex items-center justify-center mt-1">
                                    <input type="radio" value="scheduled" checked={status === 'scheduled'} onChange={() => setStatus('scheduled')} className="peer sr-only" />
                                    <div className="w-6 h-6 border-2 border-[var(--beheer-border)] rounded-full peer-checked:border-[var(--beheer-accent)] peer-checked:bg-[var(--beheer-accent)] transition-all"></div>
                                    <div className="absolute w-2 h-2 bg-white rounded-full opacity-0 peer-checked:opacity-100 transition-opacity"></div>
                                </div>
                                <div className="flex-1">
                                    <span className="text-[10px] font-black text-[var(--beheer-text-muted)] group-hover:text-[var(--beheer-text)] uppercase tracking-widest transition-colors">Plannen voor later</span>
                                    {status === 'scheduled' && (
                                        <input type="datetime-local" name="publish_date" defaultValue={formatDateTime(event.publish_date)} className="mt-4 w-full px-5 py-4 rounded-xl border border-[var(--beheer-border)] bg-[var(--beheer-card-bg)] text-[var(--beheer-text)] focus:ring-4 focus:ring-[var(--beheer-accent)]/10 outline-none transition-all font-bold" />
                                    )}
                                </div>
                            </label>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 relative z-10 p-2">
                        <div className="relative flex items-center justify-center">
                            <input type="checkbox" id="only_members" checked={onlyMembers} onChange={(e) => setOnlyMembers(e.target.checked)} className="peer sr-only" />
                            <div className="w-6 h-6 border-2 border-[var(--beheer-border)] rounded peer-checked:border-[var(--beheer-accent)] peer-checked:bg-[var(--beheer-accent)] transition-all"></div>
                            <X className="absolute h-4 w-4 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                        </div>
                        <label htmlFor="only_members" className="text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest cursor-pointer hover:text-[var(--beheer-text)] transition-colors">Alleen voor leden</label>
                    </div>

                    {/* Submit */}
                    <div className="flex flex-col sm:flex-row gap-4 pt-6 relative z-10">
                        <button 
                            type="submit" 
                            disabled={optimisticSaving} 
                            className="flex-1 bg-[var(--beheer-accent)] text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-[var(--shadow-glow)] hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {optimisticSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                            <span>{optimisticSaving ? 'Opslaan...' : 'Wijzigingen Opslaan'}</span>
                        </button>
                        <button 
                            type="button" 
                            onClick={() => router.back()} 
                            className="px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-xs border border-[var(--beheer-border)] text-[var(--beheer-text)] hover:bg-[var(--beheer-card-soft)] transition-all cursor-pointer"
                        >
                            Annuleren
                        </button>
                    </div>
                </form>

                {/* Toast */}
                {toast && (
                    <div className="fixed bottom-10 right-10 z-[100] animate-in fade-in slide-in-from-bottom-8 duration-500">
                        <div className={`px-8 py-5 rounded-3xl shadow-2xl flex items-center gap-4 border-l-8 backdrop-blur-md ${toast.type === 'success' ? 'bg-[var(--beheer-card-bg)] border-emerald-500 text-[var(--beheer-text)]' : 'bg-[var(--beheer-card-bg)] border-red-500 text-[var(--beheer-text)]'}`}>
                            <div className={`h-10 w-10 rounded-2xl flex items-center justify-center font-black text-xl ${toast.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                {toast.type === 'success' ? '✓' : '!'}
                            </div>
                            <span className="font-black uppercase tracking-widest text-[10px]">{toast.message}</span>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
