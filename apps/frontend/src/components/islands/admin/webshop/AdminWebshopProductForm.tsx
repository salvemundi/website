'use client';

import { useState } from 'react';
import { AlertCircle, Loader2, Plus, Save, Trash2, Upload } from 'lucide-react';
import MediaAsset from '@/components/ui/media/MediaAsset';
import { uploadWebshopMedia } from '@/server/actions/admin/admin-webshop-products.actions';
import { safeConsoleError } from '@/server/utils/logger';
import { type AdminDropWindow, type AdminProduct } from './webshop-admin-types';

interface Props {
    product?: AdminProduct | null;
    dropWindows: AdminDropWindow[];
    onSave: (formData: FormData) => void;
    onCancel: () => void;
    isPending: boolean;
    error: string | null;
}

interface VariantDraft {
    size: string;
    color: string;
    sku: string;
    is_active: boolean;
}

interface MediaDraft {
    asset: string;
    assetType?: string;
}

function slugify(value: string): string {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}

export default function AdminWebshopProductForm({ product, dropWindows, onSave, onCancel, isPending, error }: Props) {
    const [name, setName] = useState(product?.name || '');
    const [slug, setSlug] = useState(product?.slug || '');
    const [slugTouched, setSlugTouched] = useState(!!product);
    const [type, setType] = useState<'item' | 'clothing'>(product?.type === 'clothing' ? 'clothing' : 'item');

    const [variants, setVariants] = useState<VariantDraft[]>(
        product?.variants.map(v => ({ size: v.size || '', color: v.color || '', sku: v.sku || '', is_active: v.is_active ?? true })) || []
    );

    const [media, setMedia] = useState<MediaDraft[]>(
        product?.media.map(m => ({ asset: m.asset })) || []
    );
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    const handleNameChange = (value: string) => {
        setName(value);
        if (!slugTouched) setSlug(slugify(value));
    };

    const handleUpload = async (file: File) => {
        setUploading(true);
        setUploadError(null);
        try {
            const fd = new FormData();
            fd.append('file', file);
            const res = await uploadWebshopMedia(fd);
            if (res.success && res.assetId) {
                setMedia(prev => [...prev, { asset: res.assetId as string, assetType: res.assetType }]);
            } else {
                setUploadError(res.error || 'Uploaden mislukt.');
            }
        } catch (err) {
            safeConsoleError('[AdminWebshopProductForm.tsx][handleUpload]', err);
            setUploadError('Uploaden mislukt.');
        } finally {
            setUploading(false);
        }
    };

    const addVariant = () => setVariants(prev => [...prev, { size: '', color: '', sku: '', is_active: true }]);
    const removeVariant = (index: number) => setVariants(prev => prev.filter((_, i) => i !== index));
    const updateVariant = (index: number, patch: Partial<VariantDraft>) => {
        setVariants(prev => prev.map((v, i) => i === index ? { ...v, ...patch } : v));
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        if (product) fd.set('id', String(product.id));
        fd.set('type', type);
        fd.set('slug', slug);
        fd.set('variants_json', JSON.stringify(type === 'clothing' ? variants : []));
        fd.set('media_json', JSON.stringify(media));
        onSave(fd);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
                <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-500 px-5 py-4 rounded-2xl text-xs font-semibold">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                    <label className="text-xs font-semibold text-(--beheer-text-muted)">Naam *</label>
                    <input
                        type="text"
                        name="name"
                        required
                        value={name}
                        onChange={(e) => handleNameChange(e.target.value)}
                        placeholder="Bijv. Salve Mundi Hoodie"
                        className="w-full px-5 py-4 rounded-xl border border-(--beheer-border) bg-(--beheer-card-soft) text-(--beheer-text) focus:ring-4 focus:ring-(--beheer-accent)/10 focus:border-(--beheer-accent) outline-none transition-all font-semibold"
                    />
                </div>

                <div className="space-y-3">
                    <label className="text-xs font-semibold text-(--beheer-text-muted)">Slug *</label>
                    <input
                        type="text"
                        value={slug}
                        required
                        onChange={(e) => { setSlugTouched(true); setSlug(slugify(e.target.value)); }}
                        placeholder="salve-mundi-hoodie"
                        className="w-full px-5 py-4 rounded-xl border border-(--beheer-border) bg-(--beheer-card-soft) text-(--beheer-text) font-mono focus:ring-4 focus:ring-(--beheer-accent)/10 focus:border-(--beheer-accent) outline-none transition-all font-semibold"
                    />
                </div>

                <div className="space-y-3">
                    <label className="text-xs font-semibold text-(--beheer-text-muted)">Type</label>
                    <div className="grid grid-cols-2 bg-(--beheer-card-soft) p-1 rounded-xl border border-(--beheer-border)">
                        <button type="button" onClick={() => setType('item')} className={`py-3 px-4 rounded-lg text-xs font-semibold transition-all cursor-pointer ${type === 'item' ? 'bg-(--beheer-accent) text-white shadow-lg' : 'text-(--beheer-text-muted) hover:text-(--beheer-text)'}`}>
                            Item
                        </button>
                        <button type="button" onClick={() => setType('clothing')} className={`py-3 px-4 rounded-lg text-xs font-semibold transition-all cursor-pointer ${type === 'clothing' ? 'bg-(--beheer-accent) text-white shadow-lg' : 'text-(--beheer-text-muted) hover:text-(--beheer-text)'}`}>
                            Kleding
                        </button>
                    </div>
                </div>

                <div className="space-y-3">
                    <label className="text-xs font-semibold text-(--beheer-text-muted)">Drop</label>
                    <select
                        name="drop_window_id"
                        defaultValue={product?.drop_window_id ?? ''}
                        required
                        className="w-full px-5 py-4 rounded-xl border border-(--beheer-border) bg-(--beheer-card-soft) text-(--beheer-text) focus:ring-4 focus:ring-(--beheer-accent)/10 focus:border-(--beheer-accent) outline-none transition-all font-semibold"
                    >
                        <option value="" disabled>Kies een drop</option>
                        {dropWindows.map((dw) => (
                            <option key={dw.id} value={dw.id}>{dw.name} ({dw.status})</option>
                        ))}
                    </select>
                </div>

                <div className="space-y-3">
                    <label className="text-xs font-semibold text-(--beheer-text-muted)">Prijs (€) *</label>
                    <input type="number" name="price" required min="0.01" step="0.01" defaultValue={product?.price || ''} className="w-full px-5 py-4 rounded-xl border border-(--beheer-border) bg-(--beheer-card-soft) text-(--beheer-text) focus:ring-4 focus:ring-(--beheer-accent)/10 focus:border-(--beheer-accent) outline-none transition-all font-semibold" />
                </div>

                <div className="space-y-3">
                    <label className="text-xs font-semibold text-(--beheer-text-muted)">Aanbetaling (€) *</label>
                    <input type="number" name="deposit_amount" required min="0.01" step="0.01" defaultValue={product?.deposit_amount || ''} className="w-full px-5 py-4 rounded-xl border border-(--beheer-border) bg-(--beheer-card-soft) text-(--beheer-text) focus:ring-4 focus:ring-(--beheer-accent)/10 focus:border-(--beheer-accent) outline-none transition-all font-semibold" />
                </div>
            </div>

            <div className="space-y-3">
                <label className="text-xs font-semibold text-(--beheer-text-muted)">Beschrijving</label>
                <textarea name="description" rows={6} defaultValue={product?.description || ''} className="w-full px-5 py-4 rounded-xl border border-(--beheer-border) bg-(--beheer-card-soft) text-(--beheer-text) font-mono text-sm focus:ring-4 focus:ring-(--beheer-accent)/10 focus:border-(--beheer-accent) outline-none transition-all" />
                <p className="text-xs text-(--beheer-text-muted)">
                    Ondersteunt Markdown, inclusief tabellen. Bijv. voor een maattabel: <code>| Maat | Borstomvang |</code> op de eerste regel,
                    <code> | --- | --- |</code> op de tweede, en dan per maat een regel <code>| M | 90-95cm |</code>.
                </p>
            </div>

            <div className="flex items-center gap-4 p-2">
                <div className="relative flex items-center justify-center">
                    <input type="checkbox" id="is_active" name="is_active" defaultChecked={product?.is_active ?? true} className="h-6 w-6 rounded-lg accent-(--beheer-accent)" />
                </div>
                <label htmlFor="is_active" className="text-xs font-semibold text-(--beheer-text-muted) cursor-pointer hover:text-(--beheer-text) transition-colors">Direct actief stellen (zichtbaar in catalogus)</label>
            </div>

            {/* Media */}
            <div className="space-y-3 pt-6 border-t border-(--beheer-border)">
                <label className="text-xs font-semibold text-(--beheer-text-muted)">Foto&apos;s / video</label>
                <div className="flex flex-wrap gap-3">
                    {media.map((item, index) => (
                        <div key={`${item.asset}-${index}`} className="relative h-20 w-20 rounded-xl overflow-hidden border border-(--beheer-border) group">
                            <MediaAsset asset={{ id: item.asset, type: item.assetType }} alt={`${name || 'Product'} afbeelding ${index + 1}`} fill objectFit="cover" />
                            <button
                                type="button"
                                onClick={() => setMedia(prev => prev.filter((_, i) => i !== index))}
                                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                aria-label="Verwijder media"
                            >
                                <Trash2 className="h-5 w-5 text-white" />
                            </button>
                        </div>
                    ))}
                    <label className={`h-20 w-20 rounded-xl border-2 border-dashed border-(--beheer-border) flex items-center justify-center cursor-pointer hover:border-(--beheer-accent) transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                        {uploading ? <Loader2 className="h-5 w-5 animate-spin text-(--beheer-text-muted)" /> : <Upload className="h-5 w-5 text-(--beheer-text-muted)" />}
                        <input
                            type="file"
                            accept="image/*,video/*"
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) void handleUpload(file);
                                e.target.value = '';
                            }}
                        />
                    </label>
                </div>
                {uploadError && <p className="text-xs text-red-500 font-semibold">{uploadError}</p>}
            </div>

            {type === 'clothing' && (
                <>
                    {/* Variants */}
                    <div className="space-y-3 pt-6 border-t border-(--beheer-border)">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-semibold text-(--beheer-text-muted)">Maat / kleur varianten *</label>
                            <button type="button" onClick={addVariant} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-(--beheer-accent)/10 text-(--beheer-accent) text-xs font-semibold hover:bg-(--beheer-accent)/20 transition-all">
                                <Plus className="h-3.5 w-3.5" /> Variant
                            </button>
                        </div>
                        <div className="space-y-2">
                            {variants.map((variant, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <input type="text" placeholder="Maat (S, M, L...)" value={variant.size} onChange={(e) => updateVariant(index, { size: e.target.value })} className="flex-1 px-4 py-2.5 rounded-lg border border-(--beheer-border) bg-(--beheer-card-soft) text-(--beheer-text) text-sm" />
                                    <input type="text" placeholder="Kleur (optioneel)" value={variant.color} onChange={(e) => updateVariant(index, { color: e.target.value })} className="flex-1 px-4 py-2.5 rounded-lg border border-(--beheer-border) bg-(--beheer-card-soft) text-(--beheer-text) text-sm" />
                                    <input type="text" placeholder="SKU (optioneel)" value={variant.sku} onChange={(e) => updateVariant(index, { sku: e.target.value })} className="flex-1 px-4 py-2.5 rounded-lg border border-(--beheer-border) bg-(--beheer-card-soft) text-(--beheer-text) text-sm" />
                                    <button type="button" onClick={() => removeVariant(index)} className="p-2.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-all" aria-label="Verwijder variant">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                            {variants.length === 0 && <p className="text-xs text-(--beheer-text-muted) italic">Nog geen varianten toegevoegd.</p>}
                        </div>
                    </div>
                </>
            )}

            <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6 border-t border-(--beheer-border)">
                <button type="button" onClick={onCancel} className="px-8 py-4 rounded-xl font-semibold text-sm border border-(--beheer-border) text-(--beheer-text) hover:bg-(--beheer-card-soft) transition-all cursor-pointer">
                    Annuleren
                </button>
                <button type="submit" disabled={isPending} className="flex items-center justify-center gap-3 px-10 py-4 bg-(--beheer-accent) text-white font-semibold text-sm rounded-xl shadow-lg hover:opacity-90 transition-all active:scale-95 disabled:opacity-50 cursor-pointer">
                    {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                    <span>{isPending ? 'Bezig...' : product ? 'Opslaan' : 'Product Aanmaken'}</span>
                </button>
            </div>
        </form>
    );
}
