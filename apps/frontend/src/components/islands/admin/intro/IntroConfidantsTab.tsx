'use client';

import { useState } from 'react';
import {
    Plus,
    X,
    Save,
    Edit,
    Trash,
    ShieldCheck,
    Image as ImageIcon,
    Camera,
    Trash2,
    Loader2
} from 'lucide-react';
import type { IntroConfidant } from '@salvemundi/validations/schema/intro.zod';
import { getImageUrl } from '@/lib/utils/image-utils';
import { uploadIntroConfidantImage } from '@/server/actions/admin/intro/admin-intro-core.actions';
import { ActionButton, EmptyState, Field, inputClass, Button } from './IntroTabComponents';

interface Props {
    confidants: IntroConfidant[];
    onSave: (item: Partial<IntroConfidant>) => Promise<void>;
    onDelete: (id: number) => Promise<void>;
    saving: boolean;
    deletingId: number | null;
}

const emptyConfidant = (sortOrder: number): Partial<IntroConfidant> => ({
    name: '', email: '', phone_number: '', image: '', bio: '', sort_order: sortOrder, is_active: true
});

export default function IntroConfidantsTab({ confidants, onSave, onDelete, saving, deletingId }: Props) {
    const [editing, setEditing] = useState<Partial<IntroConfidant> | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    const startEditing = (item: Partial<IntroConfidant>) => {
        setEditing(item);
        setImageFile(null);
        setImagePreview(item.image ? getImageUrl(item.image, { width: 200, height: 200, fit: 'cover' }) : null);
        setUploadError(null);
    };

    const stopEditing = () => {
        setEditing(null);
        setImageFile(null);
        setImagePreview(null);
        setUploadError(null);
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
        setUploadError(null);
        e.target.value = '';
    };

    const handleRemoveImage = () => {
        setImageFile(null);
        setImagePreview(null);
        if (editing) setEditing({ ...editing, image: null });
    };

    const handleSave = async () => {
        if (!editing) return;

        let imageId = editing.image ?? null;

        if (imageFile) {
            setUploading(true);
            setUploadError(null);
            const formData = new FormData();
            formData.append('image', imageFile);
            const result = await uploadIntroConfidantImage(formData);
            setUploading(false);
            if (!result.success) {
                setUploadError(result.error);
                return;
            }
            imageId = result.data;
        }

        await onSave({ ...editing, image: imageId });
        stopEditing();
    };

    return (
        <div>
            <div className="mb-8 flex items-center justify-between">
                {editing === null && (
                    <Button
                        onClick={() => startEditing(emptyConfidant(confidants.length))}
                        icon={Plus}
                    >
                        Nieuwe Vertrouwenspersoon
                    </Button>
                )}
            </div>

            {editing !== null && (
                <div className="mb-8 rounded-(--beheer-radius) border border-(--beheer-border) bg-(--beheer-card-bg) p-8 shadow-2xl">
                    <div className="mb-8 flex items-center justify-between">
                        <h3 className="text-xs font-semibold text-(--beheer-text-muted)">
                            {editing.id ? 'Vertrouwenspersoon Bewerken' : 'Nieuwe Vertrouwenspersoon'}
                        </h3>
                        <button onClick={stopEditing} className="icon-button p-2 text-(--beheer-text-muted) transition-colors hover:text-(--beheer-text)">
                            <X className="size-5" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <Field label="Naam *">
                            <input type="text" value={editing.name || ''} onChange={e => setEditing({ ...editing, name: e.target.value })} className={`beheer-input ${inputClass}`} placeholder="Voor- en achternaam" />
                        </Field>
                        <Field label="Telefoonnummer">
                            <input type="text" value={editing.phone_number || ''} onChange={e => setEditing({ ...editing, phone_number: e.target.value })} className={`beheer-input ${inputClass}`} placeholder="06 12345678" />
                        </Field>
                        <Field label="E-mailadres">
                            <input type="email" value={editing.email || ''} onChange={e => setEditing({ ...editing, email: e.target.value })} className={`beheer-input ${inputClass}`} placeholder="naam@salvemundi.nl" />
                        </Field>
                        <Field label="Volgorde">
                            <input type="number" value={editing.sort_order ?? 0} onChange={e => setEditing({ ...editing, sort_order: Number(e.target.value) })} className={`beheer-input ${inputClass}`} />
                        </Field>

                        <div className="md:col-span-2">
                            <Field label="Foto">
                                <div className="flex items-center gap-5">
                                    <div className="relative flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-(--beheer-card-soft) ring-1 ring-(--beheer-border)">
                                        {imagePreview ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={imagePreview} alt="Voorbeeld" className="size-full object-cover" />
                                        ) : (
                                            <ImageIcon className="size-6 text-(--beheer-text-muted) opacity-40" />
                                        )}
                                        {uploading && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                                                <Loader2 className="size-5 animate-spin text-white" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            className="hidden"
                                            id="confidant-photo-upload"
                                        />
                                        <label
                                            htmlFor="confidant-photo-upload"
                                            className="btn-upload-photo inline-flex w-fit cursor-pointer items-center gap-2 rounded-xl border border-(--beheer-accent)/20 bg-(--beheer-accent)/10 px-4 py-2.5 text-sm font-semibold text-(--beheer-accent) transition-all hover:bg-(--beheer-accent)/20"
                                        >
                                            <Camera className="size-4" />
                                            {imagePreview ? 'Andere foto kiezen' : 'Foto uploaden'}
                                        </label>
                                        {imagePreview && (
                                            <button
                                                type="button"
                                                onClick={handleRemoveImage}
                                                className="btn-remove-photo inline-flex w-fit items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold text-red-500 transition-all hover:bg-red-500/10"
                                            >
                                                <Trash2 className="size-3.5" />
                                                Verwijderen
                                            </button>
                                        )}
                                        {uploadError && (
                                            <p className="text-xs font-semibold text-red-500">{uploadError}</p>
                                        )}
                                    </div>
                                </div>
                            </Field>
                        </div>

                        <div className="md:col-span-2">
                            <Field label="Korte tekst">
                                <textarea value={editing.bio || ''} onChange={e => setEditing({ ...editing, bio: e.target.value })} rows={3} className={`beheer-input ${inputClass}`} placeholder="Korte omschrijving die op de publieke pagina komt te staan" />
                            </Field>
                        </div>
                        <Field label="Zichtbaar op publieke pagina">
                            <button
                                type="button"
                                onClick={() => setEditing({ ...editing, is_active: !(editing.is_active ?? true) })}
                                className={`btn-toggle flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${(editing.is_active ?? true) ? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-500' : 'border border-(--beheer-text-muted)/10 bg-(--beheer-text-muted)/5 text-(--beheer-text-muted)'}`}
                            >
                                <ShieldCheck className="size-4" />
                                {(editing.is_active ?? true) ? 'Actief' : 'Verborgen'}
                            </button>
                        </Field>
                    </div>

                    <div className="mt-10 flex gap-3 border-t border-(--beheer-border)/50 pt-10">
                        <Button
                            onClick={() => { void handleSave(); }}
                            loading={saving || uploading}
                            icon={Save}
                            disabled={!editing.name}
                        >
                            Opslaan
                        </Button>
                        <Button onClick={stopEditing} variant="ghost" icon={X}>
                            Annuleren
                        </Button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {confidants.map(item => {
                    const imageUrl = item.image ? getImageUrl(item.image, { width: 100, height: 100, fit: 'cover' }) : null;
                    return (
                        <div key={item.id} className="group rounded-(--beheer-radius) border border-(--beheer-border) bg-(--beheer-card-bg) p-6 shadow-sm transition-all hover:border-(--beheer-accent)/30 hover:shadow-xl">
                            <div className="flex items-start gap-4">
                                <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-(--beheer-card-soft)">
                                    {imageUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={imageUrl} alt={item.name} className="size-full object-cover" />
                                    ) : (
                                        <ImageIcon className="size-5 text-(--beheer-text-muted) opacity-40" />
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <h4 className="truncate text-base font-semibold text-(--beheer-text)">{item.name}</h4>
                                        {!item.is_active && (
                                            <span className="rounded-full bg-(--beheer-text-muted)/10 px-1.5 py-0.5 text-[10px] font-semibold text-(--beheer-text-muted)">Verborgen</span>
                                        )}
                                    </div>
                                    {item.email && <p className="mt-1 truncate text-xs text-(--beheer-text-muted)">{item.email}</p>}
                                    {item.phone_number && <p className="text-xs text-(--beheer-text-muted) opacity-70">{item.phone_number}</p>}
                                </div>
                            </div>
                            {item.bio && <p className="mt-4 line-clamp-3 text-sm leading-relaxed font-medium text-(--beheer-text-muted)">{item.bio}</p>}
                            <div className="mt-4 flex gap-2 border-t border-(--beheer-border)/50 pt-4 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                                <ActionButton icon={Edit} onClick={() => startEditing(item)} title="Bewerken" />
                                <ActionButton
                                    icon={Trash}
                                    onClick={() => { void onDelete(item.id); }}
                                    variant="danger"
                                    disabled={deletingId === item.id}
                                    title="Verwijderen"
                                />
                            </div>
                        </div>
                    );
                })}
                {confidants.length === 0 && (
                    <div className="col-span-full">
                        <EmptyState icon={ShieldCheck} text="Nog geen vertrouwenspersonen toegevoegd" />
                    </div>
                )}
            </div>
        </div>
    );
}
