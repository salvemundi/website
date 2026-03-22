'use client';

import { useState, useRef, useOptimistic, useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Upload, X, Loader2, Calendar, Clock, MapPin, Users, Euro, Mail, Image as ImageIcon } from 'lucide-react';
import { createActivityAction } from '@/server/actions/activiteiten.actions';

interface Committee {
    id: number;
    name: string;
}

interface ActionState {
    success: boolean;
    id?: number;
    error?: string;
    fieldErrors?: Record<string, string[]>;
}

export default function ActiviteitNieuwIsland({ committees }: { committees: Committee[] }) {
    const router = useRouter();
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    
    // Status states
    const [status, setStatus] = useState<'published' | 'draft' | 'scheduled'>('published');
    const [onlyMembers, setOnlyMembers] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 5000);
    };

    // React 19 useActionState
    const [state, formAction, isPending] = useActionState<ActionState, FormData>(
        async (prevState: ActionState, formData: FormData) => {
            if (imageFile) formData.append('imageFile', imageFile);
            formData.set('status', status);
            formData.set('only_members', onlyMembers ? 'on' : 'off');

            const res = await createActivityAction(prevState, formData);
            
            if (res.success && res.id) {
                showToast('Activiteit succesvol aangemaakt!', 'success');
                // Redirect after a short delay
                setTimeout(() => {
                    router.push(`/beheer/activiteiten/${res.id}/bewerken`);
                }, 1000);
            } else if (!res.success) {
                showToast(res.error || 'Er is een fout opgetreden', 'error');
            }
            
            return res as ActionState;
        }, 
        { success: false }
    );

    // Optimistic UI for the saving state
    const [optimisticSaving, setOptimisticSaving] = useOptimistic(isPending);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = () => {
        setImageFile(null);
        setImagePreview(null);
    };

    const formErrors = state.fieldErrors || {};

    return (
        <div className="container mx-auto px-4 py-8 max-w-5xl">
            {/* Header Area */}
            <div className="flex items-center justify-between mb-8">
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 transition-colors font-semibold py-2 cursor-pointer"
                >
                    <ArrowLeft className="h-5 w-5" />
                    Terug naar overzicht
                </button>
            </div>

            <form action={formAction} className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden ring-1 ring-slate-200 dark:ring-slate-700/50">
                {/* Visual Section */}
                <div className="relative h-64 sm:h-80 bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                    {imagePreview ? (
                        <div className="relative h-full w-full group">
                            <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                <button type="button" onClick={() => fileInputRef.current?.click()} className="bg-white text-slate-900 p-3 rounded-full hover:scale-110 transition shadow-xl cursor-pointer"><Upload className="h-6 w-6" /></button>
                                <button type="button" onClick={handleRemoveImage} className="bg-red-500 text-white p-3 rounded-full hover:scale-110 transition shadow-xl cursor-pointer"><X className="h-6 w-6" /></button>
                            </div>
                        </div>
                    ) : (
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="h-full w-full flex flex-col items-center justify-center cursor-pointer hover:bg-slate-800/80 transition-colors border-2 border-dashed border-slate-700/50 m-4 rounded-2xl"
                        >
                            <div className="p-4 bg-slate-800 rounded-2xl mb-4 group-hover:scale-110 transition-transform shadow-lg">
                                <ImageIcon className="h-10 w-10 text-slate-400" />
                            </div>
                            <span className="text-slate-400 font-bold text-lg">Voeg een omslagafbeelding toe</span>
                            <span className="text-slate-500 text-sm mt-1">Aanbevolen: 16:9 aspect ratio</span>
                        </div>
                    )}
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </div>

                <div className="p-8 space-y-10">
                    {/* Basic Information */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg text-primary"><ImageIcon className="h-5 w-5" /></div>
                            <h2 className="text-xl font-bold dark:text-white">Basis Informatie</h2>
                        </div>
                        
                        <div className="space-y-4">
                            <label htmlFor="name" className="block text-sm font-bold text-slate-600 dark:text-slate-400">Naam van de activiteit *</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                autoComplete="off"
                                className={`w-full px-5 py-4 rounded-xl border bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white text-lg font-medium ${formErrors.name ? 'border-red-500 ring-4 ring-red-500/10' : 'border-slate-200 dark:border-slate-700'} focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all shadow-sm`}
                                placeholder="Bijv. Introductiebivak 2024"
                            />
                            {formErrors.name && <p className="text-red-500 text-sm font-bold flex items-center gap-1"><X className="h-3 w-3" /> {formErrors.name[0]}</p>}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <label htmlFor="description" className="block text-sm font-bold text-slate-600 dark:text-slate-400">Beschrijving *</label>
                                <textarea
                                    id="description"
                                    name="description"
                                    rows={5}
                                    className={`w-full px-5 py-4 rounded-xl border bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white ${formErrors.description ? 'border-red-500 ring-4 ring-red-500/10' : 'border-slate-200 dark:border-slate-700'} focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all shadow-sm resize-none`}
                                    placeholder="Wat gaan we doen?"
                                />
                                {formErrors.description && <p className="text-red-500 text-sm font-bold flex items-center gap-1"><X className="h-3 w-3" /> {formErrors.description[0]}</p>}
                            </div>
                            <div className="space-y-4">
                                <label htmlFor="description_logged_in" className="block text-sm font-bold text-slate-600 dark:text-slate-400">Exclusieve info (alleen ingelogd)</label>
                                <textarea
                                    id="description_logged_in"
                                    name="description_logged_in"
                                    rows={5}
                                    className="w-full px-5 py-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all shadow-sm resize-none"
                                    placeholder="Details zoals verzamelplek of geheime agenda..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Logistics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500"><Calendar className="h-5 w-5" /></div>
                                <h2 className="text-lg font-bold dark:text-white">Datum & Tijd</h2>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label htmlFor="event_date" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Startdatum *</label>
                                    <input type="date" id="event_date" name="event_date" className={`w-full px-4 py-3 rounded-lg border bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white ${formErrors.event_date ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} focus:border-primary outline-none transition`} />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="event_time" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Starttijd</label>
                                    <input type="time" id="event_time" name="event_time" className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:border-primary outline-none transition" />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="event_date_end" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Einddatum</label>
                                    <input type="date" id="event_date_end" name="event_date_end" className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:border-primary outline-none transition" />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="event_time_end" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Eindtijd</label>
                                    <input type="time" id="event_time_end" name="event_time_end" className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:border-primary outline-none transition" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500"><MapPin className="h-5 w-5" /></div>
                                <h2 className="text-lg font-bold dark:text-white">Locatie & Contact</h2>
                            </div>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label htmlFor="location" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Locatie</label>
                                    <input type="text" id="location" name="location" className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 focus:border-primary outline-none transition" placeholder="Bijv. Fontys R10 of Eindhoven Centrum" />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="contact" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Contactpersoon (E-mail)</label>
                                    <input type="email" id="contact" name="contact" className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 focus:border-primary outline-none transition" placeholder="naam@salvemundi.nl" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Registration & Pricing */}
                    <div className="bg-slate-50 dark:bg-slate-900/30 rounded-3xl p-8 space-y-8 border border-slate-100 dark:border-slate-700/50">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500"><Euro className="h-5 w-5" /></div>
                            <h2 className="text-lg font-bold dark:text-white">Aanmelding & Prijs</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label htmlFor="max_sign_ups" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Max Deelnemers</label>
                                <div className="relative">
                                    <Users className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <input type="number" id="max_sign_ups" name="max_sign_ups" className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-primary outline-none transition" placeholder="Onbeperkt" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="price_members" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Prijs Leden</label>
                                <div className="relative">
                                    <Euro className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <input type="number" step="0.01" id="price_members" name="price_members" className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-primary outline-none transition" placeholder="0.00" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="price_non_members" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Prijs Niet-leden</label>
                                <div className="relative">
                                    <Euro className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <input type="number" step="0.01" id="price_non_members" name="price_non_members" className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-primary outline-none transition" placeholder="0.00" />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label htmlFor="registration_deadline" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Inschrijfdeadline</label>
                                <input type="datetime-local" id="registration_deadline" name="registration_deadline" className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-primary outline-none transition" />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="committee_id" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Verantwoordelijke Commissie</label>
                                <select id="committee_id" name="committee_id" className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-primary outline-none transition cursor-pointer">
                                    <option value="">Geen commissie</option>
                                    {committees.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="pt-4 flex items-center gap-3">
                            <input 
                                type="checkbox" 
                                id="only_members" 
                                checked={onlyMembers} 
                                onChange={(e) => setOnlyMembers(e.target.checked)}
                                className="w-6 h-6 rounded-lg text-primary border-slate-300 dark:border-slate-600 focus:ring-primary/20 transition-all cursor-pointer"
                            />
                            <label htmlFor="only_members" className="font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none">Deze activiteit is ALLEEN voor leden</label>
                        </div>
                    </div>

                    {/* Publication Settings */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-500/10 rounded-lg text-slate-500"><Clock className="h-5 w-5" /></div>
                            <h2 className="text-lg font-bold dark:text-white">Publicatie Instellingen</h2>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <button 
                                type="button"
                                onClick={() => setStatus('published')}
                                className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${status === 'published' ? 'border-primary bg-primary/5 ring-4 ring-primary/10' : 'border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600'}`}
                            >
                                <div className={`h-3 w-3 rounded-full mb-3 ${status === 'published' ? 'bg-primary animate-pulse' : 'bg-slate-300'}`} />
                                <span className="block font-bold dark:text-white">Direct publiceren</span>
                                <span className="text-xs text-slate-500 mt-1 block">Zichtbaar voor iedereen</span>
                            </button>
                            <button 
                                type="button"
                                onClick={() => setStatus('draft')}
                                className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${status === 'draft' ? 'border-primary bg-primary/5 ring-4 ring-primary/10' : 'border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600'}`}
                            >
                                <div className={`h-3 w-3 rounded-full mb-3 ${status === 'draft' ? 'bg-primary' : 'bg-slate-300'}`} />
                                <span className="block font-bold dark:text-white">Opslaan als concept</span>
                                <span className="text-xs text-slate-500 mt-1 block">Alleen zichtbaar in beheer</span>
                            </button>
                            <button 
                                type="button"
                                onClick={() => setStatus('scheduled')}
                                className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${status === 'scheduled' ? 'border-primary bg-primary/5 ring-4 ring-primary/10' : 'border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600'}`}
                            >
                                <div className={`h-3 w-3 rounded-full mb-3 ${status === 'scheduled' ? 'bg-primary' : 'bg-slate-300'}`} />
                                <span className="block font-bold dark:text-white">Inplannen</span>
                                <span className="text-xs text-slate-500 mt-1 block">Publiceren op een later moment</span>
                            </button>
                        </div>

                        {status === 'scheduled' && (
                            <div className="animate-in fade-in slide-in-from-top-2 duration-300 bg-primary/5 p-6 rounded-2xl border border-primary/20 space-y-3">
                                <label htmlFor="publish_date" className="block text-sm font-bold text-primary">Publicatiedatum & Tijd *</label>
                                <input type="datetime-local" id="publish_date" name="publish_date" className="w-full px-4 py-3 rounded-xl border border-primary/20 bg-white dark:bg-slate-900 outline-none focus:ring-4 focus:ring-primary/10 transition-all font-medium" />
                                <p className="text-xs text-slate-500">De activiteit zal automatisch op "published" worden gezet op dit tijdstip.</p>
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="flex flex-wrap items-center justify-end gap-4 pt-10 border-t border-slate-100 dark:border-slate-700/50">
                        <button 
                            type="button" 
                            onClick={() => router.back()} 
                            className="px-8 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                        >
                            Annuleren
                        </button>
                        <button 
                            type="submit" 
                            disabled={optimisticSaving}
                            className="px-10 py-4 bg-primary text-white rounded-2xl font-bold shadow-xl shadow-primary/20 hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-3 disabled:opacity-70 disabled:grayscale disabled:cursor-not-allowed cursor-pointer"
                        >
                            {optimisticSaving ? <Loader2 className="h-6 w-6 animate-spin" /> : <Save className="h-6 w-6" />}
                            {optimisticSaving ? 'Activiteit wordt aangemaakt...' : 'Activiteit Aanmaken'}
                        </button>
                    </div>
                </div>
            </form>

            {/* Premium Toast System */}
            {toast && (
                <div className="fixed bottom-8 right-8 z-50 animate-in fade-in slide-in-from-right-8 duration-500">
                    <div className={`px-8 py-5 rounded-3xl shadow-2xl flex items-center gap-4 backdrop-blur-md border ${toast.type === 'success' ? 'bg-green-500/90 border-green-400 text-white' : 'bg-red-500/90 border-red-400 text-white'}`}>
                        <div className="h-10 w-10 rounded-2xl bg-white/20 flex items-center justify-center font-bold text-xl">
                            {toast.type === 'success' ? '✓' : '!'}
                        </div>
                        <span className="font-bold text-lg">{toast.message}</span>
                    </div>
                </div>
            )}
        </div>
    );
}
