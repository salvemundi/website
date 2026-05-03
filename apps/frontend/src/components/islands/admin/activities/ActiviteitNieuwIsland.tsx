'use client';

import { useState, useRef, useOptimistic, useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Upload, X, Loader2, Info, Calendar as CalendarIcon, MapPin, Users, Euro, Link as LinkIcon, Eye, Check } from 'lucide-react';
import { createActivityAction } from '@/server/actions/activiteiten/activities-write.actions';
import AdminToolbar from '@/components/ui/admin/AdminToolbar';
import AdminToast from '@/components/ui/admin/AdminToast';
import { useAdminToast } from '@/hooks/use-admin-toast';

function cleanCommitteeName(name: string): string {
    return name?.replace(/\s*(\|\||[-–—])\s*SALVE MUNDI\s*$/gi, '').trim() || '';
}

interface Committee {
    id: number;
    name: string;
}

interface ActionState {
    success: boolean;
    id?: number;
    error?: string;
    fieldErrors?: Record<string, string[]>;
    initialData?: Record<string, any>;
}

interface ActiviteitNieuwIslandProps {
    committees?: Committee[];
}

export default function ActiviteitNieuwIsland({ 
    committees = [], 
}: ActiviteitNieuwIslandProps) {
    const router = useRouter();
    const { toast, showToast, hideToast } = useAdminToast();
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    
    const [status, setStatus] = useState<'published' | 'draft' | 'scheduled'>('published');
    const [onlyMembers, setOnlyMembers] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [state, formAction, isPending] = useActionState<ActionState, FormData>(
        async (prevState: ActionState, formData: FormData) => {
            if (imageFile) formData.append('imageFile', imageFile);
            formData.set('status', status);
            formData.set('only_members', onlyMembers ? 'on' : 'off');

            const res = await createActivityAction(prevState, formData);
            return res as ActionState;
        }, 
        { success: false }
    );

    useEffect(() => {
        if (state.success && state.id) {
            showToast('Activiteit succesvol aangemaakt!', 'success');
            const timer = setTimeout(() => {
                router.push(`/beheer/activiteiten/${state.id}/bewerken`);
            }, 1000);
            return () => clearTimeout(timer);
        } else if (state.error) {
            showToast(state.error, 'error');
            
            // Sync stateful inputs if they were returned
            if (state.initialData) {
                if (state.initialData.status) setStatus(state.initialData.status);
                if (state.initialData.only_members) setOnlyMembers(state.initialData.only_members === 'on' || state.initialData.only_members === true);
            }
        }
    }, [state, showToast, router]);

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
        <div className="pb-20">
            <AdminToolbar 
                title="Nieuwe Activiteit"
                subtitle="Creëer een nieuwe activiteit voor SV Salve Mundi"
                backHref="/beheer/activiteiten"
            />
            <div className="container mx-auto px-4 py-8 max-w-6xl">
                <form action={formAction}>
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        {/* Main Content Area */}
                        <div className="lg:col-span-8 space-y-6">
                            {/* Section 1: Algemene Informatie */}
                            <div className="bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] shadow-xl border border-[var(--beheer-border)] overflow-hidden">
                                <div className="px-6 py-4 border-b border-[var(--beheer-border)] bg-[var(--beheer-card-soft)]/50 flex items-center gap-3">
                                    <Info className="h-4 w-4 text-[var(--beheer-accent)]" />
                                    <h2 className="text-[10px] font-black uppercase tracking-widest text-[var(--beheer-text)]">Algemene Informatie</h2>
                                </div>
                                <div className="p-6 space-y-6">
                                    <div className="relative z-10">
                                        <label htmlFor="name" className="block text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest mb-2">Naam van de activiteit *</label>
                                        <input
                                            type="text"
                                            id="name"
                                            name="name"
                                            autoComplete="off"
                                            suppressHydrationWarning
                                            className={`beheer-input ${formErrors.name ? 'border-red-500 ring-4 ring-red-500/10' : ''}`}
                                            placeholder="Bijv. Introductiebivak 2024"
                                            defaultValue={state.initialData?.name}
                                        />
                                        {formErrors.name && <p className="text-red-500 text-[10px] font-black uppercase tracking-widest mt-2">{formErrors.name[0]}</p>}
                                    </div>

                                    <div className="grid grid-cols-1 gap-6">
                                        <div>
                                            <label htmlFor="description" className="block text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest mb-2">Publieke Beschrijving *</label>
                                            <textarea id="description" name="description" rows={4} autoComplete="off" suppressHydrationWarning className={`beheer-input ${formErrors.description ? 'border-red-500 ring-4 ring-red-500/10' : ''}`} placeholder="Wat gaan we doen?" defaultValue={state.initialData?.description} />
                                            {formErrors.description && <p className="text-red-500 text-[10px] font-black uppercase tracking-widest mt-2">{formErrors.description[0]}</p>}
                                        </div>
                                        <div>
                                            <label htmlFor="description_logged_in" className="block text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest mb-2">Extra Informatie (alleen ingelogd)</label>
                                            <textarea id="description_logged_in" name="description_logged_in" rows={2} autoComplete="off" suppressHydrationWarning className="beheer-input" placeholder="Bijv. verzamelplek, wat mee te nemen..." defaultValue={state.initialData?.description_logged_in} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Planning & Locatie */}
                            <div className="bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] shadow-xl border border-[var(--beheer-border)] overflow-hidden">
                                <div className="px-6 py-4 border-b border-[var(--beheer-border)] bg-[var(--beheer-card-soft)]/50 flex items-center gap-3">
                                    <CalendarIcon className="h-4 w-4 text-[var(--beheer-accent)]" />
                                    <h2 className="text-[10px] font-black uppercase tracking-widest text-[var(--beheer-text)]">Planning & Locatie</h2>
                                </div>
                                <div className="p-6 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        <div>
                                            <label htmlFor="event_date" className="block text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest mb-2">Startdatum *</label>
                                            <input type="date" id="event_date" name="event_date" autoComplete="off" suppressHydrationWarning className={`beheer-input ${formErrors.event_date ? 'border-red-500' : ''}`} defaultValue={state.initialData?.event_date} />
                                            {formErrors.event_date && <p className="text-red-500 text-[10px] font-black uppercase tracking-widest mt-2">{formErrors.event_date[0]}</p>}
                                        </div>
                                        <div>
                                            <label htmlFor="event_time" className="block text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest mb-2">Tijd</label>
                                            <input type="time" id="event_time" name="event_time" autoComplete="off" suppressHydrationWarning className="beheer-input" defaultValue={state.initialData?.event_time} />
                                        </div>
                                        <div>
                                            <label htmlFor="event_date_end" className="block text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest mb-2">Einddatum</label>
                                            <input type="date" id="event_date_end" name="event_date_end" autoComplete="off" suppressHydrationWarning className="beheer-input" defaultValue={state.initialData?.event_date_end} />
                                        </div>
                                        <div>
                                            <label htmlFor="event_time_end" className="block text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest mb-2">Eindtijd</label>
                                            <input type="time" id="event_time_end" name="event_time_end" autoComplete="off" suppressHydrationWarning className="beheer-input" defaultValue={state.initialData?.event_time_end} />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="location" className="block text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest mb-2 flex items-center gap-2">
                                                <MapPin className="h-3 w-3" /> Locatie
                                            </label>
                                            <input type="text" id="location" name="location" autoComplete="off" suppressHydrationWarning className="beheer-input" placeholder="Bijv. Fontys R10" defaultValue={state.initialData?.location} />
                                        </div>
                                        <div>
                                            <label htmlFor="registration_deadline" className="block text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest mb-2">Inschrijfdeadline</label>
                                            <input type="datetime-local" id="registration_deadline" name="registration_deadline" autoComplete="off" suppressHydrationWarning className="beheer-input" defaultValue={state.initialData?.registration_deadline} />
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-[var(--beheer-border)]/50">
                                        <label htmlFor="custom_url" className="block text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest mb-2 flex items-center gap-2">
                                            <LinkIcon className="h-3 w-3" /> Custom Redirect URL (optioneel)
                                        </label>
                                        <input type="text" id="custom_url" name="custom_url" autoComplete="off" suppressHydrationWarning className="beheer-input" placeholder="bijv. https://forms.gle/..." defaultValue={state.initialData?.custom_url} />
                                    </div>
                                </div>
                            </div>

                            {/* Section 3: Kosten & Capaciteit */}
                            <div className="bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] shadow-xl border border-[var(--beheer-border)] overflow-hidden">
                                <div className="px-6 py-4 border-b border-[var(--beheer-border)] bg-[var(--beheer-card-soft)]/50 flex items-center gap-3">
                                    <Euro className="h-4 w-4 text-[var(--beheer-accent)]" />
                                    <h2 className="text-[10px] font-black uppercase tracking-widest text-[var(--beheer-text)]">Kosten & Capaciteit</h2>
                                </div>
                                <div className="p-6 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label htmlFor="max_sign_ups" className="block text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest mb-2">Max. Deelnemers</label>
                                            <input type="number" id="max_sign_ups" name="max_sign_ups" min="0" autoComplete="off" suppressHydrationWarning className="beheer-input" placeholder="Onbeperkt" defaultValue={state.initialData?.max_sign_ups} />
                                        </div>
                                        <div>
                                            <label htmlFor="price_members" className="block text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest mb-2">Leden (€)</label>
                                            <input type="number" id="price_members" name="price_members" min="0" step="0.01" autoComplete="off" suppressHydrationWarning className="beheer-input" placeholder="0.00" defaultValue={state.initialData?.price_members} />
                                        </div>
                                        <div>
                                            <label htmlFor="price_non_members" className="block text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest mb-2">Niet-leden (€)</label>
                                            <input type="number" id="price_non_members" name="price_non_members" min="0" step="0.01" autoComplete="off" suppressHydrationWarning className="beheer-input" placeholder="0.00" defaultValue={state.initialData?.price_non_members} />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-[var(--beheer-border)]/50 pt-6">
                                        <div>
                                            <label htmlFor="committee_id" className="block text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest mb-2">Organiserende Commissie</label>
                                            <select id="committee_id" name="committee_id" autoComplete="off" suppressHydrationWarning className="beheer-select" defaultValue={state.initialData?.committee_id}>
                                                <option value="">Geen (Algemeen)</option>
                                                {committees.map(c => <option key={c.id} value={c.id}>{cleanCommitteeName(c.name)}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label htmlFor="contact" className="block text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest mb-2">Contactpersoon (e-mail)</label>
                                            <input type="email" id="contact" name="contact" autoComplete="off" suppressHydrationWarning className="beheer-input" placeholder="naam@salvemundi.nl" defaultValue={state.initialData?.contact} />
                                        </div>
                                    </div>

                                    <label className="relative flex items-center gap-4 bg-[var(--beheer-card-soft)]/50 p-4 rounded-2xl border border-[var(--beheer-border)]/50 cursor-pointer group z-10">
                                        <div className="relative flex items-center justify-center">
                                            <input type="checkbox" id="only_members" checked={onlyMembers} onChange={(e) => setOnlyMembers(e.target.checked)} className="peer sr-only" />
                                            <div className="w-5 h-5 border-2 border-[var(--beheer-border)] rounded peer-checked:border-[var(--beheer-accent)] peer-checked:bg-[var(--beheer-accent)] transition-all"></div>
                                            <Check className="absolute h-3 w-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                                        </div>
                                        <span className="text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest group-hover:text-[var(--beheer-text)] transition-colors">Alleen toegankelijk voor leden</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-8">
                            {/* Banner Section */}
                            <div className="bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] shadow-xl border border-[var(--beheer-border)] overflow-hidden">
                                <div className="px-6 py-4 border-b border-[var(--beheer-border)] bg-[var(--beheer-card-soft)]/50 flex items-center gap-3">
                                    <Upload className="h-4 w-4 text-[var(--beheer-accent)]" />
                                    <h2 className="text-[10px] font-black uppercase tracking-widest text-[var(--beheer-text)]">Banner</h2>
                                </div>
                                <div className="p-4">
                                    {!imagePreview ? (
                                        <div onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center justify-center w-full min-h-[160px] border-2 border-dashed border-[var(--beheer-border)] rounded-xl cursor-pointer hover:border-[var(--beheer-accent)] hover:bg-[var(--beheer-accent)]/5 transition-all bg-[var(--beheer-card-soft)] group">
                                            <Upload className="h-6 w-6 mb-2 text-[var(--beheer-text-muted)] group-hover:text-[var(--beheer-accent)] transition-colors" />
                                            <span className="text-[9px] font-black uppercase tracking-widest text-[var(--beheer-text-muted)] group-hover:text-[var(--beheer-accent)] text-center px-4">Upload banner</span>
                                            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                                        </div>
                                    ) : (
                                        <div className="relative group overflow-hidden rounded-xl border border-[var(--beheer-border)] bg-[var(--beheer-card-soft)]/50 h-[160px] flex items-center justify-center">
                                            <img src={imagePreview} alt="Preview" className="w-full h-full object-contain transition-transform duration-700" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                                <button type="button" onClick={() => fileInputRef.current?.click()} className="bg-white text-slate-900 p-2.5 rounded-xl hover:scale-110 transition shadow-xl cursor-pointer"><Upload className="h-4 w-4" /></button>
                                                <button type="button" onClick={handleRemoveImage} className="bg-red-500 text-white p-2.5 rounded-xl hover:scale-110 transition shadow-xl cursor-pointer"><X className="h-4 w-4" /></button>
                                            </div>
                                            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Status Section */}
                            <div className="bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] shadow-xl border border-[var(--beheer-border)] overflow-hidden">
                                <div className="px-6 py-4 border-b border-[var(--beheer-border)] bg-[var(--beheer-card-soft)]/50 flex items-center gap-3">
                                    <Eye className="h-4 w-4 text-[var(--beheer-accent)]" />
                                    <h2 className="text-[10px] font-black uppercase tracking-widest text-[var(--beheer-text)]">Status</h2>
                                </div>
                                <div className="p-6 space-y-4">
                                    <label className="relative flex items-center gap-4 cursor-pointer group z-10">
                                        <div className="relative flex items-center justify-center">
                                            <input type="radio" value="published" checked={status === 'published'} onChange={() => setStatus('published')} className="peer sr-only" />
                                            <div className="w-5 h-5 border-2 border-[var(--beheer-border)] rounded-full peer-checked:border-[var(--beheer-accent)] peer-checked:bg-[var(--beheer-accent)] transition-all"></div>
                                            <div className="absolute w-1.5 h-1.5 bg-white rounded-full opacity-0 peer-checked:opacity-100 transition-opacity"></div>
                                        </div>
                                        <span className="text-[10px] font-black text-[var(--beheer-text-muted)] group-hover:text-[var(--beheer-text)] uppercase tracking-widest transition-colors">Gepubliceerd</span>
                                    </label>
                                    <label className="relative flex items-center gap-4 cursor-pointer group z-10">
                                        <div className="relative flex items-center justify-center">
                                            <input type="radio" value="draft" checked={status === 'draft'} onChange={() => setStatus('draft')} className="peer sr-only" />
                                            <div className="w-5 h-5 border-2 border-[var(--beheer-border)] rounded-full peer-checked:border-[var(--beheer-accent)] peer-checked:bg-[var(--beheer-accent)] transition-all"></div>
                                            <div className="absolute w-1.5 h-1.5 bg-white rounded-full opacity-0 peer-checked:opacity-100 transition-opacity"></div>
                                        </div>
                                        <span className="text-[10px] font-black text-[var(--beheer-text-muted)] group-hover:text-[var(--beheer-text)] uppercase tracking-widest transition-colors">Concept</span>
                                    </label>
                                    <label className="relative flex items-start gap-4 cursor-pointer group z-10">
                                        <div className="relative flex items-center justify-center mt-0.5">
                                            <input type="radio" value="scheduled" checked={status === 'scheduled'} onChange={() => setStatus('scheduled')} className="peer sr-only" />
                                            <div className="w-5 h-5 border-2 border-[var(--beheer-border)] rounded-full peer-checked:border-[var(--beheer-accent)] peer-checked:bg-[var(--beheer-accent)] transition-all"></div>
                                            <div className="absolute w-1.5 h-1.5 bg-white rounded-full opacity-0 peer-checked:opacity-100 transition-opacity"></div>
                                        </div>
                                        <div className="flex-1">
                                            <span className="text-[10px] font-black text-[var(--beheer-text-muted)] group-hover:text-[var(--beheer-text)] uppercase tracking-widest transition-colors">Inplannen</span>
                                            {status === 'scheduled' && (
                                                <div className="mt-2 animate-in slide-in-from-top-2 duration-300">
                                                    <input type="datetime-local" name="publish_date" autoComplete="off" suppressHydrationWarning className="beheer-input text-[10px] py-2" defaultValue={state.initialData?.publish_date} />
                                                </div>
                                            )}
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="space-y-3">
                                <button 
                                    type="submit" 
                                    disabled={optimisticSaving} 
                                    className="w-full bg-[var(--beheer-accent)] text-white px-8 py-4 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 group border border-white/10"
                                >
                                    {optimisticSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 group-hover:scale-110 transition-transform" />}
                                    <span>{optimisticSaving ? 'Bezig...' : 'Activiteit Aanmaken'}</span>
                                </button>
                                
                                <button 
                                    type="button" 
                                    onClick={() => router.back()} 
                                    className="w-full px-8 py-4 rounded-xl font-black uppercase tracking-widest text-[10px] border border-[var(--beheer-border)] text-[var(--beheer-text)] hover:bg-[var(--beheer-card-soft)] transition-all cursor-pointer"
                                >
                                    Annuleren
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
            <AdminToast toast={toast} onClose={hideToast} />
        </div>
    );
}
