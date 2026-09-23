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
        <div className="overflow-hidden rounded-(--beheer-radius) border border-(--beheer-border) bg-(--beheer-card-bg) shadow-xl">
            <div className="flex items-center gap-3 border-b border-(--beheer-border) bg-(--beheer-card-soft)/50 px-6 py-4">
                <Info className="size-4 text-(--beheer-accent)" />
                <h2 className="text-base font-semibold text-(--beheer-text)">Beschrijving</h2>
            </div>
            <div className="space-y-6 p-6">
                <div className="relative z-10">
                    <label htmlFor="name" className="mb-2 block text-base font-semibold text-(--beheer-text-muted)">Naam van de activiteit *</label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        defaultValue={toInputSafe(initialData?.name)}
                        autoComplete="off"
                        className={`beheer-input ${formErrors?.name ? 'border-red-500 ring-4 ring-red-500/10' : ''}`}
                        placeholder="Bijv. Borrel: Back to School"
                    />
                    {formErrors?.name && <p className="mt-2 text-sm font-semibold text-red-500">{formErrors.name[0]}</p>}
                </div>
                <div className="grid grid-cols-1 gap-6">
                    <div>
                        <label htmlFor="description" className="mb-2 block text-base font-semibold text-(--beheer-text-muted)">Publieke beschrijving *</label>
                        <textarea
                            id="description"
                            name="description"
                            rows={8}
                            defaultValue={toInputSafe(initialData?.description)}
                            className={`beheer-input resize-y font-mono text-sm leading-relaxed ${formErrors?.description ? 'border-red-500 ring-4 ring-red-500/10' : ''}`}
                            placeholder="Plak hier je WhatsApp bericht. Gebruik **tekst** voor dikgedrukt."
                        />
                        {formErrors?.description && <p className="mt-2 text-sm font-semibold text-red-500">{formErrors.description[0]}</p>}
                    </div>
                    <div>
                        <label htmlFor="short_description" className="mb-2 flex items-end justify-between">
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
                            className={`beheer-input resize-y font-mono text-sm leading-relaxed ${formErrors?.short_description ? 'border-red-500 ring-4 ring-red-500/10' : ''}`}
                            placeholder="Bijv. een korte samenvatting of TL;DR voor op de overzichtskaart."
                        />
                        {formErrors?.short_description && <p className="mt-2 text-sm font-semibold text-red-500">{formErrors.short_description[0]}</p>}
                    </div>
                    <div>
                        <label htmlFor="description_logged_in" className="mb-2 flex items-end justify-between">
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
                            className={`beheer-input resize-y font-mono text-sm leading-relaxed ${formErrors?.description_logged_in ? 'border-red-500 ring-4 ring-red-500/10' : ''}`}
                            placeholder="Bijv. verzamelplek, wat mee te nemen..."
                        />
                        {formErrors?.description_logged_in && <p className="mt-2 text-sm font-semibold text-red-500">{formErrors.description_logged_in[0]}</p>}
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

    const initialDeadlineISO = formatDateTime(initialData?.registration_deadline);
    const initialDeadlineDateStr = initialDeadlineISO ? initialDeadlineISO.slice(0, 10) : '';
    const initialDeadlineTimeStr = initialDeadlineISO ? initialDeadlineISO.slice(11, 16) : '';

    const [startDate, setStartDate] = React.useState<Date | null>(
        initialStartDateStr ? new Date(initialStartDateStr) : new Date()
    );
    const [endDate, setEndDate] = React.useState<Date | null>(
        initialEndDateStr ? new Date(initialEndDateStr) : null
    );
    const [startTime, setStartTime] = React.useState<string>(initialStartTimeStr);
    const [endTime, setEndTime] = React.useState<string>(initialEndTimeStr);
    const [deadlineDate, setDeadlineDate] = React.useState<Date | null>(
        initialDeadlineDateStr ? new Date(initialDeadlineDateStr) : null
    );
    const [deadlineTime, setDeadlineTime] = React.useState<string>(initialDeadlineTimeStr);

    const isSameDay = React.useMemo(() => {
        return startDate && endDate && startDate.toDateString() === endDate.toDateString();
    }, [startDate, endDate]);

    const minEndTime = React.useMemo(() => {
        return isSameDay ? startTime || undefined : undefined;
    }, [isSameDay, startTime]);

    const deadlineValue = React.useMemo(() => {
        if (!deadlineDate) return '';
        const dateStr = toISODateString(deadlineDate);
        const timeStr = deadlineTime ? deadlineTime.slice(0, 5) : '23:59';
        return `${dateStr}T${timeStr}`;
    }, [deadlineDate, deadlineTime]);

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

    const handleDeadlineDateChange = (date: Date | null) => {
        setDeadlineDate(date);
        if (date && !deadlineTime) {
            setDeadlineTime('23:59');
        }
        if (!date) {
            setDeadlineTime('');
        }
    };

    const handleClearDeadline = () => {
        setDeadlineDate(null);
        setDeadlineTime('');
    };

    return (
        <div className="flex h-full flex-col rounded-(--beheer-radius) border border-(--beheer-border) bg-(--beheer-card-bg) shadow-xl">
            <div className="flex items-center gap-3 rounded-t-(--beheer-radius) border-b border-(--beheer-border) bg-(--beheer-card-soft)/50 px-6 py-4">
                <CalendarIcon className="size-4 text-(--beheer-accent)" />
                <h2 className="text-base font-semibold text-(--beheer-text)">Planning & locatie</h2>
            </div>
            <div className="flex flex-1 flex-col space-y-6 p-6">
                <div className="space-y-6">
                    <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-start">
                        <div className="min-w-0 flex-1">
                            <label htmlFor="event_date" className="mb-2 block text-base font-semibold text-(--beheer-text-muted)">Startdatum *</label>
                            <input type="hidden" name="event_date" value={startDate ? toISODateString(startDate) : ''} />
                            <AdminDatepicker
                                value={startDate}
                                onChange={handleStartDateChange}
                                className={formErrors?.event_date ? 'border-red-500' : ''}
                            />
                            {formErrors?.event_date && <p className="mt-2 text-sm font-semibold text-red-500">{formErrors.event_date[0]}</p>}
                        </div>
                        <div className="w-full shrink-0 sm:w-36">
                            <label htmlFor="event_time" className="mb-2 block text-base font-semibold text-(--beheer-text-muted)">Starttijd</label>
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

                    <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-start">
                        <div className="min-w-0 flex-1">
                            <label htmlFor="event_date_end" className="mb-2 block text-base font-semibold text-(--beheer-text-muted)">Einddatum</label>
                            <input type="hidden" name="event_date_end" value={endDate ? toISODateString(endDate) : ''} />
                            <AdminDatepicker
                                value={endDate}
                                onChange={handleEndDateChange}
                                minDate={startDate || undefined}
                                className={formErrors?.event_date_end ? 'border-red-500' : ''}
                            />
                            {formErrors?.event_date_end && <p className="mt-2 text-sm font-semibold text-red-500">{formErrors.event_date_end[0]}</p>}
                        </div>
                        <div className="w-full shrink-0 sm:w-36">
                            <label htmlFor="event_time_end" className="mb-2 block text-base font-semibold text-(--beheer-text-muted)">Eindtijd</label>
                            <AdminTimepicker
                                id="event_time_end"
                                name="event_time_end"
                                value={endTime}
                                min={minEndTime}
                                onChange={(e) => setEndTime(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-start">
                        <div className="min-w-0 flex-1">
                            <div className="mb-2 flex items-center justify-between">
                                <label htmlFor="registration_deadline_date" className="block text-base font-semibold text-(--beheer-text-muted)">Inschrijfdeadline</label>
                                {(deadlineDate || deadlineTime) && (
                                    <button
                                        type="button"
                                        onClick={handleClearDeadline}
                                        className="beheer-button flex cursor-pointer items-center gap-1 text-xs font-semibold text-red-500 transition-colors hover:text-red-400"
                                    >
                                        <X className="size-3.5" /> Wissen
                                    </button>
                                )}
                            </div>
                            <input type="hidden" name="registration_deadline" value={deadlineValue} />
                            <AdminDatepicker
                                id="registration_deadline_date"
                                value={deadlineDate}
                                onChange={handleDeadlineDateChange}
                                maxDate={startDate || undefined}
                                className={formErrors?.registration_deadline ? 'border-red-500' : ''}
                            />
                            {formErrors?.registration_deadline && <p className="mt-2 text-sm font-semibold text-red-500">{formErrors.registration_deadline[0]}</p>}
                        </div>
                        <div className="w-full shrink-0 sm:w-36">
                            <div className="mb-2 flex items-center justify-between">
                                <label htmlFor="registration_deadline_time" className="block text-base font-semibold text-(--beheer-text-muted)">Deadlinetijd</label>
                                {!deadlineDate && (
                                    <span className="text-xs text-(--beheer-text-muted) opacity-70"></span>
                                )}
                            </div>
                            <AdminTimepicker
                                id="registration_deadline_time"
                                value={deadlineTime}
                                onChange={(e) => setDeadlineTime(e.target.value)}
                                disabled={!deadlineDate}
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-auto border-t border-(--beheer-border)/50 pt-4">
                    <label htmlFor="location" className="mb-2 flex items-center gap-2 text-base font-semibold text-(--beheer-text-muted)">
                        <MapPin className="size-3" /> Locatie
                    </label>
                    <input type="text" id="location" name="location" defaultValue={toInputSafe(initialData?.location)} className="beheer-input" placeholder="Bijv. Fontys R10" />
                </div>

                <div className="pt-2">
                    <label htmlFor="custom_url" className="mb-2 flex items-center gap-2 text-base font-semibold text-(--beheer-text-muted)">
                        <LinkIcon className="size-3" /> Custom redirect URL
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
        <div className="flex h-full flex-col overflow-hidden rounded-(--beheer-radius) border border-(--beheer-border) bg-(--beheer-card-bg) shadow-xl">
            <div className="flex items-center gap-3 border-b border-(--beheer-border) bg-(--beheer-card-soft)/50 px-6 py-4">
                <Euro className="size-4 text-(--beheer-accent)" />
                <h2 className="text-base font-semibold text-(--beheer-text)">Kosten & capaciteit</h2>
            </div>
            <div className="flex flex-1 flex-col space-y-6 p-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div>
                        <label htmlFor="max_sign_ups" className="mb-2 block text-base font-semibold text-(--beheer-text-muted)">Max. deelnemers</label>
                        <input type="number" id="max_sign_ups" name="max_sign_ups" defaultValue={toInputSafe(initialData?.max_sign_ups)} min="0" className={`beheer-input ${formErrors?.max_sign_ups ? 'border-red-500 ring-4 ring-red-500/10' : ''}`} placeholder="Onbeperkt" />
                        {formErrors?.max_sign_ups && <p className="mt-2 text-sm font-semibold text-red-500">{formErrors.max_sign_ups[0]}</p>}
                    </div>
                    <div>
                        <label htmlFor="price_members" className="mb-2 block text-base font-semibold text-(--beheer-text-muted)">Leden (€)</label>
                        <input type="number" id="price_members" name="price_members" defaultValue={toInputSafe(initialData?.price_members)} min="0" step="0.01" className="beheer-input" placeholder="0.00" />
                    </div>
                    <div>
                        <label htmlFor="price_non_members" className="mb-2 block text-base font-semibold text-(--beheer-text-muted)">Niet-leden (€)</label>
                        <input type="number" id="price_non_members" name="price_non_members" defaultValue={toInputSafe(initialData?.price_non_members)} min="0" step="0.01" className="beheer-input" placeholder="0.00" />
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 pt-6 md:grid-cols-2">
                    <div>
                        <label htmlFor="committee_id" className="mb-2 block text-base font-semibold text-(--beheer-text-muted)">Organiserende commissie</label>
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
                        <label htmlFor="contact" className="mb-2 block text-base font-semibold text-(--beheer-text-muted)">Contactpersoon (e-mail)</label>
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

                <label className="group relative z-10 mt-auto flex cursor-pointer items-center gap-4 rounded-2xl border border-(--beheer-border)/50 bg-(--beheer-card-soft)/50 p-4">
                    <div className="relative flex items-center justify-center">
                        <input type="checkbox" id="only_members" checked={onlyMembers} onChange={(e) => onOnlyMembersChange(e.target.checked)} className="peer sr-only" />
                        <div className="size-5 rounded border-2 border-(--beheer-border) transition-all peer-checked:border-(--beheer-accent) peer-checked:bg-(--beheer-accent)"></div>
                        <Check className="absolute size-3 text-white opacity-0 transition-opacity peer-checked:opacity-100" />
                    </div>
                    <span className="text-base font-semibold text-(--beheer-text-muted) transition-colors group-hover:text-(--beheer-text)">Alleen toegankelijk voor leden</span>
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
        <div className="overflow-hidden rounded-(--beheer-radius) border border-(--beheer-border) bg-(--beheer-card-bg) shadow-xl">
            <div className="flex items-center gap-3 border-b border-(--beheer-border) bg-(--beheer-card-soft)/50 px-6 py-4">
                <Upload className="size-4 text-(--beheer-accent)" />
                <h2 className="text-base font-semibold text-(--beheer-text)">Banner</h2>
            </div>
            <div className="p-4">
                {!imagePreview ? (
                    <div onClick={onUploadClick} className="group flex min-h-40 w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-(--beheer-border) bg-(--beheer-card-soft) transition-all hover:border-(--beheer-accent) hover:bg-(--beheer-accent)/5">
                        <Upload className="mb-2 size-6 text-(--beheer-text-muted) transition-colors group-hover:text-(--beheer-accent)" />
                        <span className="px-4 text-center text-sm font-semibold text-(--beheer-text-muted) group-hover:text-(--beheer-accent)">Upload banner</span>
                        <input ref={fileInputRef} type="file" accept="image/*,video/*" onChange={onFileChange} className="hidden" />
                    </div>
                ) : (
                    <div className="group relative flex h-40 items-center justify-center overflow-hidden rounded-xl border border-(--beheer-border) bg-(--beheer-card-soft)/50">
                        <MediaAsset asset={imagePreview} alt="Preview" fill sizes="(max-width: 768px) 100vw, 800px" objectFit="contain" className="object-contain transition-transform duration-700" />
                        <div className="absolute inset-0 flex items-center justify-center gap-3 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                            <button type="button" onClick={onUploadClick} className="beheer-button cursor-pointer rounded-xl bg-white p-2.5 text-slate-900 shadow-xl transition hover:scale-110"><Upload className="size-4" /></button>
                            <button type="button" onClick={onRemoveClick} className="beheer-button cursor-pointer rounded-xl bg-red-500 p-2.5 text-white shadow-xl transition hover:scale-110"><X className="size-4" /></button>
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
        <div className="rounded-(--beheer-radius) border border-(--beheer-border) bg-(--beheer-card-bg) shadow-xl">
            <div className="flex items-center gap-3 rounded-t-(--beheer-radius) border-b border-(--beheer-border) bg-(--beheer-card-soft)/50 px-6 py-4">
                <Eye className="size-4 text-(--beheer-accent)" />
                <h2 className="text-base font-semibold text-(--beheer-text)">Status</h2>
            </div>
            <div className="space-y-4 p-6">
                <label className="group relative z-10 flex cursor-pointer items-center gap-4">
                    <div className="relative flex items-center justify-center">
                        <input type="radio" value="published" checked={status === 'published'} onChange={() => onStatusChange('published')} className="peer sr-only" />
                        <div className="size-5 rounded-full border-2 border-(--beheer-border) transition-all peer-checked:border-(--beheer-accent) peer-checked:bg-(--beheer-accent)"></div>
                        <div className="absolute size-1.5 rounded-full bg-white opacity-0 transition-opacity peer-checked:opacity-100"></div>
                    </div>
                    <span className="text-base font-semibold text-(--beheer-text-muted) transition-colors group-hover:text-(--beheer-text)">Gepubliceerd</span>
                </label>
                <label className="group relative z-10 flex cursor-pointer items-center gap-4">
                    <div className="relative flex items-center justify-center">
                        <input type="radio" value="draft" checked={status === 'draft'} onChange={() => onStatusChange('draft')} className="peer sr-only" />
                        <div className="size-5 rounded-full border-2 border-(--beheer-border) transition-all peer-checked:border-(--beheer-accent) peer-checked:bg-(--beheer-accent)"></div>
                        <div className="absolute size-1.5 rounded-full bg-white opacity-0 transition-opacity peer-checked:opacity-100"></div>
                    </div>
                    <span className="text-base font-semibold text-(--beheer-text-muted) transition-colors group-hover:text-(--beheer-text)">Concept</span>
                </label>
                <label className="group relative z-10 flex cursor-pointer items-start gap-4">
                    <div className="relative mt-0.5 flex items-center justify-center">
                        <input type="radio" value="scheduled" checked={status === 'scheduled'} onChange={() => onStatusChange('scheduled')} className="peer sr-only" />
                        <div className="size-5 rounded-full border-2 border-(--beheer-border) transition-all peer-checked:border-(--beheer-accent) peer-checked:bg-(--beheer-accent)"></div>
                        <div className="absolute size-1.5 rounded-full bg-white opacity-0 transition-opacity peer-checked:opacity-100"></div>
                    </div>
                    <div className="flex-1">
                        <span className="text-base font-semibold text-(--beheer-text-muted) transition-colors group-hover:text-(--beheer-text)">Inplannen</span>
                        {status === 'scheduled' && (
                            <div className="animate-in slide-in-from-top-2 mt-2 duration-300">
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
