import React from 'react';
import MediaAsset from '@/components/ui/media/MediaAsset';
import { Info, Calendar as CalendarIcon, MapPin, Euro, Link as LinkIcon, Upload, X, Eye, Check } from 'lucide-react';
import { Datepicker } from 'flowbite-react';
import { toLocalISOString } from '@/lib/utils/date-utils';
import { ActivityAdmin } from '@salvemundi/validations';

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

const customDatepickerTheme: React.ComponentProps<typeof Datepicker>['theme'] = {
    root: {
        input: {
            field: {
                icon: {
                    svg: "h-4 w-4 text-[var(--beheer-text-muted)] opacity-60"
                },
                input: {
                    colors: {
                        gray: "bg-[var(--beheer-card-bg)] border border-[var(--beheer-border)] text-[var(--beheer-text)] rounded-[var(--beheer-radius)] font-bold text-sm transition-all focus:ring-4 focus:ring-[var(--beheer-accent)]/10 focus:border-[var(--beheer-accent)] pl-10 pr-3 py-2.5"
                    }
                }
            }
        }
    },
    popup: {
        root: {
            inner: "inline-block rounded-xl bg-[var(--beheer-card-bg)] border border-[var(--beheer-border)] p-4 shadow-xl text-[var(--beheer-text)]"
        },
        header: {
            title: "px-2 py-3 text-center text-sm font-semibold text-[var(--beheer-text)]",
            selectors: {
                button: {
                    base: "rounded-lg px-3 py-1.5 text-xs font-semibold text-[var(--beheer-text)] hover:bg-[var(--beheer-card-soft)]",
                    prev: "text-[var(--beheer-text)] hover:bg-[var(--beheer-card-soft)]",
                    next: "text-[var(--beheer-text)] hover:bg-[var(--beheer-card-soft)]"
                }
            }
        },
        footer: {
            button: {
                today: "bg-[var(--beheer-accent)] text-white hover:bg-[var(--beheer-accent)]/90 text-xs font-bold px-3 py-1.5 rounded-lg",
                clear: "border border-[var(--beheer-border)] text-[var(--beheer-text)] hover:bg-[var(--beheer-card-soft)] text-xs font-bold px-3 py-1.5 rounded-lg"
            }
        }
    },
    views: {
        days: {
            items: {
                item: {
                    base: "block flex-1 cursor-pointer rounded-lg text-center text-xs font-semibold leading-9 text-[var(--beheer-text)] hover:bg-[var(--beheer-card-soft)]",
                    selected: "bg-[var(--beheer-accent)] text-white hover:bg-[var(--beheer-accent)]",
                    disabled: "text-[var(--beheer-text-muted)] opacity-30 cursor-not-allowed"
                }
            }
        }
    }
};

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
                        <label htmlFor="short_description" className="flex items-end justify-between mb-2">
                            <span className="block text-base font-semibold text-[var(--beheer-text-muted)]">Korte beschrijving / TL;DR</span>
                            <span className="text-xs font-normal text-[var(--beheer-text-muted)] opacity-70">
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
        if (date && endDate && endDate < date) {
            setEndDate(null);
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
        <div className="bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] shadow-xl border border-[var(--beheer-border)] overflow-hidden h-full flex flex-col">
            <div className="px-6 py-4 border-b border-[var(--beheer-border)] bg-[var(--beheer-card-soft)]/50 flex items-center gap-3">
                <CalendarIcon className="h-4 w-4 text-[var(--beheer-accent)]" />
                <h2 className="text-base font-semibold text-[var(--beheer-text)]">Planning & locatie</h2>
            </div>
            <div className="p-6 space-y-6 flex-1 flex flex-col">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label htmlFor="event_date" className="block text-base font-semibold text-[var(--beheer-text-muted)] mb-2">Startdatum *</label>
                        <input type="hidden" name="event_date" value={startDate ? toISODateString(startDate) : ''} />
                        <Datepicker
                            theme={customDatepickerTheme}
                            value={startDate}
                            onChange={handleStartDateChange}
                            language="nl"
                            labelTodayButton="Vandaag"
                            labelClearButton="Wissen"
                            weekStart={1}
                            className={formErrors?.event_date ? 'border-red-500' : ''}
                        />
                        {formErrors?.event_date && <p className="text-red-500 text-sm font-semibold mt-2">{formErrors.event_date[0]}</p>}
                    </div>
                    <div>
                        <label htmlFor="event_time" className="block text-base font-semibold text-[var(--beheer-text-muted)] mb-2">Tijd</label>
                        <div className="relative">
                            <input
                                type="time"
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
                                onClick={(e) => e.currentTarget.showPicker()}
                                suppressHydrationWarning
                                className="beheer-input"
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-[var(--beheer-text-muted)] opacity-60">
                                <svg className="w-4 h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
                                </svg>
                            </div>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="event_date_end" className="block text-base font-semibold text-[var(--beheer-text-muted)] mb-2">Einddatum</label>
                        <input type="hidden" name="event_date_end" value={endDate ? toISODateString(endDate) : ''} />
                        <Datepicker
                            theme={customDatepickerTheme}
                            value={endDate}
                            onChange={handleEndDateChange}
                            minDate={startDate || undefined}
                            language="nl"
                            labelTodayButton="Vandaag"
                            labelClearButton="Wissen"
                            weekStart={1}
                            className={formErrors?.event_date_end ? 'border-red-500' : ''}
                        />
                        {formErrors?.event_date_end && <p className="text-red-500 text-sm font-semibold mt-2">{formErrors.event_date_end[0]}</p>}
                    </div>
                    <div>
                        <label htmlFor="event_time_end" className="block text-base font-semibold text-[var(--beheer-text-muted)] mb-2">Eindtijd</label>
                        <div className="relative">
                            <input
                                type="time"
                                id="event_time_end"
                                name="event_time_end"
                                value={endTime}
                                min={minEndTime}
                                onChange={(e) => setEndTime(e.target.value)}
                                onClick={(e) => e.currentTarget.showPicker()}
                                suppressHydrationWarning
                                className="beheer-input"
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-[var(--beheer-text-muted)] opacity-60">
                                <svg className="w-4 h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
                                </svg>
                            </div>
                        </div>
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
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-[var(--beheer-text-muted)] opacity-60">
                                <svg className="w-4 h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 10h16m-8-3V4M7 7V4m10 3V4M5 20h14a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1Zm3-7h.01v.01H8V13Zm4 0h.01v.01H12V13Zm4 0h.01v.01H16V13Zm-8 4h.01v.01H8V17Zm4 0h.01v.01H12V17Zm4 0h.01v.01H16V17Z"/>
                                </svg>
                            </div>
                            <input
                                type="datetime-local"
                                id="registration_deadline"
                                name="registration_deadline"
                                defaultValue={formatDateTime(initialData?.registration_deadline)}
                                max={registrationDeadlineMax}
                                onClick={(e) => e.currentTarget.showPicker()}
                                suppressHydrationWarning
                                className={`beheer-input pl-9 pr-3 ${formErrors?.registration_deadline ? 'border-red-500' : ''}`}
                            />
                        </div>
                        {formErrors?.registration_deadline && <p className="text-red-500 text-sm font-semibold mt-2">{formErrors.registration_deadline[0]}</p>}
                    </div>
                </div>

                <div className="pt-4 mt-auto">
                    <label htmlFor="custom_url" className="block text-base font-semibold text-[var(--beheer-text-muted)] mb-2 flex items-center gap-2">
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
        <div className="bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] shadow-xl border border-[var(--beheer-border)] overflow-hidden h-full flex flex-col">
            <div className="px-6 py-4 border-b border-[var(--beheer-border)] bg-[var(--beheer-card-soft)]/50 flex items-center gap-3">
                <Euro className="h-4 w-4 text-[var(--beheer-accent)]" />
                <h2 className="text-base font-semibold text-[var(--beheer-text)]">Kosten & capaciteit</h2>
            </div>
            <div className="p-6 space-y-6 flex-1 flex flex-col">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label htmlFor="max_sign_ups" className="block text-base font-semibold text-[var(--beheer-text-muted)] mb-2">Max. deelnemers</label>
                        <input type="number" id="max_sign_ups" name="max_sign_ups" defaultValue={toInputSafe(initialData?.max_sign_ups)} min="0" className={`beheer-input ${formErrors?.max_sign_ups ? 'border-red-500 ring-4 ring-red-500/10' : ''}`} placeholder="Onbeperkt" />
                        {formErrors?.max_sign_ups && <p className="text-red-500 text-sm font-semibold mt-2">{formErrors.max_sign_ups[0]}</p>}
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6">
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

                <label className="relative flex items-center gap-4 bg-[var(--beheer-card-soft)]/50 p-4 rounded-2xl border border-[var(--beheer-border)]/50 cursor-pointer group z-10 mt-auto">
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
                        <MediaAsset asset={imagePreview} alt="Preview" fill objectFit="contain" className="object-contain transition-transform duration-700" />
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
                                <input
                                    type="datetime-local"
                                    name="publish_date"
                                    defaultValue={formatDateTime(initialData?.publish_date)}
                                    onClick={(e) => e.currentTarget.showPicker()}
                                    suppressHydrationWarning
                                    className="beheer-input text-sm py-2"
                                />
                            </div>
                        )}
                    </div>
                </label>
            </div>
        </div>
    );
}
