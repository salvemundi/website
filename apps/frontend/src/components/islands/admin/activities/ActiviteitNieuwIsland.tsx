'use client';

import { useState, useRef, useOptimistic, useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
    Image as ImageIcon, 
    Users, 
    Euro, 
    Save, 
    Upload, 
    X, 
    Loader2 
} from 'lucide-react';
import { createActivityAction } from '@/server/actions/activiteiten.actions';
import AdminToolbar from '@/components/ui/admin/AdminToolbar';
import AdminToast from '@/components/ui/admin/AdminToast';
import { useAdminToast } from '@/hooks/use-admin-toast';

// Clean committee names (removed || SV Salve Mundi and other suffixes)
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
}

export default function ActiviteitNieuwIsland({ committees }: { committees: Committee[] }) {
    const router = useRouter();
    const { toast, showToast, hideToast } = useAdminToast();
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    
    // Status states
    const [status, setStatus] = useState<'published' | 'draft' | 'scheduled'>('published');
    const [onlyMembers, setOnlyMembers] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    // React 19 useActionState
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

    // Effect to handle state changes (toasts and redirects)
    useEffect(() => {
        if (state.success && state.id) {
            showToast('Activiteit succesvol aangemaakt!', 'success');
            const timer = setTimeout(() => {
                router.push(`/beheer/activiteiten/${state.id}/bewerken`);
            }, 1000);
            return () => clearTimeout(timer);
        } else if (state.error) {
            showToast(state.error, 'error');
        }
    }, [state, showToast, router]);

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
        <>
            <AdminToolbar 
                title="Nieuwe Activiteit"
                subtitle="Creëer een nieuw evenement voor SV Salve Mundi"
                backHref="/beheer/activiteiten"
            />
            <div className="container mx-auto px-4 py-12 max-w-5xl animate-in fade-in slide-in-from-bottom-4 duration-700">
                <form action={formAction} className="bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] shadow-2xl overflow-hidden border border-[var(--beheer-border)] relative">
                    {/* Visual Section */}
                    <div className="relative h-64 sm:h-80 bg-slate-950 border-b border-[var(--beheer-border)]">
                        {imagePreview ? (
                            <div className="relative h-full w-full group">
                                <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                    <button type="button" onClick={() => fileInputRef.current?.click()} className="bg-white text-slate-900 p-3 rounded-2xl hover:scale-110 transition shadow-xl cursor-pointer"><Upload className="h-6 w-6" /></button>
                                    <button type="button" onClick={handleRemoveImage} className="bg-red-500 text-white p-3 rounded-2xl hover:scale-110 transition shadow-xl cursor-pointer"><X className="h-6 w-6" /></button>
                                </div>
                            </div>
                        ) : (
                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                className="h-full w-full flex flex-col items-center justify-center cursor-pointer hover:bg-slate-900/80 transition-all border-2 border-dashed border-[var(--beheer-border)] m-4 rounded-[var(--beheer-radius)] bg-[var(--beheer-card-soft)]/20 group"
                            >
                                <div className="p-5 bg-[var(--beheer-card-soft)] rounded-2xl mb-4 group-hover:scale-110 group-hover:bg-[var(--beheer-accent)]/10 transition-all shadow-lg">
                                    <ImageIcon className="h-10 w-10 text-[var(--beheer-text-muted)] group-hover:text-[var(--beheer-accent)]" />
                                </div>
                                <span className="text-[var(--beheer-text-muted)] font-black uppercase tracking-widest text-xs">Voeg een omslagafbeelding toe</span>
                            </div>
                        )}
                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                    </div>

                    <div className="p-8 sm:p-12 space-y-12">
                        {/* Basic Information */}
                        <div className="space-y-8">
                            <div className="flex items-center gap-3 border-l-4 border-[var(--beheer-accent)] pl-4">
                                <h2 className="text-xl font-black text-[var(--beheer-text)] uppercase tracking-tight">Basis Informatie</h2>
                            </div>
                            
                            <div className="space-y-3">
                                <label htmlFor="name" className="block text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest">Naam van de activiteit *</label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    autoComplete="off"
                                    suppressHydrationWarning
                                    className={`w-full px-5 py-4 rounded-xl border bg-[var(--beheer-card-soft)] text-[var(--beheer-text)] text-lg font-bold ${formErrors.name ? 'border-red-500 ring-4 ring-red-500/10' : 'border-[var(--beheer-border)]'} focus:border-[var(--beheer-accent)] focus:ring-4 focus:ring-[var(--beheer-accent)]/10 outline-none transition-all shadow-sm`}
                                    placeholder="Bijv. Introductiebivak 2024"
                                />
                                {formErrors.name && <p className="text-red-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><X className="h-3 w-3" /> {formErrors.name[0]}</p>}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label htmlFor="description" className="block text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest">Beschrijving *</label>
                                    <textarea
                                        id="description"
                                        name="description"
                                        rows={6}
                                        autoComplete="off"
                                        suppressHydrationWarning
                                        className={`w-full px-5 py-4 rounded-xl border bg-[var(--beheer-card-soft)] text-[var(--beheer-text)] ${formErrors.description ? 'border-red-500 ring-4 ring-red-500/10' : 'border-[var(--beheer-border)]'} focus:border-[var(--beheer-accent)] focus:ring-4 focus:ring-[var(--beheer-accent)]/10 outline-none transition-all shadow-sm resize-none text-[15px] leading-relaxed font-medium`}
                                        placeholder="Wat gaan we doen?"
                                    />
                                    {formErrors.description && <p className="text-red-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><X className="h-3 w-3" /> {formErrors.description[0]}</p>}
                                </div>
                                <div className="space-y-3">
                                    <label htmlFor="description_logged_in" className="block text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest">Exclusieve info (alleen ingelogd)</label>
                                    <textarea
                                        id="description_logged_in"
                                        name="description_logged_in"
                                        rows={6}
                                        autoComplete="off"
                                        suppressHydrationWarning
                                        className="w-full px-5 py-4 rounded-xl border border-[var(--beheer-border)] bg-[var(--beheer-card-soft)] text-[var(--beheer-text)] focus:border-[var(--beheer-accent)] focus:ring-4 focus:ring-[var(--beheer-accent)]/10 outline-none transition-all shadow-sm resize-none text-[15px] leading-relaxed font-medium"
                                        placeholder="Details zoals verzamelplek of geheime agenda..."
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Logistics */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-4">
                            <div className="space-y-8">
                                <div className="flex items-center gap-3 border-l-4 border-blue-500 pl-4">
                                    <h2 className="text-xl font-black text-[var(--beheer-text)] uppercase tracking-tight">Datum & Tijd</h2>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <label htmlFor="event_date" className="text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest">Startdatum *</label>
                                        <input type="date" id="event_date" name="event_date" autoComplete="off" suppressHydrationWarning className={`w-full px-4 py-3 rounded-xl border bg-[var(--beheer-card-soft)] text-[var(--beheer-text)] font-bold ${formErrors.event_date ? 'border-red-500' : 'border-[var(--beheer-border)]'} focus:border-[var(--beheer-accent)] focus:ring-2 focus:ring-[var(--beheer-accent)]/10 outline-none transition-all`} />
                                    </div>
                                    <div className="space-y-3">
                                        <label htmlFor="event_time" className="text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest">Starttijd</label>
                                        <input type="time" id="event_time" name="event_time" autoComplete="off" suppressHydrationWarning className="w-full px-4 py-3 rounded-xl border border-[var(--beheer-border)] bg-[var(--beheer-card-soft)] text-[var(--beheer-text)] font-bold focus:border-[var(--beheer-accent)] focus:ring-2 focus:ring-[var(--beheer-accent)]/10 outline-none transition-all" />
                                    </div>
                                    <div className="space-y-3">
                                        <label htmlFor="event_date_end" className="text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest">Einddatum</label>
                                        <input type="date" id="event_date_end" name="event_date_end" autoComplete="off" suppressHydrationWarning className="w-full px-4 py-3 rounded-xl border border-[var(--beheer-border)] bg-[var(--beheer-card-soft)] text-[var(--beheer-text)] font-bold focus:border-[var(--beheer-accent)] focus:ring-2 focus:ring-[var(--beheer-accent)]/10 outline-none transition-all" />
                                    </div>
                                    <div className="space-y-3">
                                        <label htmlFor="event_time_end" className="text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest">Eindtijd</label>
                                        <input type="time" id="event_time_end" name="event_time_end" autoComplete="off" suppressHydrationWarning className="w-full px-4 py-3 rounded-xl border border-[var(--beheer-border)] bg-[var(--beheer-card-soft)] text-[var(--beheer-text)] font-bold focus:border-[var(--beheer-accent)] focus:ring-2 focus:ring-[var(--beheer-accent)]/10 outline-none transition-all" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-8">
                                <div className="flex items-center gap-3 border-l-4 border-emerald-500 pl-4">
                                    <h2 className="text-xl font-black text-[var(--beheer-text)] uppercase tracking-tight">Locatie & Contact</h2>
                                </div>
                                <div className="space-y-6">
                                    <div className="space-y-3">
                                        <label htmlFor="location" className="text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest">Locatie</label>
                                        <input type="text" id="location" name="location" autoComplete="off" suppressHydrationWarning className="w-full px-4 py-4 rounded-xl border border-[var(--beheer-border)] bg-[var(--beheer-card-soft)] text-[var(--beheer-text)] font-bold focus:border-[var(--beheer-accent)] outline-none transition-all" placeholder="Bijv. Fontys R10 of Eindhoven Centrum" />
                                    </div>
                                    <div className="space-y-3">
                                        <label htmlFor="contact" className="text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest">Contactpersoon (E-mail)</label>
                                        <input type="email" id="contact" name="contact" autoComplete="off" suppressHydrationWarning className="w-full px-4 py-4 rounded-xl border border-[var(--beheer-border)] bg-[var(--beheer-card-soft)] text-[var(--beheer-text)] font-bold focus:border-[var(--beheer-accent)] outline-none transition-all" placeholder="naam@salvemundi.nl" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Registration & Pricing */}
                        <div className="bg-[var(--beheer-card-soft)]/30 rounded-[var(--beheer-radius)] p-8 sm:p-10 space-y-10 border border-[var(--beheer-border)]">
                            <div className="flex items-center gap-3 border-l-4 border-amber-500 pl-4">
                                <h2 className="text-xl font-black text-[var(--beheer-text)] uppercase tracking-tight">Aanmelding & Prijs</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="space-y-3">
                                    <label htmlFor="max_sign_ups" className="text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest">Max Deelnemers</label>
                                    <div className="relative">
                                        <Users className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--beheer-text-muted)]" />
                                        <input type="number" id="max_sign_ups" name="max_sign_ups" autoComplete="off" suppressHydrationWarning className="w-full pl-11 pr-4 py-4 rounded-xl border border-[var(--beheer-border)] bg-[var(--beheer-card-bg)] text-[var(--beheer-text)] font-bold focus:border-[var(--beheer-accent)] outline-none transition-all placeholder:font-medium" placeholder="Onbeperkt" />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label htmlFor="price_members" className="text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest">Prijs Leden (€)</label>
                                    <div className="relative">
                                        <Euro className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--beheer-text-muted)]" />
                                        <input type="number" step="0.01" id="price_members" name="price_members" autoComplete="off" suppressHydrationWarning className="w-full pl-11 pr-4 py-4 rounded-xl border border-[var(--beheer-border)] bg-[var(--beheer-card-bg)] text-[var(--beheer-text)] font-bold focus:border-[var(--beheer-accent)] outline-none transition-all" placeholder="0.00" />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label htmlFor="price_non_members" className="text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest">Prijs Niet-leden (€)</label>
                                    <div className="relative">
                                        <Euro className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--beheer-text-muted)]" />
                                        <input type="number" step="0.01" id="price_non_members" name="price_non_members" autoComplete="off" suppressHydrationWarning className="w-full pl-11 pr-4 py-4 rounded-xl border border-[var(--beheer-border)] bg-[var(--beheer-card-bg)] text-[var(--beheer-text)] font-bold focus:border-[var(--beheer-accent)] outline-none transition-all" placeholder="0.00" />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label htmlFor="registration_deadline" className="text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest">Inschrijfdeadline</label>
                                    <input type="datetime-local" id="registration_deadline" name="registration_deadline" autoComplete="off" suppressHydrationWarning className="w-full px-4 py-4 rounded-xl border border-[var(--beheer-border)] bg-[var(--beheer-card-bg)] text-[var(--beheer-text)] font-bold focus:border-[var(--beheer-accent)] outline-none transition-all" />
                                </div>
                                <div className="space-y-3">
                                    <label htmlFor="committee_id" className="text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest">Verantwoordelijke Commissie</label>
                                    <select id="committee_id" name="committee_id" autoComplete="off" suppressHydrationWarning className="w-full px-5 py-4 rounded-xl border border-[var(--beheer-border)] bg-[var(--beheer-card-soft)] text-[var(--beheer-text)] focus:border-[var(--beheer-accent)] focus:ring-4 focus:ring-[var(--beheer-accent)]/10 outline-none transition-all font-bold cursor-pointer">
                                        <option value="">Selecteer een commissie...</option>
                                        {committees.map(c => <option key={c.id} value={c.id}>{cleanCommitteeName(c.name)}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="pt-4 flex items-center gap-4">
                                <div className="relative flex items-center justify-center">
                                    <input 
                                        type="checkbox" 
                                        id="only_members" 
                                        checked={onlyMembers} 
                                        onChange={(e) => setOnlyMembers(e.target.checked)}
                                        className="peer sr-only"
                                    />
                                    <div className="w-6 h-6 border-2 border-[var(--beheer-border)] rounded peer-checked:border-[var(--beheer-accent)] peer-checked:bg-[var(--beheer-accent)] transition-all"></div>
                                    <X className="absolute h-4 w-4 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                                </div>
                                <label htmlFor="only_members" className="text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest cursor-pointer hover:text-[var(--beheer-text)] transition-colors">Deze activiteit is ALLEEN voor leden</label>
                            </div>
                        </div>

                        {/* Publication Settings */}
                        <div className="space-y-8">
                            <div className="flex items-center gap-3 border-l-4 border-[var(--beheer-text-muted)] pl-4">
                                <h2 className="text-xl font-black text-[var(--beheer-text)] uppercase tracking-tight">Publicatie Instellingen</h2>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {[
                                    { id: 'published', label: 'Direct publiceren', sub: 'Zichtbaar voor iedereen' },
                                    { id: 'draft', label: 'Opslaan als concept', sub: 'Alleen in beheer' },
                                    { id: 'scheduled', label: 'Inplannen', sub: 'Voor later moment' }
                                ].map((choice) => (
                                    <button 
                                        key={choice.id}
                                        type="button"
                                        onClick={() => setStatus(choice.id as any)}
                                        className={`p-6 rounded-2xl border-2 text-left transition-all cursor-pointer relative overflow-hidden group ${status === choice.id ? 'border-[var(--beheer-accent)] bg-[var(--beheer-accent)]/5 shadow-lg' : 'border-[var(--beheer-border)] hover:border-[var(--beheer-text-muted)]/30'}`}
                                    >
                                        <div className={`h-3 w-3 rounded-full mb-3 ${status === choice.id ? 'bg-[var(--beheer-accent)] animate-pulse' : 'bg-[var(--beheer-border)] transition-colors group-hover:bg-[var(--beheer-text-muted)]/50'}`} />
                                        <span className={`block text-[10px] font-black uppercase tracking-widest ${status === choice.id ? 'text-[var(--beheer-accent)]' : 'text-[var(--beheer-text-muted)]'}`}>{choice.label}</span>
                                        <span className="text-[10px] text-[var(--beheer-text-muted)] mt-1 block opacity-60">{choice.sub}</span>
                                    </button>
                                ))}
                            </div>

                            {status === 'scheduled' && (
                                <div className="animate-in fade-in slide-in-from-top-4 duration-500 bg-[var(--beheer-accent)]/5 p-8 rounded-3xl border border-[var(--beheer-accent)]/20 space-y-4">
                                    <label htmlFor="publish_date" className="block text-[10px] font-black text-[var(--beheer-accent)] uppercase tracking-widest">Publicatiedatum & Tijd *</label>
                                    <input type="datetime-local" id="publish_date" name="publish_date" className="w-full px-5 py-4 rounded-xl border border-[var(--beheer-accent)]/20 bg-[var(--beheer-card-bg)] text-[var(--beheer-text)] outline-none focus:ring-4 focus:ring-[var(--beheer-accent)]/10 transition-all font-bold" />
                                    <p className="text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest opacity-50">De activiteit zal automatisch op dit tijdstip worden gepubliceerd.</p>
                                </div>
                            )}
                        </div>

                        {/* Footer Actions */}
                        <div className="flex flex-col sm:flex-row items-center justify-end gap-4 pt-10 border-t border-[var(--beheer-border)]">
                            <button 
                                type="button" 
                                onClick={() => router.back()} 
                                className="w-full sm:w-auto px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-xs text-[var(--beheer-text-muted)] hover:bg-[var(--beheer-card-soft)] transition-all cursor-pointer"
                            >
                                Annuleren
                            </button>
                            <button 
                                type="submit" 
                                disabled={optimisticSaving}
                                className="w-full sm:w-auto px-12 py-5 bg-[var(--beheer-accent)] text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-[var(--shadow-glow)] hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed cursor-pointer"
                            >
                                {optimisticSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                                <span>{optimisticSaving ? 'Bezig...' : 'Activiteit Aanmaken'}</span>
                            </button>
                        </div>
                    </div>
                </form>

                <AdminToast toast={toast} onClose={hideToast} />
            </div>
        </>
    );
}
