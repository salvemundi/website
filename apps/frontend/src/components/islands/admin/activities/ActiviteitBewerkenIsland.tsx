'use client';

import { useState, useRef, useOptimistic, useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Upload, X, Loader2, Trash2, Info, Calendar as CalendarIcon, MapPin, Users, Euro, Link as LinkIcon, Eye } from 'lucide-react';
import { updateActivityAction, deleteActivity } from '@/server/actions/activiteiten/activities-write.actions';
import { getImageUrl } from '@/lib/utils/image-utils';
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
    custom_url?: string | null;
}

interface ActiviteitBewerkenIslandProps {
    event?: EventProps;
    committees?: Committee[];
}

export default function ActiviteitBewerkenIsland({ 
    event = {} as EventProps, 
    committees = [], 
}: ActiviteitBewerkenIslandProps) {
    const router = useRouter();
    const { toast, showToast, hideToast } = useAdminToast();
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [removeExistingImage, setRemoveExistingImage] = useState(false);
    
    // Set initial image preview if event has an image
    const [imagePreview, setImagePreview] = useState<string | null>(getImageUrl(event.image));
    
    // Initialize controlled UI state correctly handling draft vs scheduled vs published
    const determineStatus = () => {
        if (event.status === 'draft') return 'draft';
        if (event.publish_date) return 'scheduled';
        return 'published';
    };
    const [status, setStatus] = useState(determineStatus());
    const [onlyMembers, setOnlyMembers] = useState(!!event.only_members);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    // React 19 useActionState
    const [state, formAction, isPending] = useActionState(async (prevState: any, formData: FormData) => {
        if (imageFile) formData.append('imageFile', imageFile);
        if (removeExistingImage) formData.append('removeImage', 'true');
        formData.set('status', status);
        formData.set('only_members', onlyMembers ? 'on' : 'off');

        const res = await updateActivityAction(event.id, prevState, formData);
        if (res.success) {
            showToast('Activiteit succesvol bijgewerkt!', 'success');
            router.refresh();
        } else {
            showToast(res.error || 'Er is een fout opgetreden', 'error');
        }
        return res;
    }, { success: false });

    // Optimistic UI for the saving state
    const [optimisticSaving, setOptimisticSaving] = useOptimistic(isPending);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (!confirm(`Weet je zeker dat je "${event.name}" wilt verwijderen? Dit kan niet ongedaan worden gemaakt.`)) return;
        
        setIsDeleting(true);
        try {
            const res = await deleteActivity(event.id);
            if (res.success) {
                showToast('Activiteit succesvol verwijderd', 'success');
                router.push('/beheer/activiteiten');
            } else {
                showToast(res.error || 'Er is een fout opgetreden bij het verwijderen', 'error');
            }
        } finally {
            setIsDeleting(false);
        }
    };

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
        try { 
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return '';
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        } catch { return ''; }
    };
    
    const formatDateTime = (dateStr?: string | null) => {
        if (!dateStr) return '';
        try { 
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return '';
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const hours = String(d.getHours()).padStart(2, '0');
            const minutes = String(d.getMinutes()).padStart(2, '0');
            return `${year}-${month}-${day}T${hours}:${minutes}`;
        } catch { return ''; }
    };

    const formatTime = (timeStr?: string | null) => {
        if (!timeStr) return '';
        // Directus returns HH:mm:ss, but input type="time" expects HH:mm
        return timeStr.slice(0, 5);
    };

    const formErrors = state.fieldErrors || {};

    return (
        <div className="pb-20">
            <AdminToolbar 
                title="Bewerk Activiteit"
                subtitle={`Wijzig de gegevens van "${event.name}"`}
                backHref="/beheer/activiteiten"
                actions={
                    <button
                        type="button"
                        onClick={handleDelete}
                        disabled={isDeleting || optimisticSaving}
                        className="flex items-center gap-2 px-6 py-3 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-[var(--beheer-radius)] transition-all font-black text-[10px] uppercase tracking-widest disabled:opacity-50 cursor-pointer active:scale-95 group shadow-sm border border-red-500/20"
                    >
                        {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 group-hover:scale-110 transition-transform" />}
                        Verwijderen
                    </button>
                }
            />
            <div className="container mx-auto px-4 py-12 max-w-5xl">
                <form action={formAction} className="space-y-8">
                    {/* Section 1: Algemene Informatie */}
                    <div className="bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] shadow-2xl border border-[var(--beheer-border)] overflow-hidden">
                        <div className="px-8 py-6 border-b border-[var(--beheer-border)] bg-[var(--beheer-card-soft)]/50 flex items-center gap-3">
                            <Info className="h-5 w-5 text-[var(--beheer-accent)]" />
                            <h2 className="text-sm font-black uppercase tracking-widest text-[var(--beheer-text)]">Algemene Informatie</h2>
                        </div>
                        <div className="p-8 space-y-8">
                            <div className="relative z-10">
                                <label htmlFor="name" className="block text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest mb-2">Naam van de activiteit *</label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    defaultValue={event.name}
                                    autoComplete="off"
                                    className={`beheer-input ${formErrors.name ? 'border-red-500 ring-4 ring-red-500/10' : ''}`}
                                    placeholder="Bijv. Borrel: Back to School"
                                />
                                {formErrors.name && <p className="text-red-500 text-[10px] font-black uppercase tracking-widest mt-2">{formErrors.name[0]}</p>}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-8">
                                    <div>
                                        <label htmlFor="description" className="block text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest mb-2">Publieke Beschrijving *</label>
                                        <textarea id="description" name="description" rows={8} defaultValue={event.description} className={`beheer-input ${formErrors.description ? 'border-red-500 ring-4 ring-red-500/10' : ''}`} placeholder="Wat gaan we doen?" />
                                        {formErrors.description && <p className="text-red-500 text-[10px] font-black uppercase tracking-widest mt-2">{formErrors.description[0]}</p>}
                                    </div>
                                    <div>
                                        <label htmlFor="description_logged_in" className="block text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest mb-2">Extra Informatie (alleen ingelogd)</label>
                                        <textarea id="description_logged_in" name="description_logged_in" rows={4} defaultValue={event.description_logged_in || ''} className="beheer-input" placeholder="Bijv. verzamelplek, wat mee te nemen..." />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="block text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest mb-2">Banner</label>
                                    {!imagePreview ? (
                                        <div onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center justify-center w-full min-h-[340px] border-2 border-dashed border-[var(--beheer-border)] rounded-[var(--beheer-radius)] cursor-pointer hover:border-[var(--beheer-accent)] hover:bg-[var(--beheer-accent)]/5 transition-all bg-[var(--beheer-card-soft)] group">
                                            <Upload className="h-8 w-8 mb-3 text-[var(--beheer-text-muted)] group-hover:text-[var(--beheer-accent)] transition-colors" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--beheer-text-muted)] group-hover:text-[var(--beheer-accent)] text-center px-8">Klik om een banner te uploaden</span>
                                            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                                        </div>
                                    ) : (
                                        <div className="relative group overflow-hidden rounded-[var(--beheer-radius)] border border-[var(--beheer-border)] bg-[var(--beheer-card-soft)]/50 h-[340px] p-4 flex items-center justify-center">
                                            {event.image?.type?.startsWith('video/') || imageFile?.type?.startsWith('video/') ? (
                                                <video 
                                                    src={imagePreview!} 
                                                    className="w-full h-full object-contain transition-transform duration-700 drop-shadow-lg" 
                                                    autoPlay 
                                                    loop 
                                                    muted 
                                                    playsInline
                                                />
                                            ) : (
                                                <img src={imagePreview!} alt="Preview" className="w-full h-full object-contain transition-transform duration-700 drop-shadow-lg" />
                                            )}
                                            
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                                <button type="button" onClick={() => fileInputRef.current?.click()} className="bg-white text-slate-900 p-4 rounded-2xl hover:scale-110 transition shadow-xl cursor-pointer">
                                                    <Upload className="h-5 w-5" />
                                                </button>
                                                <button type="button" onClick={handleRemoveImage} className="bg-red-500 text-white p-4 rounded-2xl hover:scale-110 transition shadow-xl cursor-pointer">
                                                    <X className="h-5 w-5" />
                                                </button>
                                            </div>
                                            <input ref={fileInputRef} type="file" accept="image/*,video/*" onChange={handleImageChange} className="hidden" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Planning & Locatie */}
                    <div className="bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] shadow-2xl border border-[var(--beheer-border)] overflow-hidden">
                        <div className="px-8 py-6 border-b border-[var(--beheer-border)] bg-[var(--beheer-card-soft)]/50 flex items-center gap-3">
                            <CalendarIcon className="h-5 w-5 text-[var(--beheer-accent)]" />
                            <h2 className="text-sm font-black uppercase tracking-widest text-[var(--beheer-text)]">Planning & Locatie</h2>
                        </div>
                        <div className="p-8 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div className="lg:col-span-2">
                                    <label htmlFor="event_date" className="block text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest mb-2">Startdatum *</label>
                                    <input type="date" id="event_date" name="event_date" defaultValue={formatDate(event.event_date)} suppressHydrationWarning className={`beheer-input ${formErrors.event_date ? 'border-red-500' : ''}`} />
                                    {formErrors.event_date && <p className="text-red-500 text-[10px] font-black uppercase tracking-widest mt-2">{formErrors.event_date[0]}</p>}
                                </div>
                                <div className="lg:col-span-2">
                                    <label htmlFor="event_time" className="block text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest mb-2">Starttijd</label>
                                    <input type="time" id="event_time" name="event_time" defaultValue={formatTime(event.event_time)} suppressHydrationWarning className="beheer-input" />
                                </div>
                                <div className="lg:col-span-2">
                                    <label htmlFor="event_date_end" className="block text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest mb-2">Einddatum</label>
                                    <input type="date" id="event_date_end" name="event_date_end" defaultValue={formatDate(event.event_date_end)} suppressHydrationWarning className="beheer-input" />
                                </div>
                                <div className="lg:col-span-2">
                                    <label htmlFor="event_time_end" className="block text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest mb-2">Eindtijd</label>
                                    <input type="time" id="event_time_end" name="event_time_end" defaultValue={formatTime(event.event_time_end)} suppressHydrationWarning className="beheer-input" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="location" className="block text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest mb-2 flex items-center gap-2">
                                        <MapPin className="h-3 w-3" /> Locatie
                                    </label>
                                    <input type="text" id="location" name="location" defaultValue={event.location || ''} className="beheer-input" placeholder="Bijv. Fontys R10" />
                                </div>
                                <div>
                                    <label htmlFor="registration_deadline" className="block text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest mb-2">Inschrijfdeadline</label>
                                    <input type="datetime-local" id="registration_deadline" name="registration_deadline" defaultValue={formatDateTime(event.registration_deadline)} suppressHydrationWarning className="beheer-input" />
                                </div>
                            </div>

                            <div className="pt-4 border-t border-[var(--beheer-border)]">
                                <div>
                                    <label htmlFor="custom_url" className="block text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest mb-2 flex items-center gap-2">
                                        <LinkIcon className="h-3 w-3" /> Custom Slug / Redirect URL (optioneel)
                                    </label>
                                    <input type="text" id="custom_url" name="custom_url" defaultValue={event.custom_url || ''} className="beheer-input" placeholder="bijv. https://forms.gle/..." />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Registratie & Kosten */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-8">
                            <div className="bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] shadow-2xl border border-[var(--beheer-border)] overflow-hidden">
                                <div className="px-8 py-6 border-b border-[var(--beheer-border)] bg-[var(--beheer-card-soft)]/50 flex items-center gap-3">
                                    <Euro className="h-5 w-5 text-[var(--beheer-accent)]" />
                                    <h2 className="text-sm font-black uppercase tracking-widest text-[var(--beheer-text)]">Kosten & Capaciteit</h2>
                                </div>
                                <div className="p-8 space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div>
                                            <label htmlFor="max_sign_ups" className="block text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest mb-2">Max. Deelnemers</label>
                                            <input type="number" id="max_sign_ups" name="max_sign_ups" defaultValue={event.max_sign_ups || ''} min="0" className="beheer-input" placeholder="Onbeperkt" />
                                        </div>
                                        <div>
                                            <label htmlFor="price_members" className="block text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest mb-2">Leden (€)</label>
                                            <input type="number" id="price_members" name="price_members" defaultValue={event.price_members !== null ? event.price_members : ''} min="0" step="0.01" className="beheer-input" placeholder="0.00" />
                                        </div>
                                        <div>
                                            <label htmlFor="price_non_members" className="block text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest mb-2">Niet-leden (€)</label>
                                            <input type="number" id="price_non_members" name="price_non_members" defaultValue={event.price_non_members !== null ? event.price_non_members : ''} min="0" step="0.01" className="beheer-input" placeholder="0.00" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-[var(--beheer-border)] pt-8">
                                        <div>
                                            <label htmlFor="committee_id" className="block text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest mb-2">Organiserende Commissie</label>
                                            <select id="committee_id" name="committee_id" defaultValue={event.committee_id || ''} className="beheer-select">
                                                <option value="">Geen (Algemeen)</option>
                                                {committees.map(c => <option key={c.id} value={c.id}>{cleanCommitteeName(c.name)}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label htmlFor="contact" className="block text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest mb-2">Contactpersoon (e-mail)</label>
                                            <input type="email" id="contact" name="contact" defaultValue={event.contact || ''} className="beheer-input" placeholder="naam@salvemundi.nl" />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 bg-[var(--beheer-card-soft)] p-4 rounded-2xl border border-[var(--beheer-border)]">
                                        <div className="relative flex items-center justify-center">
                                            <input type="checkbox" id="only_members" checked={onlyMembers} onChange={(e) => setOnlyMembers(e.target.checked)} className="peer sr-only" />
                                            <div className="w-6 h-6 border-2 border-[var(--beheer-border)] rounded peer-checked:border-[var(--beheer-accent)] peer-checked:bg-[var(--beheer-accent)] transition-all"></div>
                                            <X className="absolute h-4 w-4 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                                        </div>
                                        <label htmlFor="only_members" className="text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest cursor-pointer hover:text-[var(--beheer-text)] transition-colors">Alleen toegankelijk voor leden</label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <div className="bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] shadow-2xl border border-[var(--beheer-border)] overflow-hidden">
                                <div className="px-8 py-6 border-b border-[var(--beheer-border)] bg-[var(--beheer-card-soft)]/50 flex items-center gap-3">
                                    <Eye className="h-5 w-5 text-[var(--beheer-accent)]" />
                                    <h2 className="text-sm font-black uppercase tracking-widest text-[var(--beheer-text)]">Status</h2>
                                </div>
                                <div className="p-8 space-y-6">
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
                                                <span className="text-[10px] font-black text-[var(--beheer-text-muted)] group-hover:text-[var(--beheer-text)] uppercase tracking-widest transition-colors">Inplannen</span>
                                                {status === 'scheduled' && (
                                                    <div className="mt-4 animate-in slide-in-from-top-2 duration-300">
                                                        <input type="datetime-local" name="publish_date" defaultValue={formatDateTime(event.publish_date)} suppressHydrationWarning className="beheer-input bg-[var(--beheer-card-soft)]" />
                                                    </div>
                                                )}
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <button 
                                type="submit" 
                                disabled={optimisticSaving} 
                                className="w-full bg-[var(--beheer-accent)] text-white px-10 py-6 rounded-2xl font-black uppercase tracking-widest text-xs shadow-[var(--shadow-glow)] hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group border border-white/10"
                            >
                                {optimisticSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5 group-hover:scale-110 transition-transform" />}
                                <span>{optimisticSaving ? 'Opslaan...' : 'Wijzigingen Opslaan'}</span>
                            </button>
                            
                            <button 
                                type="button" 
                                onClick={() => router.back()} 
                                className="w-full px-10 py-6 rounded-2xl font-black uppercase tracking-widest text-xs border border-[var(--beheer-border)] text-[var(--beheer-text)] hover:bg-[var(--beheer-card-soft)] transition-all cursor-pointer"
                            >
                                Annuleren
                            </button>
                        </div>
                    </div>
                </form>
            </div>
            <AdminToast toast={toast} onClose={hideToast} />
        </div>
    );
}
