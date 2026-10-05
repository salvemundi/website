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
import { Field } from './ReisTabComponents';
import { type ActivityOption, parseActivityOptions } from '@/lib/reis';
import MediaAsset from '@/components/ui/media/MediaAsset';

import { type TripActivity } from '@salvemundi/validations/schema/beheer-trip.zod';


interface Props {
    activity: Partial<TripActivity> | null;
    onSave: (formData: FormData, options: ActivityOption[]) => Promise<void>;
    onCancel: () => void;
    pending: boolean;
}

export default function ReisActivityForm({ activity, onSave, onCancel, pending }: Props) {
    const initialOptions = parseActivityOptions(activity?.options);
    const [options, setOptions] = useState<ActivityOption[]>(initialOptions);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [imagePreview, setImagePreview] = useState<string | { id: string; type?: string | null } | null>(null);
    const [existingImageId, setExistingImageId] = useState<string | null>(null);
    const [imageError, setImageError] = useState<string | null>(null);

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

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        setImageError(null);

        if (file) {
            const maxSizeBytes = 10 * 1024 * 1024;
            if (file.size > maxSizeBytes) {
                setImageError('Het geselecteerde bestand is te groot (maximaal 10MB).');
                event.target.value = '';
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

    const handleSubmit = (event: React.SyntheticEvent) => {
        event.preventDefault();
        if (imageError) return;
        const formData = new FormData(event.currentTarget as HTMLFormElement);
        void onSave(formData, options);
    };

    return (
        <div className="form-card">
            <div className="form-card-header">
                <h2 className="form-card-title">
                    <div className="icon-box">
                        {activity?.id ? <Save className="size-4" /> : <Plus className="size-4" />}
                    </div>
                    {activity?.id ? 'Bewerken' : 'Nieuwe Activiteit'}
                </h2>
                <button
                    onClick={onCancel}
                    className="icon-button"
                    type="button"
                    aria-label="Sluiten"
                >
                    <X className="size-5" />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {activity?.id && <input type="hidden" name="id" value={activity.id} />}
                <input type="hidden" name="existing_image_id" value={existingImageId || ''} />

                {imageError && (
                    <div className="alert-banner-danger">
                        <Info className="size-4 shrink-0" />
                        <span>{imageError}</span>
                    </div>
                )}

                <div className="form-grid-2col">
                    <div className="form-grid-col-7">
                        <Field label="Naam *">
                            <input type="text" name="name" defaultValue={activity?.name || ''} required className="form-input" placeholder="Bijv. Skiën" />
                        </Field>
                        <Field label="Beschrijving">
                            <textarea name="description" rows={5} defaultValue={activity?.description || ''} className="form-input resize-none" placeholder="Wat houdt deze activiteit precies in?" />
                        </Field>
                    </div>

                    <div className="form-grid-col-5">
                        <div className="form-col-full">
                            <Field label="Afbeelding">
                                {!imagePreview ? (
                                    <div onClick={() => fileInputRef.current?.click()} className="group form-dropzone-box">
                                        <Upload className="form-dropzone-icon group-hover:text-theme-purple" />
                                        <span className="form-dropzone-text">Upload afbeelding</span>
                                        <input ref={fileInputRef} type="file" name="image_file" accept="image/*" onChange={handleImageChange} className="hidden" />
                                    </div>
                                ) : (
                                    <div className="group form-preview-box">
                                        <MediaAsset
                                            asset={imagePreview}
                                            alt="Preview"
                                            fill
                                            objectFit="contain"
                                            unoptimized
                                        />
                                        <div className="form-preview-overlay group-hover:opacity-100">
                                            <button type="button" onClick={() => fileInputRef.current?.click()} className="btn-overlay-action"><Upload className="size-4" /></button>
                                            <button type="button" onClick={handleRemoveImage} className="btn-overlay-delete"><X className="size-4" /></button>
                                        </div>
                                        <input ref={fileInputRef} type="file" name="image_file" accept="image/*" onChange={handleImageChange} className="hidden" />
                                    </div>
                                )}
                            </Field>
                        </div>
                        <div className="form-col-full">
                            <Field label="Basisprijs (€) *">
                                <div className="relative">
                                    <Euro className="input-icon-left" />
                                    <input type="number" step="0.01" name="price" defaultValue={activity?.price || 0} required className="form-input pl-12" />
                                </div>
                            </Field>
                        </div>
                        <Field label="Max Reizigers">
                            <input type="number" name="max_participants" defaultValue={activity?.max_participants || ''} placeholder="Onbeperkt" className="form-input" />
                        </Field>
                        <Field label="Sorteer Volgorde">
                            <input type="number" name="display_order" defaultValue={activity?.display_order || 0} className="form-input" />
                        </Field>
                        <div className="form-col-full flex items-center pt-2">
                            <label className="form-checkbox-card">
                                <div className="relative">
                                    <input type="checkbox" name="is_active" className="peer sr-only" defaultChecked={activity?.is_active ?? true} />
                                    <div className="form-toggle-track" />
                                    <div className="form-toggle-thumb" />
                                </div>
                                <span className="text-xs font-semibold text-(--text-main)">Activiteit is zichtbaar</span>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="form-section-box">
                    <div className="form-section-header">
                        <div className="space-y-1">
                            <h3 className="section-title-sm">
                                <List className="size-4 text-theme-purple" /> Sub-opties
                            </h3>
                            <p className="text-xs text-(--text-muted)">Optionele keuzes voor deze activiteit</p>
                        </div>
                        <button type="button" onClick={addOption} className="btn-secondary">
                            <Plus className="size-4" /> Optie toevoegen
                        </button>
                    </div>

                    <div className="form-radio-group">
                        <label className="form-radio-label">
                            <div className="relative flex h-5 items-center">
                                <input type="radio" name="max_selections" value="" defaultChecked={activity?.max_selections === null || !activity?.id} className="peer sr-only" />
                                <div className="form-radio-indicator">
                                    <div className="form-radio-dot" />
                                </div>
                            </div>
                            <span className="radio-label-text">Checkbox (Meerdere)</span>
                        </label>
                        <label className="form-radio-label">
                            <div className="relative flex h-5 items-center">
                                <input type="radio" name="max_selections" value="1" defaultChecked={activity?.max_selections === 1} className="peer sr-only" />
                                <div className="form-radio-indicator-round">
                                    <div className="form-radio-dot-round" />
                                </div>
                            </div>
                            <span className="radio-label-text">Radio (Eén keuze)</span>
                        </label>
                    </div>

                    <div className="form-options-list">
                        {options.map((opt, idx) => (
                            <div key={idx} className="form-option-row">
                                <div className="flex-1">
                                    <input
                                        type="text" value={opt.name || ''}
                                        onChange={(event) => updateOption(idx, 'name', event.target.value)}
                                        placeholder="Bijv. Inclusief lunch..."
                                        className="form-input"
                                    />
                                </div>
                                <div className="relative w-40">
                                    <Euro className="input-icon-left" />
                                    <input
                                        type="number" step="0.01" value={opt.price || 0}
                                        onChange={(event) => updateOption(idx, 'price', event.target.value)}
                                        className="form-input pl-12"
                                        placeholder="Meerprijs"
                                    />
                                </div>
                                <button type="button" onClick={() => removeOption(idx)} className="btn-icon-delete">
                                    <Trash className="size-4" />
                                </button>
                            </div>
                        ))}
                        {options.length === 0 && (
                            <div className="form-option-empty">
                                Geen sub-opties geconfigureerd voor deze activiteit
                            </div>
                        )}
                    </div>
                </div>

                <div className="form-row-actions">
                    <button type="button" onClick={onCancel} className="btn-secondary">Annuleren</button>
                    <button type="submit" disabled={pending} className="form-button">
                        {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                        <span>Opslaan</span>
                    </button>
                </div>
            </form>
        </div>
    );
}
