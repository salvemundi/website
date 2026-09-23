'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
    Plus,
    Save,
    X,
    Loader2,
    Euro,
    List,
    Trash,
    Upload,
    Info
} from 'lucide-react';
import { Field, inputClass } from './ReisTabComponents';
import { type ActivityOption } from '@/lib/reis';
import MediaAsset from '@/components/ui/media/MediaAsset';

import { type TripActivity } from '@salvemundi/validations/schema/admin-trip.zod';


interface Props {
    activity: Partial<TripActivity> | null;
    onSave: (formData: FormData, options: ActivityOption[]) => Promise<void>;
    onCancel: () => void;
    pending: boolean;
}

export default function ReisActivityForm({ activity, onSave, onCancel, pending }: Props) {
    // Map existing options, handling nulls from the schema type
    const initialOptions = (activity?.options || []).map(opt => ({
        id: opt.id || '',
        name: opt.name || '',
        price: opt.price || 0
    }));
    const [options, setOptions] = useState<ActivityOption[]>(initialOptions);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [imagePreview, setImagePreview] = useState<string | { id: string; type?: string | null } | null>(null);
    const [existingImageId, setExistingImageId] = useState<string | null>(null);
    const [imageError, setImageError] = useState<string | null>(null);

    // Sync options and image if activity prop changes (e.g. after failed submission with initialData)
    useEffect(() => {
        if (activity) {
            if (activity.options) {
                setOptions((activity.options as ActivityOption[]).map((opt) => ({
                    id: opt.id || '',
                    name: opt.name || '',
                    price: opt.price || 0
                })));
            }
            if (activity.image) {
                const rawImage = activity.image as unknown as string | { id: string; type?: string | null } | null;
                const imageId = rawImage && typeof rawImage === 'object' ? rawImage.id : (rawImage as string | null);
                setImagePreview(rawImage);
                setExistingImageId(imageId);
            } else {
                setImagePreview(null);
                setExistingImageId(null);
            }
        }
    }, [activity]);

    const addOption = () => setOptions([...options, { id: `opt-${options.length}`, name: '', price: 0 }]);
    const removeOption = (idx: number) => setOptions(options.filter((_, i) => i !== idx));
    const updateOption = (idx: number, field: keyof ActivityOption, value: string) => {
        setOptions(options.map((opt, i) =>
            i === idx ? { ...opt, [field]: field === 'price' ? parseFloat(value) || 0 : value } : opt
        ));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        setImageError(null);

        if (file) {
            const maxSizeBytes = 10 * 1024 * 1024;
            if (file.size > maxSizeBytes) {
                setImageError('Het geselecteerde bestand is te groot (maximaal 10MB).');
                e.target.value = '';
                return;
            }

            setExistingImageId(null);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = () => {
        setImagePreview(null);
        setImageError(null);
        setExistingImageId(null);
    };

    const handleSubmit = (e: React.SyntheticEvent) => {
        e.preventDefault();
        if (imageError) return;
        const formData = new FormData(e.currentTarget as HTMLFormElement);
        void onSave(formData, options);
    };

    return (
        <div className="group/form relative mb-10 overflow-hidden rounded-3xl border border-(--beheer-border) bg-(--beheer-card-bg) p-8 shadow-2xl">
            <div className="absolute -top-24 -right-24 size-48 rounded-full bg-(--beheer-accent)/5 blur-3xl transition-colors duration-700 group-hover/form:bg-(--beheer-accent)/10" />

            <div className="relative z-10 mb-8 flex items-center justify-between">
                <h2 className="flex items-center gap-3 text-xl font-semibold tracking-tight text-(--beheer-text)">
                    <div className="rounded-xl bg-(--beheer-accent)/10 p-2.5 text-(--beheer-accent) shadow-sm">
                        {activity?.id ? <Save className="size-5" /> : <Plus className="size-5" />}
                    </div>
                    {activity?.id ? 'Bewerken' : 'Nieuwe Activiteit'}
                </h2>
                <button onClick={onCancel} className="icon-button rounded-xl bg-(--beheer-card-soft) p-3 text-(--beheer-text-muted) transition-all hover:bg-(--beheer-card-soft)/80 hover:text-(--beheer-text) active:scale-90"><X className="size-5" /></button>
            </div>

            <form onSubmit={handleSubmit} className="relative z-10 space-y-10">
                {activity?.id && <input type="hidden" name="id" value={activity.id} />}
                <input type="hidden" name="existing_image_id" value={existingImageId || ''} />

                {imageError && (
                    <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-[10px] font-semibold tracking-widest text-red-500 uppercase">
                        <Info className="size-4 shrink-0" />
                        <span>{imageError}</span>
                    </div>
                )}

                <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
                    <div className="space-y-6 lg:col-span-7">
                        <Field label="Naam *">
                            <input type="text" name="name" defaultValue={activity?.name || ''} required className={`beheer-input ${inputClass}`} placeholder="Bijv. Skiën" />
                        </Field>
                        <Field label="Beschrijving">
                            <textarea name="description" rows={5} defaultValue={activity?.description || ''} className={`beheer-input ${inputClass} resize-none`} placeholder="Wat houdt deze activiteit precies in?" />
                        </Field>
                    </div>

                    <div className="grid grid-cols-2 gap-6 lg:col-span-5">
                        <div className="col-span-2">
                            <Field label="Afbeelding">
                                {!imagePreview ? (
                                    <div onClick={() => fileInputRef.current?.click()} className="group flex min-h-32 w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-(--beheer-border) bg-(--beheer-card-soft)/30 py-4 transition-all hover:border-(--beheer-accent) hover:bg-(--beheer-accent)/5">
                                        <Upload className="mb-1.5 size-5 text-(--beheer-text-muted) transition-colors group-hover:text-(--beheer-accent)" />
                                        <span className="px-4 text-center text-[9px] font-semibold tracking-widest text-(--beheer-text-muted) group-hover:text-(--beheer-accent)">Upload afbeelding</span>
                                        <input ref={fileInputRef} type="file" name="image_file" accept="image/*" onChange={handleImageChange} className="hidden" />
                                    </div>
                                ) : (
                                    <div className="group relative flex h-32 items-center justify-center overflow-hidden rounded-2xl border border-(--beheer-border) bg-(--beheer-card-soft)/50">
                                        <MediaAsset
                                            asset={imagePreview}
                                            alt="Preview"
                                            fill
                                            objectFit="contain"
                                            unoptimized
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center gap-3 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                                            <button type="button" onClick={() => fileInputRef.current?.click()} className="icon-button cursor-pointer rounded-xl bg-white p-2 text-slate-900 shadow-xl transition hover:scale-110"><Upload className="size-4" /></button>
                                            <button type="button" onClick={handleRemoveImage} className="icon-button cursor-pointer rounded-xl bg-red-500 p-2 text-white shadow-xl transition hover:scale-110"><X className="size-4" /></button>
                                        </div>
                                        <input ref={fileInputRef} type="file" name="image_file" accept="image/*" onChange={handleImageChange} className="hidden" />
                                    </div>
                                )}
                            </Field>
                        </div>
                        <div className="col-span-2">
                            <Field label="Basisprijs (€) *">
                                <div className="relative">
                                    <Euro className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-(--beheer-text-muted) opacity-40" />
                                    <input type="number" step="0.01" name="price" defaultValue={activity?.price || 0} required className={`beheer-input ${inputClass} pl-12`} />
                                </div>
                            </Field>
                        </div>
                        <Field label="Max Reizigers">
                            <input type="number" name="max_participants" defaultValue={activity?.max_participants || ''} placeholder="Onbeperkt" className={`beheer-input ${inputClass}`} />
                        </Field>
                        <Field label="Sorteer Volgorde">
                            <input type="number" name="display_order" defaultValue={activity?.display_order || 0} className={`beheer-input ${inputClass}`} />
                        </Field>
                        <div className="col-span-2 flex items-center pt-2">
                            <label className="group flex cursor-pointer items-center gap-4 rounded-2xl border border-(--beheer-border)/20 bg-(--beheer-card-soft)/50 px-6 py-4 transition-all select-none hover:border-(--beheer-accent)/30">
                                <div className="relative">
                                    <input type="checkbox" name="is_active" className="peer sr-only" defaultChecked={activity?.is_active ?? true} />
                                    <div className="h-6 w-11 rounded-full border border-(--beheer-border)/30 bg-(--beheer-border)/20 shadow-inner backdrop-blur-md transition-all peer-checked:bg-(--beheer-accent) dark:bg-white/5" />
                                    <div className="absolute top-1 left-1 size-4 transform rounded-full bg-white shadow-lg transition-all peer-checked:left-6 peer-active:scale-90" />
                                </div>
                                <span className="text-[10px] font-semibold text-(--beheer-text-muted) opacity-70 transition-colors group-hover:text-(--beheer-text)">Activiteit is zichtbaar</span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Options Management */}
                <div className="space-y-8 rounded-3xl border border-(--beheer-border)/30 bg-(--beheer-card-soft)/30 p-8">
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                        <div className="space-y-1">
                            <h3 className="flex items-center gap-3 text-sm font-semibold text-(--beheer-text)">
                                <List className="size-4 text-(--beheer-accent)" /> Sub-opties
                            </h3>
                            <p className="text-[10px] font-semibold text-(--beheer-text-muted) opacity-60">Optionele keuzes voor deze activiteit</p>
                        </div>
                        <button type="button" onClick={addOption} className="beheer-button flex items-center justify-center gap-2 rounded-xl border border-(--beheer-accent)/20 bg-(--beheer-accent)/5 px-6 py-3 text-[10px] font-semibold text-(--beheer-accent) transition-all hover:bg-(--beheer-accent)/10 active:scale-95">
                            <Plus className="size-4" /> Optie toevoegen
                        </button>
                    </div>

                    <div className="flex flex-wrap gap-8 rounded-2xl border border-(--beheer-border)/10 bg-(--beheer-card-bg)/50 p-6 shadow-inner">
                        <label className="group flex cursor-pointer items-center gap-3 select-none">
                            <div className="relative flex h-5 items-center">
                                <input type="radio" name="max_selections" value="" defaultChecked={activity?.max_selections === null || !activity?.id} className="peer sr-only" />
                                <div className="flex size-5 items-center justify-center rounded-lg border-2 border-(--beheer-border)/50 shadow-sm transition-all peer-checked:border-(--beheer-accent) peer-checked:bg-(--beheer-accent)">
                                    <div className="size-2 rounded-sm bg-white opacity-0 transition-opacity peer-checked:opacity-100" />
                                </div>
                            </div>
                            <span className="text-[10px] font-semibold text-(--beheer-text-muted) transition-colors group-hover:text-(--beheer-accent)">Checkbox (Meerdere)</span>
                        </label>
                        <label className="group flex cursor-pointer items-center gap-3 select-none">
                            <div className="relative flex h-5 items-center">
                                <input type="radio" name="max_selections" value="1" defaultChecked={activity?.max_selections === 1} className="peer sr-only" />
                                <div className="flex size-5 items-center justify-center rounded-full border-2 border-(--beheer-border)/50 shadow-sm transition-all peer-checked:border-(--beheer-accent) peer-checked:bg-(--beheer-accent)">
                                    <div className="size-2 rounded-full bg-white opacity-0 transition-opacity peer-checked:opacity-100" />
                                </div>
                            </div>
                            <span className="text-[10px] font-semibold text-(--beheer-text-muted) transition-colors group-hover:text-(--beheer-accent)">Radio (Eén keuze)</span>
                        </label>
                    </div>

                    <div className="space-y-4">
                        {options.map((opt, idx) => (
                            <div key={idx} className="flex items-center gap-4">
                                <div className="flex-1">
                                    <input
                                        type="text" value={opt.name || ''}
                                        onChange={(e) => updateOption(idx, 'name', e.target.value)}
                                        placeholder="Bijv. Inclusief lunch..."
                                        className={`beheer-input ${inputClass} py-4 text-xs`}
                                    />
                                </div>
                                <div className="relative w-40">
                                    <Euro className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-(--beheer-text-muted) opacity-40" />
                                    <input
                                        type="number" step="0.01" value={opt.price || 0}
                                        onChange={(e) => updateOption(idx, 'price', e.target.value)}
                                        className={`beheer-input ${inputClass} py-4 pl-12 text-xs`}
                                        placeholder="Meerprijs"
                                    />
                                </div>
                                <button type="button" onClick={() => removeOption(idx)} className="icon-button rounded-2xl bg-(--beheer-card-soft) p-4 text-(--beheer-inactive) transition-all hover:bg-red-500/10 hover:text-red-500 active:scale-90">
                                    <Trash className="size-5" />
                                </button>
                            </div>
                        ))}
                        {options.length === 0 && (
                            <div className="rounded-2xl border border-dashed border-(--beheer-border)/30 bg-(--beheer-card-bg)/20 py-16 text-center text-[10px] font-semibold text-(--beheer-text-muted) opacity-40">
                                Geen sub-opties geconfigureerd voor deze activiteit
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-4 border-t border-(--beheer-border)/10 pt-4">
                    <button type="button" onClick={onCancel} className="beheer-button rounded-xl border border-transparent px-8 py-4 text-[10px] font-semibold text-(--beheer-text-muted) transition-all hover:border-(--beheer-border) hover:bg-(--beheer-card-soft) active:scale-95">Annuleren</button>
                    <button type="submit" disabled={pending} className="beheer-button flex items-center gap-3 rounded-xl border border-white/10 bg-(--beheer-accent) px-10 py-4 text-[10px] font-semibold text-white shadow-xl transition-all hover:opacity-90 active:scale-95 disabled:opacity-50">
                        {pending ? <Loader2 className="size-5 animate-spin" /> : <Save className="size-5" />}
                        <span>Opslaan</span>
                    </button>
                </div>
            </form>
        </div>
    );
}
