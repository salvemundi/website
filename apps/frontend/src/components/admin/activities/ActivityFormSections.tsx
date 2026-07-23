import React from 'react';
import MediaAsset from '@/components/ui/media/MediaAsset';
import { Info, Calendar as CalendarIcon, MapPin, Euro, Link as LinkIcon, Upload, X, Eye, Check } from 'lucide-react';
import { AdminDatepicker } from '@/components/ui/forms/AdminDatepicker';
import { AdminTimepicker } from '@/components/ui/forms/AdminTimepicker';
import { AdminDatetimepicker } from '@/components/ui/forms/AdminDatetimepicker';
import { toLocalISOString } from '@/lib/utils/date-utils';
import { ActivityAdmin } from '@salvemundi/validations';
import AdminSelect from '@/components/ui/admin/AdminSelect';

function cleanCommitteeName(name: string): string {
    return name.replace(/\s*(\|\||[-–—])\s*SALVE MUNDI\s*$/gi, '').trim();
}

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

const toISODateString = (date: Date | null): string => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};


export function GeneralInfoSection({
    initialData,
    formErrors
}: {
    initialData?: Partial<ActivityAdmin>,
    formErrors?: Record<string, string[] | undefined>
}) {
    return (
        <div className="bg-(--beheer-card-bg) rounded-(--beheer-radius) shadow-xl border border-(--beheer-border) overflow-hidden">
            <div className="px-6 py-4 border-b border-(--beheer-border) bg-(--beheer-card-soft)/50 flex items-center gap-3">
                <Info className="h-4 w-4 text-(--beheer-accent)" />
                <h2 className="text-base font-semibold text-(--beheer-text)">Beschrijving</h2>
            </div>
            <div className="p-6 space-y-6">
                <div className="relative z-10">
                    <label htmlFor="name" className="block text-base font-semibold text-(--beheer-text-muted) mb-2">Naam van de activiteit *</label>
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
                        <label htmlFor="description" className="block text-base font-semibold text-(--beheer-text-muted) mb-2">Publieke beschrijving *</label>
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
                        <label htmlFor="short_description" className="flex items-end justify-between mb-2">
                            <span className="block text-base font-semibold text-(--beheer-text-muted)">Korte beschrijving / TL;DR</span>
                            <span className="text-xs font-normal text-(--beheer-text-muted) opacity-70">
                                Optioneel (voor preview kaarten)
                            </span>
                        </label>
                        <textarea
                            id="short_description"
                            name="short_description"
                            rows={4}
                            defaultValue={toInputSafe(initialData?.short_description)}
                            className={`beheer-input font-mono text-sm leading-relaxed resize-y ${formErrors?.short_description ? 'border-red-500 ring-4 ring-red-500/10' : ''}`}
                            placeholder="Bijv. een korte samenvatting of TL;DR voor op de overzichtskaart."
                        />
                        {formErrors?.short_description && <p className="text-red-500 text-sm font-semibold mt-2">{formErrors.short_description[0]}</p>}
                    </div>
                    <div>
                        <label htmlFor="description_logged_in" className="flex items-end justify-between mb-2">
                            <span className="block text-base font-semibold text-(--beheer-text-muted)">Extra informatie (alleen ingelogd)</span>
                            <span className="text-xs font-normal text-(--beheer-text-muted) opacity-70">
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
    const initialStartDateStr = formatDate(initialData?.event_date) || toLocalISOString(new Date()) || '';
    const initialEndDateStr = formatDate(initialData?.event_date_end);
    const initialStartTimeStr = formatTime(initialData?.event_time) || '00:00';
    const initialEndTimeStr = formatTime(initialData?.event_time_end);

    const [startDate, setStartDate] = React.useState<Date | null>(
        initialStartDateStr ? new Date(initialStartDateStr) : new Date()
    );
    const [endDate, setEndDate] = React.useState<Date | null>(
        initialEndDateStr ? new Date(initialEndDateStr) : null
    );
    const [startTime, setStartTime] = React.useState<string>(initialStartTimeStr);
    const [endTime, setEndTime] = React.useState<string>(initialEndTimeStr);

    const isSameDay = React.useMemo(() => {
        return startDate && endDate && startDate.toDateString() === endDate.toDateString();
    }, [startDate, endDate]);

    const minEndTime = React.useMemo(() => {
        return isSameDay ? startTime || undefined : undefined;
    }, [isSameDay, startTime]);

    const registrationDeadlineMax = React.useMemo(() => {
        if (!startDate) return undefined;
        const year = startDate.getFullYear();
        const month = String(startDate.getMonth() + 1).padStart(2, '0');
        const day = String(startDate.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        const timeStr = startTime ? `T${startTime.slice(0, 5)}` : 'T00:00';
        return `${dateStr}${timeStr}`;
    }, [startDate, startTime]);

    const handleStartDateChange = (date: Date | null) => {
        setStartDate(date);
        if (date && (!endDate || endDate < date)) {
            setEndDate(new Date(date));
        }
    };

    const handleEndDateChange = (date: Date | null) => {
        setEndDate(date);
        if (date && startDate && date.toDateString() === startDate.toDateString()) {
            if (endTime && startTime && endTime < startTime) {
                setEndTime('');
            }
        }
    };

    return (
        <div className="bg-(--beheer-card-bg) rounded-(--beheer-radius) shadow-xl border border-(--beheer-border) h-full flex flex-col">
            <div className="px-6 py-4 border-b border-(--beheer-border) bg-(--beheer-card-soft)/50 flex items-center gap-3 rounded-t-(--beheer-radius)">
                <CalendarIcon className="h-4 w-4 text-(--beheer-accent)" />
                <h2 className="text-base font-semibold text-(--beheer-text)">Planning & locatie</h2>
            </div>
            <div className="p-6 space-y-6 flex-1 flex flex-col">
                <div className="space-y-6">
                    <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                            <label htmlFor="event_date" className="block text-base font-semibold text-(--beheer-text-muted) mb-2">Startdatum *</label>
                            <input type="hidden" name="event_date" value={startDate ? toISODateString(startDate) : ''} />
                            <AdminDatepicker
                                value={startDate}
                                onChange={handleStartDateChange}
                                className={formErrors?.event_date ? 'border-red-500' : ''}
                            />
                            {formErrors?.event_date && <p className="text-red-500 text-sm font-semibold mt-2">{formErrors.event_date[0]}</p>}
                        </div>
                        <div className="w-28 sm:w-32 shrink-0">
                            <label htmlFor="event_time" className="block text-base font-semibold text-(--beheer-text-muted) mb-2">Starttijd</label>
                            <AdminTimepicker
                                id="event_time"
                                name="event_time"
                                value={startTime}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setStartTime(val);
                                    if (isSameDay && endTime && endTime < val) {
                                        setEndTime('');
                                    }
                                }}
                            />
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                            <label htmlFor="event_date_end" className="block text-base font-semibold text-(--beheer-text-muted) mb-2">Einddatum</label>
                            <input type="hidden" name="event_date_end" value={endDate ? toISODateString(endDate) : ''} />
                            <AdminDatepicker
                                value={endDate}
                                onChange={handleEndDateChange}
                                minDate={startDate || undefined}
                                className={formErrors?.event_date_end ? 'border-red-500' : ''}
                            />
                            {formErrors?.event_date_end && <p className="text-red-500 text-sm font-semibold mt-2">{formErrors.event_date_end[0]}</p>}
                        </div>
                        <div className="w-28 sm:w-32 shrink-0">
                            <label htmlFor="event_time_end" className="block text-base font-semibold text-(--beheer-text-muted) mb-2">Eindtijd</label>
                            <AdminTimepicker
                                id="event_time_end"
                                name="event_time_end"
                                value={endTime}
                                min={minEndTime}
                                onChange={(e) => setEndTime(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <AdminDatetimepicker
                            id="registration_deadline"
                            name="registration_deadline"
                            dateLabel="Inschrijfdeadline"
                            defaultValue={formatDateTime(initialData?.registration_deadline)}
                            max={registrationDeadlineMax}
                            error={!!formErrors?.registration_deadline}
                        />
                        {formErrors?.registration_deadline && <p className="text-red-500 text-sm font-semibold mt-2">{formErrors.registration_deadline[0]}</p>}
                    </div>
                </div>

                <div className="pt-4 border-t border-(--beheer-border)/50 mt-auto">
                    <label htmlFor="location" className="flex items-center gap-2 text-base font-semibold text-(--beheer-text-muted) mb-2">
                        <MapPin className="h-3 w-3" /> Locatie
                    </label>
                    <input type="text" id="location" name="location" defaultValue={toInputSafe(initialData?.location)} className="beheer-input" placeholder="Bijv. Fontys R10" />
                </div>

                <div className="pt-2">
                    <label htmlFor="custom_url" className="flex items-center gap-2 text-base font-semibold text-(--beheer-text-muted) mb-2">
                        <LinkIcon className="h-3 w-3" /> Custom redirect URL
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
    onOnlyMembersChange,
    formErrors
}: {
    initialData?: Record<string, InitialValue>,
    committees: { id: string | number, name: string }[],
    contactEmail: string,
    onContactEmailChange: (val: string) => void,
    onCommitteeChange: (id: string) => void,
    onlyMembers: boolean,
    onOnlyMembersChange: (val: boolean) => void,
    formErrors?: Record<string, string[] | undefined>
}) {
    return (
        <div className="bg-(--beheer-card-bg) rounded-(--beheer-radius) shadow-xl border border-(--beheer-border) overflow-hidden h-full flex flex-col">
            <div className="px-6 py-4 border-b border-(--beheer-border) bg-(--beheer-card-soft)/50 flex items-center gap-3">
                <Euro className="h-4 w-4 text-(--beheer-accent)" />
                <h2 className="text-base font-semibold text-(--beheer-text)">Kosten & capaciteit</h2>
            </div>
            <div className="p-6 space-y-6 flex-1 flex flex-col">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label htmlFor="max_sign_ups" className="block text-base font-semibold text-(--beheer-text-muted) mb-2">Max. deelnemers</label>
                        <input type="number" id="max_sign_ups" name="max_sign_ups" defaultValue={toInputSafe(initialData?.max_sign_ups)} min="0" className={`beheer-input ${formErrors?.max_sign_ups ? 'border-red-500 ring-4 ring-red-500/10' : ''}`} placeholder="Onbeperkt" />
                        {formErrors?.max_sign_ups && <p className="text-red-500 text-sm font-semibold mt-2">{formErrors.max_sign_ups[0]}</p>}
                    </div>
                    <div>
                        <label htmlFor="price_members" className="block text-base font-semibold text-(--beheer-text-muted) mb-2">Leden (€)</label>
                        <input type="number" id="price_members" name="price_members" defaultValue={toInputSafe(initialData?.price_members)} min="0" step="0.01" className="beheer-input" placeholder="0.00" />
                    </div>
                    <div>
                        <label htmlFor="price_non_members" className="block text-base font-semibold text-(--beheer-text-muted) mb-2">Niet-leden (€)</label>
                        <input type="number" id="price_non_members" name="price_non_members" defaultValue={toInputSafe(initialData?.price_non_members)} min="0" step="0.01" className="beheer-input" placeholder="0.00" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6">
                    <div>
                        <label htmlFor="committee_id" className="block text-base font-semibold text-(--beheer-text-muted) mb-2">Organiserende commissie</label>
                        <AdminSelect
                            name="committee_id"
                            defaultValue={toInputSafe(initialData?.committee_id)}
                            onChange={onCommitteeChange}
                            options={[
                                { value: '', label: 'Geen (Algemeen)' },
                                ...committees.map(c => ({ value: String(c.id), label: cleanCommitteeName(c.name) }))
                            ]}
                            size="md"
                        />
                    </div>
                    <div>
                        <label htmlFor="contact" className="block text-base font-semibold text-(--beheer-text-muted) mb-2">Contactpersoon (e-mail)</label>
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

                <label className="relative flex items-center gap-4 bg-(--beheer-card-soft)/50 p-4 rounded-2xl border border-(--beheer-border)/50 cursor-pointer group z-10 mt-auto">
                    <div className="relative flex items-center justify-center">
                        <input type="checkbox" id="only_members" checked={onlyMembers} onChange={(e) => onOnlyMembersChange(e.target.checked)} className="peer sr-only" />
                        <div className="w-5 h-5 border-2 border-(--beheer-border) rounded peer-checked:border-(--beheer-accent) peer-checked:bg-(--beheer-accent) transition-all"></div>
                        <Check className="absolute h-3 w-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                    </div>
                    <span className="text-base font-semibold text-(--beheer-text-muted) group-hover:text-(--beheer-text) transition-colors">Alleen toegankelijk voor leden</span>
                </label>
            </div>
        </div>
    );
}

export function BannerSection({ imagePreview, onUploadClick, onRemoveClick, fileInputRef, onFileChange }: {
    imagePreview: { id: string; type?: string | null } | null,
    onUploadClick: () => void,
    onRemoveClick: () => void,
    fileInputRef: React.RefObject<HTMLInputElement | null>,
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}) {
    return (
        <div className="bg-(--beheer-card-bg) rounded-(--beheer-radius) shadow-xl border border-(--beheer-border) overflow-hidden">
            <div className="px-6 py-4 border-b border-(--beheer-border) bg-(--beheer-card-soft)/50 flex items-center gap-3">
                <Upload className="h-4 w-4 text-(--beheer-accent)" />
                <h2 className="text-base font-semibold text-(--beheer-text)">Banner</h2>
            </div>
            <div className="p-4">
                {!imagePreview ? (
                    <div onClick={onUploadClick} className="flex flex-col items-center justify-center w-full min-h-40 border-2 border-dashed border-(--beheer-border) rounded-xl cursor-pointer hover:border-(--beheer-accent) hover:bg-(--beheer-accent)/5 transition-all bg-(--beheer-card-soft) group">
                        <Upload className="h-6 w-6 mb-2 text-(--beheer-text-muted) group-hover:text-(--beheer-accent) transition-colors" />
                        <span className="text-sm font-semibold text-(--beheer-text-muted) group-hover:text-(--beheer-accent) text-center px-4">Upload banner</span>
                        <input ref={fileInputRef} type="file" accept="image/*,video/*" onChange={onFileChange} className="hidden" />
                    </div>
                ) : (
                    <div className="relative group overflow-hidden rounded-xl border border-(--beheer-border) bg-(--beheer-card-soft)/50 h-40 flex items-center justify-center">
                        <MediaAsset asset={imagePreview} alt="Preview" fill sizes="(max-width: 768px) 100vw, 800px" objectFit="contain" className="object-contain transition-transform duration-700" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                            <button type="button" onClick={onUploadClick} className="beheer-button bg-white text-slate-900 p-2.5 rounded-xl hover:scale-110 transition shadow-xl cursor-pointer"><Upload className="h-4 w-4" /></button>
                            <button type="button" onClick={onRemoveClick} className="beheer-button bg-red-500 text-white p-2.5 rounded-xl hover:scale-110 transition shadow-xl cursor-pointer"><X className="h-4 w-4" /></button>
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
        <div className="bg-(--beheer-card-bg) rounded-(--beheer-radius) shadow-xl border border-(--beheer-border)">
            <div className="px-6 py-4 border-b border-(--beheer-border) bg-(--beheer-card-soft)/50 flex items-center gap-3 rounded-t-(--beheer-radius)">
                <Eye className="h-4 w-4 text-(--beheer-accent)" />
                <h2 className="text-base font-semibold text-(--beheer-text)">Status</h2>
            </div>
            <div className="p-6 space-y-4">
                <label className="relative flex items-center gap-4 cursor-pointer group z-10">
                    <div className="relative flex items-center justify-center">
                        <input type="radio" value="published" checked={status === 'published'} onChange={() => onStatusChange('published')} className="peer sr-only" />
                        <div className="w-5 h-5 border-2 border-(--beheer-border) rounded-full peer-checked:border-(--beheer-accent) peer-checked:bg-(--beheer-accent) transition-all"></div>
                        <div className="absolute w-1.5 h-1.5 bg-white rounded-full opacity-0 peer-checked:opacity-100 transition-opacity"></div>
                    </div>
                    <span className="text-base font-semibold text-(--beheer-text-muted) group-hover:text-(--beheer-text) transition-colors">Gepubliceerd</span>
                </label>
                <label className="relative flex items-center gap-4 cursor-pointer group z-10">
                    <div className="relative flex items-center justify-center">
                        <input type="radio" value="draft" checked={status === 'draft'} onChange={() => onStatusChange('draft')} className="peer sr-only" />
                        <div className="w-5 h-5 border-2 border-(--beheer-border) rounded-full peer-checked:border-(--beheer-accent) peer-checked:bg-(--beheer-accent) transition-all"></div>
                        <div className="absolute w-1.5 h-1.5 bg-white rounded-full opacity-0 peer-checked:opacity-100 transition-opacity"></div>
                    </div>
                    <span className="text-base font-semibold text-(--beheer-text-muted) group-hover:text-(--beheer-text) transition-colors">Concept</span>
                </label>
                <label className="relative flex items-start gap-4 cursor-pointer group z-10">
                    <div className="relative flex items-center justify-center mt-0.5">
                        <input type="radio" value="scheduled" checked={status === 'scheduled'} onChange={() => onStatusChange('scheduled')} className="peer sr-only" />
                        <div className="w-5 h-5 border-2 border-(--beheer-border) rounded-full peer-checked:border-(--beheer-accent) peer-checked:bg-(--beheer-accent) transition-all"></div>
                        <div className="absolute w-1.5 h-1.5 bg-white rounded-full opacity-0 peer-checked:opacity-100 transition-opacity"></div>
                    </div>
                    <div className="flex-1">
                        <span className="text-base font-semibold text-(--beheer-text-muted) group-hover:text-(--beheer-text) transition-colors">Inplannen</span>
                        {status === 'scheduled' && (
                            <div className="mt-2 animate-in slide-in-from-top-2 duration-300">
                                <AdminDatetimepicker
                                    name="publish_date"
                                    defaultValue={formatDateTime(initialData?.publish_date)}
                                />
                            </div>
                        )}
                    </div>
                </label>
            </div>
        </div>
    );
}
