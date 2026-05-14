import React from 'react';
import MediaAsset from '@/components/ui/media/MediaAsset';
import { Info, Calendar as CalendarIcon, MapPin, Euro, Link as LinkIcon, Upload, X, Eye, Check } from 'lucide-react';
import { toLocalISOString } from '@/lib/utils/date-utils';
import { ActivityAdmin } from '@salvemundi/validations';

// --- Utilities ---
function cleanCommitteeName(name: string): string {
    return name?.replace(/\s*(\|\||[-–—])\s*SALVE MUNDI\s*$/gi, '').trim() || '';
}

// Gebruik unknown voor maximale compatibiliteit met Record<string, unknown> en DB modellen
type InitialValue = unknown;

const formatDate = (dateStr?: InitialValue) =>
    typeof dateStr === 'string' ? toLocalISOString(dateStr) || '' : '';

const formatDateTime = (dateStr?: InitialValue) =>
    typeof dateStr === 'string' ? toLocalISOString(dateStr, true)?.slice(0, 16) || '' : '';

const formatTime = (timeStr?: InitialValue) =>
    (typeof timeStr === 'string' && timeStr) ? timeStr.slice(0, 5) : '';

const toInputSafe = (value: unknown): string => {
    if (value === null || value === undefined) return '';
    return String(value);
};

// --- Components ---

export function GeneralInfoSection({
    initialData,
    formErrors
}: {
    initialData?: Partial<ActivityAdmin>,
    formErrors?: Record<string, string[] | undefined>
}) {
    return (
        <div className="bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] shadow-xl border border-[var(--beheer-border)] overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--beheer-border)] bg-[var(--beheer-card-soft)]/50 flex items-center gap-3">
                <Info className="h-4 w-4 text-[var(--beheer-accent)]" />
                <h2 className="text-base font-semibold text-[var(--beheer-text)]">Beschrijving</h2>
            </div>
            <div className="p-6 space-y-6">
                <div className="relative z-10">
                    <label htmlFor="name" className="block text-base font-semibold text-[var(--beheer-text-muted)] mb-2">Naam van de activiteit *</label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        defaultValue={toInputSafe(initialData?.name)}
                        autoComplete="off"
                        className={`beheer-input ${formErrors?.name ? 'border-red-500 ring-4 ring-red-500/10' : ''}`}
                        placeholder="Bijv. Borrel: Back to School"
                    />
                    {formErrors?.name && <p className="text-red-500 text-sm font-semibold mt-2">{formErrors.name[0]}</p>}
                </div>
                <div className="grid grid-cols-1 gap-6">
                    <div>
                        <label htmlFor="description" className="block text-base font-semibold text-[var(--beheer-text-muted)] mb-2">Publieke beschrijving *</label>
                        <textarea
                            id="description"
                            name="description"
                            rows={8}
                            defaultValue={toInputSafe(initialData?.description)}
                            className={`beheer-input font-mono text-sm leading-relaxed resize-y ${formErrors?.description ? 'border-red-500 ring-4 ring-red-500/10' : ''}`}
                            placeholder="Plak hier je WhatsApp bericht. Gebruik **tekst** voor dikgedrukt."
                        />
                        {formErrors?.description && <p className="text-red-500 text-sm font-semibold mt-2">{formErrors.description[0]}</p>}
                    </div>
                    <div>
                        <label htmlFor="description_logged_in" className="flex items-end justify-between mb-2">
                            <span className="block text-base font-semibold text-[var(--beheer-text-muted)]">Extra informatie (alleen ingelogd)</span>
                            <span className="text-xs font-normal text-[var(--beheer-text-muted)] opacity-70">
                                Optioneel
                            </span>
                        </label>
                        <textarea
                            id="description_logged_in"
                            name="description_logged_in"
                            rows={3}
                            defaultValue={toInputSafe(initialData?.description_logged_in)}
                            className={`beheer-input font-mono text-sm leading-relaxed resize-y ${formErrors?.description_logged_in ? 'border-red-500 ring-4 ring-red-500/10' : ''}`}
                            placeholder="Bijv. verzamelplek, wat mee te nemen..."
                        />
                        {formErrors?.description_logged_in && <p className="text-red-500 text-sm font-semibold mt-2">{formErrors.description_logged_in[0]}</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}

export function PlanningLocationSection({ initialData, formErrors }: { initialData?: Record<string, InitialValue>, formErrors?: Record<string, string[] | undefined> }) {
    return (
        <div className="bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] shadow-xl border border-[var(--beheer-border)] overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--beheer-border)] bg-[var(--beheer-card-soft)]/50 flex items-center gap-3">
                <CalendarIcon className="h-4 w-4 text-[var(--beheer-accent)]" />
                <h2 className="text-base font-semibold text-[var(--beheer-text)]">Planning & locatie</h2>
            </div>
            <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label htmlFor="event_date" className="block text-base font-semibold text-[var(--beheer-text-muted)] mb-2">Startdatum *</label>
                        <input type="date" id="event_date" name="event_date" defaultValue={formatDate(initialData?.event_date)} suppressHydrationWarning className={`beheer-input ${formErrors?.event_date ? 'border-red-500' : ''}`} />
                        {formErrors?.event_date && <p className="text-red-500 text-sm font-semibold mt-2">{formErrors.event_date[0]}</p>}
                    </div>
                    <div>
                        <label htmlFor="event_time" className="block text-base font-semibold text-[var(--beheer-text-muted)] mb-2">Tijd</label>
                        <input type="time" id="event_time" name="event_time" defaultValue={formatTime(initialData?.event_time)} suppressHydrationWarning className="beheer-input" />
                    </div>
                    <div>
                        <label htmlFor="event_date_end" className="block text-base font-semibold text-[var(--beheer-text-muted)] mb-2">Einddatum</label>
                        <input type="date" id="event_date_end" name="event_date_end" defaultValue={formatDate(initialData?.event_date_end)} suppressHydrationWarning className="beheer-input" />
                    </div>
                    <div>
                        <label htmlFor="event_time_end" className="block text-base font-semibold text-[var(--beheer-text-muted)] mb-2">Eindtijd</label>
                        <input type="time" id="event_time_end" name="event_time_end" defaultValue={formatTime(initialData?.event_time_end)} suppressHydrationWarning className="beheer-input" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="location" className="block text-base font-semibold text-[var(--beheer-text-muted)] mb-2 flex items-center gap-2">
                            <MapPin className="h-3 w-3" /> Locatie
                        </label>
                        <input type="text" id="location" name="location" defaultValue={toInputSafe(initialData?.location)} className="beheer-input" placeholder="Bijv. Fontys R10" />
                    </div>
                    <div>
                        <label htmlFor="registration_deadline" className="block text-base font-semibold text-[var(--beheer-text-muted)] mb-2">Inschrijfdeadline</label>
                        <input type="datetime-local" id="registration_deadline" name="registration_deadline" defaultValue={formatDateTime(initialData?.registration_deadline)} suppressHydrationWarning className="beheer-input" />
                    </div>
                </div>

                <div className="pt-4 border-t border-[var(--beheer-border)]/50">
                    <label htmlFor="custom_url" className="block text-base font-semibold text-[var(--beheer-text-muted)] mb-2 flex items-center gap-2">
                        <LinkIcon className="h-3 w-3" /> Custom redirect URL (optioneel)
                    </label>
                    <input type="text" id="custom_url" name="custom_url" defaultValue={toInputSafe(initialData?.custom_url)} className="beheer-input" placeholder="bijv. https://forms.gle/..." />
                </div>
            </div>
        </div>
    );
}

export function CapacityCostsSection({
    initialData,
    committees,
    contactEmail,
    onContactEmailChange,
    onCommitteeChange,
    onlyMembers,
    onOnlyMembersChange
}: {
    initialData?: Record<string, InitialValue>,
    committees: { id: string | number, name: string }[],
    contactEmail: string,
    onContactEmailChange: (val: string) => void,
    onCommitteeChange: (id: string) => void,
    onlyMembers: boolean,
    onOnlyMembersChange: (val: boolean) => void
}) {
    return (
        <div className="bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] shadow-xl border border-[var(--beheer-border)] overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--beheer-border)] bg-[var(--beheer-card-soft)]/50 flex items-center gap-3">
                <Euro className="h-4 w-4 text-[var(--beheer-accent)]" />
                <h2 className="text-base font-semibold text-[var(--beheer-text)]">Kosten & capaciteit</h2>
            </div>
            <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label htmlFor="max_sign_ups" className="block text-base font-semibold text-[var(--beheer-text-muted)] mb-2">Max. deelnemers</label>
                        <input type="number" id="max_sign_ups" name="max_sign_ups" defaultValue={toInputSafe(initialData?.max_sign_ups)} min="0" className="beheer-input" placeholder="Onbeperkt" />
                    </div>
                    <div>
                        <label htmlFor="price_members" className="block text-base font-semibold text-[var(--beheer-text-muted)] mb-2">Leden (€)</label>
                        <input type="number" id="price_members" name="price_members" defaultValue={toInputSafe(initialData?.price_members)} min="0" step="0.01" className="beheer-input" placeholder="0.00" />
                    </div>
                    <div>
                        <label htmlFor="price_non_members" className="block text-base font-semibold text-[var(--beheer-text-muted)] mb-2">Niet-leden (€)</label>
                        <input type="number" id="price_non_members" name="price_non_members" defaultValue={toInputSafe(initialData?.price_non_members)} min="0" step="0.01" className="beheer-input" placeholder="0.00" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-[var(--beheer-border)]/50 pt-6">
                    <div>
                        <label htmlFor="committee_id" className="block text-base font-semibold text-[var(--beheer-text-muted)] mb-2">Organiserende commissie</label>
                        <select
                            id="committee_id"
                            name="committee_id"
                            defaultValue={toInputSafe(initialData?.committee_id)}
                            onChange={(e) => onCommitteeChange(e.target.value)}
                            className="beheer-select"
                        >
                            <option value="">Geen (Algemeen)</option>
                            {committees.map(c => <option key={String(c.id)} value={String(c.id)}>{cleanCommitteeName(c.name)}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="contact" className="block text-base font-semibold text-[var(--beheer-text-muted)] mb-2">Contactpersoon (e-mail)</label>
                        <input
                            type="email"
                            id="contact"
                            name="contact"
                            value={contactEmail}
                            onChange={(e) => onContactEmailChange(e.target.value)}
                            autoComplete="off"
                            className="beheer-input"
                            placeholder="naam@salvemundi.nl"
                        />
                    </div>
                </div>

                <label className="relative flex items-center gap-4 bg-[var(--beheer-card-soft)]/50 p-4 rounded-2xl border border-[var(--beheer-border)]/50 cursor-pointer group z-10">
                    <div className="relative flex items-center justify-center">
                        <input type="checkbox" id="only_members" checked={onlyMembers} onChange={(e) => onOnlyMembersChange(e.target.checked)} className="peer sr-only" />
                        <div className="w-5 h-5 border-2 border-[var(--beheer-border)] rounded peer-checked:border-[var(--beheer-accent)] peer-checked:bg-[var(--beheer-accent)] transition-all"></div>
                        <Check className="absolute h-3 w-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                    </div>
                    <span className="text-base font-semibold text-[var(--beheer-text-muted)] group-hover:text-[var(--beheer-text)] transition-colors">Alleen toegankelijk voor leden</span>
                </label>
            </div>
        </div>
    );
}

export function BannerSection({ imagePreview, onUploadClick, onRemoveClick, fileInputRef, onFileChange }: {
    imagePreview: string | null,
    onUploadClick: () => void,
    onRemoveClick: () => void,
    fileInputRef: React.RefObject<HTMLInputElement | null>,
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}) {
    return (
        <div className="bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] shadow-xl border border-[var(--beheer-border)] overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--beheer-border)] bg-[var(--beheer-card-soft)]/50 flex items-center gap-3">
                <Upload className="h-4 w-4 text-[var(--beheer-accent)]" />
                <h2 className="text-base font-semibold text-[var(--beheer-text)]">Banner</h2>
            </div>
            <div className="p-4">
                {!imagePreview ? (
                    <div onClick={onUploadClick} className="flex flex-col items-center justify-center w-full min-h-[160px] border-2 border-dashed border-[var(--beheer-border)] rounded-xl cursor-pointer hover:border-[var(--beheer-accent)] hover:bg-[var(--beheer-accent)]/5 transition-all bg-[var(--beheer-card-soft)] group">
                        <Upload className="h-6 w-6 mb-2 text-[var(--beheer-text-muted)] group-hover:text-[var(--beheer-accent)] transition-colors" />
                        <span className="text-sm font-semibold text-[var(--beheer-text-muted)] group-hover:text-[var(--beheer-accent)] text-center px-4">Upload banner</span>
                        <input ref={fileInputRef} type="file" accept="image/*,video/*" onChange={onFileChange} className="hidden" />
                    </div>
                ) : (
                    <div className="relative group overflow-hidden rounded-xl border border-[var(--beheer-border)] bg-[var(--beheer-card-soft)]/50 h-[160px] flex items-center justify-center">
                        <MediaAsset asset={imagePreview} alt="Preview" fill className="object-contain transition-transform duration-700" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                            <button type="button" onClick={onUploadClick} className="bg-white text-slate-900 p-2.5 rounded-xl hover:scale-110 transition shadow-xl cursor-pointer"><Upload className="h-4 w-4" /></button>
                            <button type="button" onClick={onRemoveClick} className="bg-red-500 text-white p-2.5 rounded-xl hover:scale-110 transition shadow-xl cursor-pointer"><X className="h-4 w-4" /></button>
                        </div>
                        <input ref={fileInputRef} type="file" accept="image/*,video/*" onChange={onFileChange} className="hidden" />
                    </div>
                )}
            </div>
        </div>
    );
}

export function StatusSection({ status, onStatusChange, initialData }: { status: string, onStatusChange: (val: string) => void, initialData?: Record<string, InitialValue> }) {
    return (
        <div className="bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] shadow-xl border border-[var(--beheer-border)] overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--beheer-border)] bg-[var(--beheer-card-soft)]/50 flex items-center gap-3">
                <Eye className="h-4 w-4 text-[var(--beheer-accent)]" />
                <h2 className="text-base font-semibold text-[var(--beheer-text)]">Status</h2>
            </div>
            <div className="p-6 space-y-4">
                <label className="relative flex items-center gap-4 cursor-pointer group z-10">
                    <div className="relative flex items-center justify-center">
                        <input type="radio" value="published" checked={status === 'published'} onChange={() => onStatusChange('published')} className="peer sr-only" />
                        <div className="w-5 h-5 border-2 border-[var(--beheer-border)] rounded-full peer-checked:border-[var(--beheer-accent)] peer-checked:bg-[var(--beheer-accent)] transition-all"></div>
                        <div className="absolute w-1.5 h-1.5 bg-white rounded-full opacity-0 peer-checked:opacity-100 transition-opacity"></div>
                    </div>
                    <span className="text-base font-semibold text-[var(--beheer-text-muted)] group-hover:text-[var(--beheer-text)] transition-colors">Gepubliceerd</span>
                </label>
                <label className="relative flex items-center gap-4 cursor-pointer group z-10">
                    <div className="relative flex items-center justify-center">
                        <input type="radio" value="draft" checked={status === 'draft'} onChange={() => onStatusChange('draft')} className="peer sr-only" />
                        <div className="w-5 h-5 border-2 border-[var(--beheer-border)] rounded-full peer-checked:border-[var(--beheer-accent)] peer-checked:bg-[var(--beheer-accent)] transition-all"></div>
                        <div className="absolute w-1.5 h-1.5 bg-white rounded-full opacity-0 peer-checked:opacity-100 transition-opacity"></div>
                    </div>
                    <span className="text-base font-semibold text-[var(--beheer-text-muted)] group-hover:text-[var(--beheer-text)] transition-colors">Concept</span>
                </label>
                <label className="relative flex items-start gap-4 cursor-pointer group z-10">
                    <div className="relative flex items-center justify-center mt-0.5">
                        <input type="radio" value="scheduled" checked={status === 'scheduled'} onChange={() => onStatusChange('scheduled')} className="peer sr-only" />
                        <div className="w-5 h-5 border-2 border-[var(--beheer-border)] rounded-full peer-checked:border-[var(--beheer-accent)] peer-checked:bg-[var(--beheer-accent)] transition-all"></div>
                        <div className="absolute w-1.5 h-1.5 bg-white rounded-full opacity-0 peer-checked:opacity-100 transition-opacity"></div>
                    </div>
                    <div className="flex-1">
                        <span className="text-base font-semibold text-[var(--beheer-text-muted)] group-hover:text-[var(--beheer-text)] transition-colors">Inplannen</span>
                        {status === 'scheduled' && (
                            <div className="mt-2 animate-in slide-in-from-top-2 duration-300">
                                <input type="datetime-local" name="publish_date" defaultValue={formatDateTime(initialData?.publish_date)} suppressHydrationWarning className="beheer-input text-sm py-2" />
                            </div>
                        )}
                    </div>
                </label>
            </div>
        </div>
    );
}