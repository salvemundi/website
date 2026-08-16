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
            <div className="flex items-center justify-between mb-8">
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
                <div className="bg-(--beheer-card-bg) rounded-(--beheer-radius) border border-(--beheer-border) p-8 mb-8 shadow-2xl">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="font-semibold text-xs text-(--beheer-text-muted)">
                            {editing.id ? 'Vertrouwenspersoon Bewerken' : 'Nieuwe Vertrouwenspersoon'}
                        </h3>
                        <button onClick={stopEditing} className="icon-button p-2 text-(--beheer-text-muted) hover:text-(--beheer-text) transition-colors">
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                    <div className="relative h-24 w-24 shrink-0 rounded-full overflow-hidden bg-(--beheer-card-soft) ring-1 ring-(--beheer-border) flex items-center justify-center">
                                        {imagePreview ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={imagePreview} alt="Voorbeeld" className="h-full w-full object-cover" />
                                        ) : (
                                            <ImageIcon className="h-6 w-6 text-(--beheer-text-muted) opacity-40" />
                                        )}
                                        {uploading && (
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                <Loader2 className="h-5 w-5 text-white animate-spin" />
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
                                            className="btn-upload-photo cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-(--beheer-accent)/10 text-(--beheer-accent) border border-(--beheer-accent)/20 text-sm font-semibold hover:bg-(--beheer-accent)/20 transition-all w-fit"
                                        >
                                            <Camera className="h-4 w-4" />
                                            {imagePreview ? 'Andere foto kiezen' : 'Foto uploaden'}
                                        </label>
                                        {imagePreview && (
                                            <button
                                                type="button"
                                                onClick={handleRemoveImage}
                                                className="btn-remove-photo inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-red-500 hover:bg-red-500/10 transition-all w-fit"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
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
                                className={`btn-toggle flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${(editing.is_active ?? true) ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-(--beheer-text-muted)/5 text-(--beheer-text-muted) border border-(--beheer-text-muted)/10'}`}
                            >
                                <ShieldCheck className="h-4 w-4" />
                                {(editing.is_active ?? true) ? 'Actief' : 'Verborgen'}
                            </button>
                        </Field>
                    </div>

                    <div className="flex gap-3 pt-10 border-t border-(--beheer-border)/50 mt-10">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {confidants.map(item => {
                    const imageUrl = item.image ? getImageUrl(item.image, { width: 100, height: 100, fit: 'cover' }) : null;
                    return (
                        <div key={item.id} className="group bg-(--beheer-card-bg) rounded-(--beheer-radius) border border-(--beheer-border) p-6 hover:border-(--beheer-accent)/30 transition-all shadow-sm hover:shadow-xl">
                            <div className="flex items-start gap-4">
                                <div className="h-12 w-12 rounded-full overflow-hidden bg-(--beheer-card-soft) shrink-0 flex items-center justify-center">
                                    {imageUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={imageUrl} alt={item.name} className="h-full w-full object-cover" />
                                    ) : (
                                        <ImageIcon className="h-5 w-5 text-(--beheer-text-muted) opacity-40" />
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-semibold text-base text-(--beheer-text) truncate">{item.name}</h4>
                                        {!item.is_active && (
                                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-(--beheer-text-muted)/10 text-(--beheer-text-muted)">Verborgen</span>
                                        )}
                                    </div>
                                    {item.email && <p className="text-xs text-(--beheer-text-muted) mt-1 truncate">{item.email}</p>}
                                    {item.phone_number && <p className="text-xs text-(--beheer-text-muted) opacity-70">{item.phone_number}</p>}
                                </div>
                            </div>
                            {item.bio && <p className="text-sm text-(--beheer-text-muted) mt-4 font-medium leading-relaxed line-clamp-3">{item.bio}</p>}
                            <div className="flex gap-2 mt-4 pt-4 border-t border-(--beheer-border)/50 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
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
