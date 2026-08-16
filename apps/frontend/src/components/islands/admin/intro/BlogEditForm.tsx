'use client';

import { useState } from 'react';
import { Save, X, Eye, Send, Image as ImageIcon, Camera, Trash2, Loader2 } from 'lucide-react';
import type { IntroBlog } from '@salvemundi/validations/schema/intro.zod';
import { Button, Field, inputClass } from './IntroTabComponents';
import { toLocalISOString } from '@/lib/utils/date-utils';
import { getImageUrl } from '@/lib/utils/image-utils';
import { AdminDatetimepicker } from '@/components/ui/forms/AdminDatetimepicker';
import AdminSelect from '@/components/ui/admin/AdminSelect';
import { uploadIntroBlogImage } from '@/server/actions/admin/intro/admin-intro-core.actions';

const blogTypeOptions = [
    { value: 'update', label: 'Update' },
    { value: 'pictures', label: "Foto's" },
    { value: 'event', label: 'Evenement' },
    { value: 'announcement', label: 'Aankondiging' }
];

interface Props {
    blog: Partial<IntroBlog>;
    data: Partial<IntroBlog>;
    onChange: (data: Partial<IntroBlog>) => void;
    onSave: () => void;
    onPublish: () => void;
    onCancel: () => void;
    saving: boolean;
}

export default function BlogEditForm({ blog, data, onChange, onSave, onPublish, onCancel, saving }: Props) {
    const [imagePreview, setImagePreview] = useState<string | null>(
        data.image ? getImageUrl(data.image as string | null, { width: 800, fit: 'inside' }) : null
    );
    const [uploadingImage, setUploadingImage] = useState(false);
    const [imageUploadError, setImageUploadError] = useState<string | null>(null);

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;

        setImagePreview(URL.createObjectURL(file));
        setUploadingImage(true);
        setImageUploadError(null);

        const formData = new FormData();
        formData.append('image', file);
        const result = await uploadIntroBlogImage(formData);
        setUploadingImage(false);

        if (!result.success) {
            setImageUploadError(result.error);
            setImagePreview(data.image ? getImageUrl(data.image as string | null, { width: 800, fit: 'inside' }) : null);
            return;
        }
        onChange({ ...data, image: result.data });
        setImagePreview(getImageUrl(result.data, { width: 800, fit: 'inside' }));
    };

    const handleRemoveImage = () => {
        setImagePreview(null);
        setImageUploadError(null);
        onChange({ ...data, image: null });
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-12 text-[11px] font-semibold text-(--beheer-text-muted)">
            <div className="lg:col-span-2 space-y-6 sm:space-y-8">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-[10px] font-semibold text-(--beheer-accent)">
                        {blog.id && blog.id !== -1 ? 'Blog Bewerken' : 'Nieuwe Blog'}
                    </p>
                    <div className="flex flex-wrap gap-2">
                        <Button onClick={onSave} loading={saving} icon={Save} variant="secondary">Opslaan</Button>
                        {!data.is_published && (
                            <Button onClick={onPublish} loading={saving} icon={Send} variant="success">Publiceren</Button>
                        )}
                        <Button onClick={onCancel} variant="ghost" icon={X}>Annuleren</Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Field label="Titel *">
                        <input
                            type="text"
                            value={data.title || ''}
                            onChange={e => onChange({ ...data, title: e.target.value })}
                            className={`beheer-input ${inputClass}`}
                            placeholder="Titel van de blog..."
                        />
                    </Field>
                    <Field label="Link-naam (Slug)">
                        <input
                            type="text"
                            value={data.slug || ''}
                            onChange={e => onChange({ ...data, slug: e.target.value })}
                            className={`beheer-input ${inputClass}`}
                            placeholder="blog-titel-slug"
                        />
                    </Field>
                    <div className="md:col-span-2">
                        <Field label="Uitgelichte afbeelding">
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
                                        onChange={(e) => { void handleImageChange(e); }}
                                        className="hidden"
                                        id="blog-image-upload"
                                    />
                                    <label
                                        htmlFor="blog-image-upload"
                                        className="btn-upload-blog-image cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-(--beheer-accent)/10 text-(--beheer-accent) border border-(--beheer-accent)/20 text-sm font-semibold hover:bg-(--beheer-accent)/20 transition-all w-fit"
                                    >
                                        <Camera className="h-4 w-4" />
                                        {imagePreview ? 'Andere afbeelding kiezen' : 'Afbeelding uploaden'}
                                    </label>
                                    {imagePreview && (
                                        <button
                                            type="button"
                                            onClick={handleRemoveImage}
                                            className="btn-remove-blog-image inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-red-500 hover:bg-red-500/10 transition-all w-fit"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                            Verwijderen
                                        </button>
                                    )}
                                    {imageUploadError && (
                                        <p className="text-xs font-semibold text-red-500">{imageUploadError}</p>
                                    )}
                                </div>
                            </div>
                        </Field>
                    </div>
                    <div className="md:col-span-2">
                        <Field label="Samenvatting (kort overzicht)">
                            <textarea
                                value={data.excerpt || ''}
                                onChange={e => onChange({ ...data, excerpt: e.target.value })}
                                rows={2}
                                className={`beheer-input ${inputClass} min-h-20 resize-none`}
                                placeholder="Een korte samenvatting..."
                            />
                        </Field>
                    </div>
                    <div className="md:col-span-2">
                        <Field label="Inhoud *">
                            <textarea
                                value={data.content || ''}
                                onChange={e => onChange({ ...data, content: e.target.value })}
                                rows={8}
                                className={`beheer-input ${inputClass} min-h-50 resize-none`}
                                placeholder="Schrijf hier je blog post..."
                            />
                        </Field>
                    </div>
                </div>
            </div>

            <div className="space-y-6 sm:space-y-8 lg:border-l lg:border-(--beheer-border)/10 lg:pl-8 xl:pl-12">
                <div className="space-y-6">
                    <p className="text-[10px] font-semibold text-(--beheer-accent)">Instellingen</p>

                    <Field label="Type">
                        <AdminSelect
                            value={data.blog_type || 'update'}
                            onChange={val => onChange({ ...data, blog_type: val as IntroBlog['blog_type'] })}
                            options={blogTypeOptions}
                            size="sm"
                        />
                    </Field>

                    <Field label="Datum (Publicatie)">
                        <AdminDatetimepicker
                            value={toLocalISOString(data.created_at, true)?.slice(0, 16) || ''}
                            onChange={e => onChange({ ...data, created_at: e.target.value })}
                        />
                    </Field>

                    <div className="p-6 bg-(--bg-main)/20 rounded-2xl border border-(--beheer-border)/20">
                        <label className="flex items-center gap-4 cursor-pointer group select-none">
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={data.is_published || false}
                                    onChange={e => onChange({ ...data, is_published: e.target.checked })}
                                />
                                <div className="h-6 w-11 bg-(--beheer-border)/20 dark:bg-white/5 backdrop-blur-md rounded-full peer-checked:bg-emerald-500 transition-all border border-(--beheer-border)/30 group-hover:border-emerald-500/50 shadow-inner" />
                                <div className="absolute left-1 top-1 h-4 w-4 bg-white rounded-full transition-all peer-checked:left-6 shadow-lg transform peer-active:scale-90" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-semibold text-(--beheer-text)">Zichtbaarheid</span>
                                <span className="text-[9px] font-semibold text-(--beheer-text-muted)">{data.is_published ? 'Openbaar' : 'Concept'}</span>
                            </div>
                        </label>
                    </div>
                </div>

                <div className="space-y-6">
                    <p className="text-[10px] font-semibold text-(--beheer-accent)">Voorvertoning</p>
                    <div className="p-6 rounded-2xl bg-white/5 border border-dashed border-(--beheer-border)/40 flex flex-col items-center justify-center text-center gap-3">
                        <Eye className="h-6 w-6 opacity-20" />
                        <p className="text-[9px] opacity-40 italic">Voorvertoning functionaliteit binnenkort beschikbaar</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
