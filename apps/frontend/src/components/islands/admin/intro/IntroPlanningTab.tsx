'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
    Plus,
    X,
    Save,
    Edit,
    Trash,
    List,
    LayoutGrid,
    Calendar,
    Image as ImageIcon,
    Camera,
    Trash2,
    Loader2,
    FileText,
    Upload
} from 'lucide-react';
import { formatDate } from '@/shared/lib/utils/date';
import { toISODate } from '@/lib/utils/date-utils';
import type { IntroPlanningItem } from '@salvemundi/validations/schema/intro.zod';
import { ActionButton, EmptyState, Field, inputClass, Button } from './IntroTabComponents';
import { AdminDatepicker } from '@/components/ui/forms/AdminDatepicker';
import { AdminTimepicker } from '@/components/ui/forms/AdminTimepicker';
import { getImageUrl } from '@/lib/utils/image-utils';
import {
    uploadIntroPlanningImage,
    removeIntroPlanningImage,
    uploadIntroInfoBooklet,
    removeIntroInfoBooklet
} from '@/server/actions/admin/intro/admin-intro-core.actions';

interface Props {
    planning: IntroPlanningItem[];
    onSave: (item: Partial<IntroPlanningItem>) => Promise<number | null>;
    onDelete: (id: number) => Promise<void>;
    saving: boolean;
    deletingId: number | null;
    initialPlanningImage: string | null;
    initialInfoBooklet: string | null;
}

const DAY_ORDER = ['maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag', 'zondag'];

export default function IntroPlanningTab({ planning, onSave, onDelete, saving, deletingId, initialPlanningImage, initialInfoBooklet }: Props) {
    const [editingPlanning, setEditingPlanning] = useState<Partial<IntroPlanningItem> | null>(null);
    const [view, setView] = useState<'calendar' | 'list'>('list');

    const [planningImage, setPlanningImage] = useState<string | null>(initialPlanningImage);
    const [imagePreview, setImagePreview] = useState<string | null>(
        initialPlanningImage ? getImageUrl(initialPlanningImage, { width: 1200, fit: 'inside' }) : null
    );
    const [uploadingImage, setUploadingImage] = useState(false);
    const [imageUploadError, setImageUploadError] = useState<string | null>(null);

    const handlePlanningImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;

        setImagePreview(URL.createObjectURL(file));
        setUploadingImage(true);
        setImageUploadError(null);

        const formData = new FormData();
        formData.append('image', file);
        const result = await uploadIntroPlanningImage(formData);
        setUploadingImage(false);

        if (!result.success) {
            setImageUploadError(result.error);
            setImagePreview(planningImage ? getImageUrl(planningImage, { width: 1200, fit: 'inside' }) : null);
            return;
        }
        setPlanningImage(result.data);
        setImagePreview(getImageUrl(result.data, { width: 1200, fit: 'inside' }));
    };

    const handleRemovePlanningImage = async () => {
        setUploadingImage(true);
        setImageUploadError(null);
        const result = await removeIntroPlanningImage();
        setUploadingImage(false);
        if (!result.success) {
            setImageUploadError(result.error || 'Verwijderen mislukt');
            return;
        }
        setPlanningImage(null);
        setImagePreview(null);
    };

    const [infoBooklet, setInfoBooklet] = useState<string | null>(initialInfoBooklet);
    const [bookletFileName, setBookletFileName] = useState<string | null>(null);
    const [uploadingBooklet, setUploadingBooklet] = useState(false);
    const [bookletUploadError, setBookletUploadError] = useState<string | null>(null);

    const handleInfoBookletChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;

        setBookletFileName(file.name);
        setUploadingBooklet(true);
        setBookletUploadError(null);

        const formData = new FormData();
        formData.append('document', file);
        const result = await uploadIntroInfoBooklet(formData);
        setUploadingBooklet(false);

        if (!result.success) {
            setBookletUploadError(result.error);
            setBookletFileName(null);
            return;
        }
        setInfoBooklet(result.data);
    };

    const handleRemoveInfoBooklet = async () => {
        setUploadingBooklet(true);
        setBookletUploadError(null);
        const result = await removeIntroInfoBooklet();
        setUploadingBooklet(false);
        if (!result.success) {
            setBookletUploadError(result.error || 'Verwijderen mislukt');
            return;
        }
        setInfoBooklet(null);
        setBookletFileName(null);
    };

    const [scrollToId, setScrollToId] = useState<number | null>(null);

    const handleSave = async () => {
        if (!editingPlanning) return;
        const savedId = await onSave(editingPlanning);
        setEditingPlanning(null);
        setScrollToId(savedId);
    };

    const editFormRef = useRef<HTMLDivElement>(null);
    const editingKeyRef = useRef<number | 'new' | null>(null);
    useEffect(() => {
        const key = editingPlanning ? (editingPlanning.id ?? 'new') : null;
        if (key !== null && key !== editingKeyRef.current) {
            editFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        editingKeyRef.current = key;
    }, [editingPlanning]);

    const itemRefs = useRef(new Map<number, HTMLDivElement>());
    const setItemRef = (id: number | undefined) => (el: HTMLDivElement | null) => {
        if (id === undefined) return;
        if (el) itemRefs.current.set(id, el);
        else itemRefs.current.delete(id);
    };
    useEffect(() => {
        if (scrollToId === null) return;
        const el = itemRefs.current.get(scrollToId);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        setScrollToId(null);
    }, [scrollToId, planning]);

    const [dayFilter, setDayFilter] = useState<string | null>(null);
    const availableDays = useMemo(() => {
        const days = new Set<string>();
        planning.forEach(item => {
            if (item.day) days.add(item.day.toLowerCase());
        });
        return Array.from(days).sort((a, b) => {
            const ai = DAY_ORDER.indexOf(a);
            const bi = DAY_ORDER.indexOf(b);
            if (ai === -1 && bi === -1) return a.localeCompare(b);
            if (ai === -1) return 1;
            if (bi === -1) return -1;
            return ai - bi;
        });
    }, [planning]);
    const filteredPlanningList = useMemo(() => {
        if (!dayFilter) return planning;
        return planning.filter(item => (item.day || '').toLowerCase() === dayFilter);
    }, [planning, dayFilter]);

    return (
        <div>
            <div className="bg-(--beheer-card-bg) rounded-(--beheer-radius) border border-(--beheer-border) p-6 mb-8 shadow-sm">
                <h3 className="font-semibold text-xs text-(--beheer-text-muted) mb-4">Planning-afbeelding (bovenaan de publieke QR-code pagina)</h3>
                <div className="flex flex-col sm:flex-row items-start gap-5">
                    <div className="relative w-full sm:w-64 aspect-video shrink-0 rounded-xl overflow-hidden bg-(--beheer-card-soft) ring-1 ring-(--beheer-border) flex items-center justify-center">
                        {imagePreview ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={imagePreview} alt="Voorbeeld" className="h-full w-full object-cover" />
                        ) : (
                            <ImageIcon className="h-6 w-6 text-(--beheer-text-muted) opacity-40" />
                        )}
                        {uploadingImage && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <Loader2 className="h-5 w-5 text-white animate-spin" />
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col gap-2">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => { void handlePlanningImageChange(e); }}
                            className="hidden"
                            id="planning-image-upload"
                        />
                        <label
                            htmlFor="planning-image-upload"
                            className="btn-upload-photo cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-(--beheer-accent)/10 text-(--beheer-accent) border border-(--beheer-accent)/20 text-sm font-semibold hover:bg-(--beheer-accent)/20 transition-all w-fit"
                        >
                            <Camera className="h-4 w-4" />
                            {imagePreview ? 'Andere afbeelding kiezen' : 'Afbeelding uploaden'}
                        </label>
                        {imagePreview && (
                            <button
                                type="button"
                                onClick={() => { void handleRemovePlanningImage(); }}
                                className="btn-remove-photo inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-red-500 hover:bg-red-500/10 transition-all w-fit"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                                Verwijderen
                            </button>
                        )}
                        {imageUploadError && (
                            <p className="text-xs font-semibold text-red-500">{imageUploadError}</p>
                        )}
                        {!imagePreview && !imageUploadError && (
                            <p className="text-xs text-(--beheer-text-muted) opacity-70 max-w-sm">Optioneel. Bijv. een ontworpen posterafbeelding van de planning. Als je niets uploadt, toont de pagina alleen de live planning hieronder.</p>
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-(--beheer-card-bg) rounded-(--beheer-radius) border border-(--beheer-border) p-6 mb-8 shadow-sm">
                <h3 className="font-semibold text-xs text-(--beheer-text-muted) mb-4">Infoboekje (PDF, downloadbaar op de publieke QR-code pagina)</h3>
                <div className="flex flex-col sm:flex-row items-start gap-5">
                    <div className="relative h-16 w-16 shrink-0 rounded-xl overflow-hidden bg-(--beheer-card-soft) ring-1 ring-(--beheer-border) flex items-center justify-center">
                        <FileText className={`h-6 w-6 ${infoBooklet ? 'text-(--beheer-accent)' : 'text-(--beheer-text-muted) opacity-40'}`} />
                        {uploadingBooklet && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <Loader2 className="h-5 w-5 text-white animate-spin" />
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col gap-2">
                        <input
                            type="file"
                            accept="application/pdf,.pdf"
                            onChange={(e) => { void handleInfoBookletChange(e); }}
                            className="hidden"
                            id="info-booklet-upload"
                        />
                        <label
                            htmlFor="info-booklet-upload"
                            className="btn-upload-booklet cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-(--beheer-accent)/10 text-(--beheer-accent) border border-(--beheer-accent)/20 text-sm font-semibold hover:bg-(--beheer-accent)/20 transition-all w-fit"
                        >
                            <Upload className="h-4 w-4" />
                            {infoBooklet ? 'Ander bestand kiezen' : 'PDF uploaden'}
                        </label>
                        {infoBooklet && (
                            <div className="flex items-center gap-3">
                                <a
                                    href={`/api/assets/${infoBooklet}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs font-semibold text-(--beheer-accent) hover:underline"
                                >
                                    {bookletFileName || 'Huidig bestand bekijken'}
                                </a>
                                <button
                                    type="button"
                                    onClick={() => { void handleRemoveInfoBooklet(); }}
                                    className="btn-remove-booklet inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-red-500 hover:bg-red-500/10 transition-all w-fit"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    Verwijderen
                                </button>
                            </div>
                        )}
                        {bookletUploadError && (
                            <p className="text-xs font-semibold text-red-500">{bookletUploadError}</p>
                        )}
                        {!infoBooklet && !bookletUploadError && (
                            <p className="text-xs text-(--beheer-text-muted) opacity-70 max-w-sm">Optioneel. Bijv. een programmaboekje met praktische info. Nieuwkomers kunnen dit downloaden op de QR-code pagina.</p>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between mb-8">
                {editingPlanning === null && (
                    <Button
                        onClick={() => setEditingPlanning({ date: '', time_start: '', title: '', description: '' })}
                        icon={Plus}
                    >
                        Nieuw Item
                    </Button>
                )}
                <div className="flex gap-1 bg-(--beheer-card-bg) border border-(--beheer-border) rounded-(--beheer-radius) p-1.5 ml-auto shadow-sm">
                    <button onClick={() => setView('list')} className={`tab-button flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${view === 'list' ? 'bg-(--beheer-accent) text-white shadow-md' : 'text-(--beheer-text-muted) hover:text-(--beheer-text)'}`}>
                        <List className="h-4 w-4" /> Lijst
                    </button>
                    <button onClick={() => setView('calendar')} className={`tab-button flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${view === 'calendar' ? 'bg-(--beheer-accent) text-white shadow-md' : 'text-(--beheer-text-muted) hover:text-(--beheer-text)'}`}>
                        <LayoutGrid className="h-4 w-4" /> Kalender
                    </button>
                </div>
            </div>

            {availableDays.length > 0 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1 mb-6 -mx-1 px-1">
                    <button
                        onClick={() => setDayFilter(null)}
                        className={`tab-button shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold capitalize transition-all whitespace-nowrap ${dayFilter === null ? 'bg-(--beheer-accent) text-white shadow-md' : 'bg-(--beheer-card-bg) border border-(--beheer-border) text-(--beheer-text-muted) hover:text-(--beheer-text)'}`}
                    >
                        Alle dagen
                    </button>
                    {availableDays.map(day => (
                        <button
                            key={day}
                            onClick={() => setDayFilter(day)}
                            className={`tab-button shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold capitalize transition-all whitespace-nowrap ${dayFilter === day ? 'bg-(--beheer-accent) text-white shadow-md' : 'bg-(--beheer-card-bg) border border-(--beheer-border) text-(--beheer-text-muted) hover:text-(--beheer-text)'}`}
                        >
                            {day}
                        </button>
                    ))}
                </div>
            )}

            {editingPlanning !== null && (
                <div ref={editFormRef} className="bg-(--beheer-card-bg) rounded-(--beheer-radius) border border-(--beheer-border) p-8 mb-8 shadow-2xl scroll-mt-24">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="font-semibold text-xs text-(--beheer-text-muted)">
                            {editingPlanning.id ? 'Planning Bewerken' : 'Nieuw Planning Item'}
                        </h3>
                        <button onClick={() => setEditingPlanning(null)} className="icon-button p-2 text-(--beheer-text-muted) hover:text-(--beheer-text) transition-colors">
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Field label="Datum *">
                            <AdminDatepicker
                                value={editingPlanning.date ? new Date(editingPlanning.date) : null}
                                onChange={(date) => setEditingPlanning({ ...editingPlanning, date: toISODate(date) })}
                            />
                        </Field>
                        <Field label="Starttijd *">
                            <AdminTimepicker
                                value={editingPlanning.time_start || ''}
                                onChange={e => setEditingPlanning({ ...editingPlanning, time_start: e.target.value })}
                            />
                        </Field>
                        <Field label="Eindtijd">
                            <AdminTimepicker
                                value={editingPlanning.time_end || ''}
                                onChange={e => setEditingPlanning({ ...editingPlanning, time_end: e.target.value })}
                            />
                        </Field>
                        <div className="md:col-span-2">
                            <Field label="Titel *">
                                <input type="text" value={editingPlanning.title || ''} onChange={e => setEditingPlanning({ ...editingPlanning, title: e.target.value })} className={`beheer-input ${inputClass}`} placeholder="Activiteit titel..." />
                            </Field>
                        </div>
                        <Field label="Locatie">
                            <input type="text" value={editingPlanning.location || ''} onChange={e => setEditingPlanning({ ...editingPlanning, location: e.target.value })} className={`beheer-input ${inputClass}`} placeholder="Bv. TU/e Gemini" />
                        </Field>
                        <div className="md:col-span-3">
                            <Field label="Beschrijving">
                                <textarea value={editingPlanning.description || ''} onChange={e => setEditingPlanning({ ...editingPlanning, description: e.target.value })} rows={4} className={`beheer-input ${inputClass}`} placeholder="Wat gaan we doen?" />
                                <p className="mt-1.5 text-xs text-(--beheer-text-muted) opacity-60">
                                    Opmaak: **vet**, *cursief*, __onderstreept__. Enters blijven behouden.
                                </p>
                            </Field>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-10 border-t border-(--beheer-border)/50 mt-10">
                        <Button
                            onClick={() => { void handleSave(); }}
                            loading={saving}
                            icon={Save}
                            disabled={!editingPlanning.date || !editingPlanning.time_start || !editingPlanning.title}
                        >
                            Opslaan
                        </Button>
                        <Button onClick={() => setEditingPlanning(null)} variant="ghost" icon={X}>
                            Annuleren
                        </Button>
                    </div>
                </div>
            )}

            {view === 'list' && (
                <div className="grid gap-4">
                    {filteredPlanningList.map(item => (
                        <div key={item.id} ref={setItemRef(item.id)} className="group bg-(--beheer-card-bg) rounded-(--beheer-radius) border border-(--beheer-border) p-6 flex items-start justify-between gap-6 hover:border-(--beheer-accent)/30 transition-all shadow-sm hover:shadow-xl scroll-mt-24">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-xs font-semibold text-(--beheer-accent) bg-(--beheer-accent)/5 px-2 py-0.5 rounded">{item.day || ''}</span>
                                    {item.date && <span className="text-xs font-semibold text-(--beheer-text-muted)">{formatDate(item.date)}</span>}
                                </div>
                                <h4 className="font-semibold text-base text-(--beheer-text)">{item.title}</h4>
                                <p className="text-xs font-medium text-(--beheer-text-muted) mt-1 opacity-70">
                                    {item.time_start}{item.time_end ? ` - ${item.time_end}` : ''}{item.location ? ` · ${item.location}` : ''}
                                </p>
                                {item.description && <p className="text-sm text-(--beheer-text-muted) mt-4 font-medium leading-relaxed">{item.description}</p>}
                            </div>
                            <div className="flex gap-2 shrink-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                <ActionButton
                                    icon={Edit}
                                    onClick={() => setEditingPlanning(item)}
                                    title="Bewerken"
                                />
                                <ActionButton
                                    icon={Trash}
                                    onClick={() => {
                                        void onDelete(item.id);
                                    }}
                                    variant="danger"
                                    disabled={deletingId === item.id}
                                    title="Verwijderen"
                                />
                            </div>
                        </div>
                    ))}
                    {filteredPlanningList.length === 0 && planning.length > 0 && (
                        <EmptyState icon={Calendar} text="Geen activiteiten op deze dag" />
                    )}
                    {planning.length === 0 && (
                        <EmptyState icon={Calendar} text="Nog geen planning items aangemaakt" />
                    )}
                </div>
            )}

            {view === 'calendar' && planning.length > 0 && (() => {
                const byDay = planning.reduce((acc, item) => {
                    const key = (item.day || 'overig').toLowerCase();
                    const group = acc.get(key) || [];
                    group.push(item);
                    acc.set(key, group);
                    return acc;
                }, new Map<string, IntroPlanningItem[]>());

                const sorted = Array.from(byDay.keys())
                    .filter(day => !dayFilter || day === dayFilter)
                    .sort((a, b) => DAY_ORDER.indexOf(a as string) - DAY_ORDER.indexOf(b as string));
                return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {sorted.map(day => (
                            <div key={day as string} className="bg-(--beheer-card-bg) rounded-(--beheer-radius) border border-(--beheer-border) p-6 shadow-sm">
                                <h3 className="font-semibold text-(--beheer-accent) text-xs mb-6 capitalize pb-3 border-b border-(--beheer-border)">{day as string}</h3>
                                <div className="space-y-3">
                                    {(byDay.get(day) || []).sort((a, b) => (String(a.time_start || '')).localeCompare(String(b.time_start || ''))).map(item => (
                                        <div key={item.id as string | number} ref={setItemRef(item.id)} className="group bg-(--beheer-card-soft) rounded-xl p-4 border border-transparent hover:border-(--beheer-accent)/20 transition-all scroll-mt-24">
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <p className="font-semibold text-sm text-(--beheer-text) mb-1">{item.title as React.ReactNode}</p>
                                                    <p className="text-xs font-medium text-(--beheer-text-muted) opacity-70">{item.time_start ? String(item.time_start) : ''}{item.time_end ? ` - ${String(item.time_end)}` : ''}</p>
                                                </div>
                                                <div className="flex gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                    <ActionButton
                                                        icon={Edit}
                                                        onClick={() => setEditingPlanning(item)}
                                                        title="Bewerken"
                                                    />
                                                    <ActionButton
                                                        icon={Trash}
                                                        onClick={() => {
                                                            void onDelete(item.id);
                                                        }}
                                                        variant="danger"
                                                        disabled={deletingId === item.id}
                                                        title="Verwijderen"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                );
            })()}
            {view === 'calendar' && planning.length === 0 && (
                <EmptyState icon={Calendar} text="Nog geen planning items aangemaakt" />
            )}
        </div>
    );
}