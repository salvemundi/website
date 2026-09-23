'use client';

import { useState } from 'react';
import { AlertCircle, Loader2, Save, Trash2, Upload } from 'lucide-react';
import MediaAsset from '@/components/ui/media/MediaAsset';
import { uploadWebshopMedia } from '@/server/actions/admin/webshop/admin-webshop-products.actions';
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

function ChipListInput({ label, placeholder, values, onChange }: { label: string; placeholder: string; values: string[]; onChange: (values: string[]) => void }) {
    const [draft, setDraft] = useState('');

    const addChip = () => {
        const value = draft.trim();
        if (value && !values.includes(value)) {
            onChange([...values, value]);
        }
        setDraft('');
    };

    const removeChip = (value: string) => onChange(values.filter(v => v !== value));

    return (
        <div className="space-y-3">
            <label className="text-xs font-semibold text-(--beheer-text-muted)">{label}</label>
            <div className="flex flex-wrap items-center gap-2">
                {values.map(value => (
                    <span key={value} className="flex items-center gap-1.5 rounded-lg bg-(--beheer-accent)/10 py-1.5 pr-2 pl-3 text-xs font-semibold text-(--beheer-accent)">
                        {value}
                        <button type="button" onClick={() => removeChip(value)} aria-label={`Verwijder ${value}`} className="beheer-button cursor-pointer transition-colors hover:text-red-500">
                            <Trash2 className="size-3" />
                        </button>
                    </span>
                ))}
                <input
                    type="text"
                    value={draft}
                    placeholder={placeholder}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ',') {
                            e.preventDefault();
                            addChip();
                        }
                    }}
                    onBlur={addChip}
                    className="beheer-input min-w-32 flex-1 rounded-lg border border-(--beheer-border) bg-(--beheer-card-soft) px-3 py-1.5 text-sm text-(--beheer-text)"
                />
            </div>
        </div>
    );
}

export default function AdminWebshopProductForm({ product, dropWindows, onSave, onCancel, isPending, error }: Props) {
    const [name, setName] = useState(product?.name || '');
    const [slug, setSlug] = useState(product?.slug || '');
    const [slugTouched, setSlugTouched] = useState(!!product);
    const [type, setType] = useState<'item' | 'clothing'>(product?.type === 'clothing' ? 'clothing' : 'item');

    const [sizes, setSizes] = useState<string[]>(
        () => Array.from(new Set((product?.variants || []).map(v => v.size).filter((v): v is string => !!v)))
    );
    const [colors, setColors] = useState<string[]>(
        () => Array.from(new Set((product?.variants || []).map(v => v.color).filter((v): v is string => !!v)))
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

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        if (product) fd.set('id', String(product.id));
        fd.set('type', type);
        fd.set('slug', slug);

        // Every size is available in every color — generate the full combo list instead of
        // making the admin type each size/color pair by hand.
        const variants = type === 'clothing'
            ? (colors.length > 0
                ? sizes.flatMap(size => colors.map(color => ({ size, color, sku: null, is_active: true })))
                : sizes.map(size => ({ size, color: null, sku: null, is_active: true })))
            : [];
        fd.set('variants_json', JSON.stringify(variants));
        fd.set('media_json', JSON.stringify(media));
        onSave(fd);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
                <div className="flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-xs font-semibold text-red-500">
                    <AlertCircle className="size-4 shrink-0" />
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-3">
                    <label className="text-xs font-semibold text-(--beheer-text-muted)">Naam *</label>
                    <input
                        type="text"
                        name="name"
                        required
                        value={name}
                        onChange={(e) => handleNameChange(e.target.value)}
                        placeholder="Bijv. Salve Mundi Hoodie"
                        className="beheer-input w-full rounded-xl border border-(--beheer-border) bg-(--beheer-card-soft) px-5 py-4 font-semibold text-(--beheer-text) transition-all outline-none focus:border-(--beheer-accent) focus:ring-4 focus:ring-(--beheer-accent)/10"
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
                        className="beheer-input w-full rounded-xl border border-(--beheer-border) bg-(--beheer-card-soft) px-5 py-4 font-mono font-semibold text-(--beheer-text) transition-all outline-none focus:border-(--beheer-accent) focus:ring-4 focus:ring-(--beheer-accent)/10"
                    />
                </div>

                <div className="space-y-3">
                    <label className="text-xs font-semibold text-(--beheer-text-muted)">Type</label>
                    <div className="grid grid-cols-2 rounded-xl border border-(--beheer-border) bg-(--beheer-card-soft) p-1">
                        <button type="button" onClick={() => setType('item')} className={`beheer-button cursor-pointer rounded-lg px-4 py-3 text-xs font-semibold transition-all ${type === 'item' ? 'bg-(--beheer-accent) text-white shadow-lg' : 'text-(--beheer-text-muted) hover:text-(--beheer-text)'}`}>
                            Item
                        </button>
                        <button type="button" onClick={() => setType('clothing')} className={`beheer-button cursor-pointer rounded-lg px-4 py-3 text-xs font-semibold transition-all ${type === 'clothing' ? 'bg-(--beheer-accent) text-white shadow-lg' : 'text-(--beheer-text-muted) hover:text-(--beheer-text)'}`}>
                            Kleding
                        </button>
                    </div>
                </div>

                <div className="space-y-3">
                    <label className="text-xs font-semibold text-(--beheer-text-muted)">Drop</label>
                    <select
                        name="drop_window_id"
                        defaultValue={product?.drop_window_id ?? ''}
                        className="beheer-input w-full rounded-xl border border-(--beheer-border) bg-(--beheer-card-soft) px-5 py-4 font-semibold text-(--beheer-text) transition-all outline-none focus:border-(--beheer-accent) focus:ring-4 focus:ring-(--beheer-accent)/10"
                    >
                        <option value="">Geen drop (los item, direct te koop)</option>
                        {dropWindows.map((dw) => (
                            <option key={dw.id} value={dw.id}>{dw.name} ({dw.status})</option>
                        ))}
                    </select>
                </div>

                <div className="space-y-3">
                    <label className="text-xs font-semibold text-(--beheer-text-muted)">Prijs (€) *</label>
                    <input type="number" name="price" required min="0.01" step="0.01" defaultValue={product?.price ? Number(product.price).toFixed(2) : ''} className="beheer-input w-full rounded-xl border border-(--beheer-border) bg-(--beheer-card-soft) px-5 py-4 font-semibold text-(--beheer-text) transition-all outline-none focus:border-(--beheer-accent) focus:ring-4 focus:ring-(--beheer-accent)/10" />
                </div>

                <div className="space-y-3">
                    <label className="text-xs font-semibold text-(--beheer-text-muted)">Limiet bestellingen (optioneel)</label>
                    <input type="number" name="max_orders" min="1" step="1" placeholder="Geen limiet" defaultValue={product?.max_orders ?? ''} className="beheer-input w-full rounded-xl border border-(--beheer-border) bg-(--beheer-card-soft) px-5 py-4 font-semibold text-(--beheer-text) transition-all outline-none focus:border-(--beheer-accent) focus:ring-4 focus:ring-(--beheer-accent)/10" />
                </div>

                <div className="space-y-3">
                    <label className="text-xs font-semibold text-(--beheer-text-muted)">Voorraad (optioneel)</label>
                    <input type="number" name="stock_quantity" min="0" step="1" placeholder="Onbeperkt" defaultValue={product?.stock_quantity ?? ''} className="beheer-input w-full rounded-xl border border-(--beheer-border) bg-(--beheer-card-soft) px-5 py-4 font-semibold text-(--beheer-text) transition-all outline-none focus:border-(--beheer-accent) focus:ring-4 focus:ring-(--beheer-accent)/10" />
                </div>
            </div>

            <div className="space-y-3">
                <label className="text-xs font-semibold text-(--beheer-text-muted)">Beschrijving</label>
                <textarea name="description" rows={6} defaultValue={product?.description || ''} className="beheer-input w-full rounded-xl border border-(--beheer-border) bg-(--beheer-card-soft) px-5 py-4 font-mono text-sm text-(--beheer-text) transition-all outline-none focus:border-(--beheer-accent) focus:ring-4 focus:ring-(--beheer-accent)/10" />
            </div>

            <div className="flex items-center gap-4 p-2">
                <div className="relative flex items-center justify-center">
                    <input type="checkbox" id="is_active" name="is_active" defaultChecked={product?.is_active ?? true} className="size-6 rounded-lg accent-(--beheer-accent)" />
                </div>
                <label htmlFor="is_active" className="cursor-pointer text-xs font-semibold text-(--beheer-text-muted) transition-colors hover:text-(--beheer-text)">Direct actief stellen (zichtbaar in catalogus)</label>
            </div>

            <div className="space-y-3 border-t border-(--beheer-border) pt-6">
                <label className="text-xs font-semibold text-(--beheer-text-muted)">Foto&apos;s / video</label>
                <div className="flex flex-wrap gap-3">
                    {media.map((item, index) => (
                        <div key={`${item.asset}-${index}`} className="group relative size-20 overflow-hidden rounded-xl border border-(--beheer-border)">
                            <MediaAsset asset={item.asset} alt={`${name || 'Product'} afbeelding ${index + 1}`} fill sizes="80px" className="object-cover" />
                            <button
                                type="button"
                                onClick={() => setMedia(prev => prev.filter((_, i) => i !== index))}
                                className="absolute inset-0 beheer-button flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
                                aria-label="Verwijder media"
                            >
                                <Trash2 className="size-5 text-white" />
                            </button>
                        </div>
                    ))}
                    <label className={`flex size-20 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-(--beheer-border) transition-colors hover:border-(--beheer-accent) ${uploading ? 'pointer-events-none opacity-50' : ''}`}>
                        {uploading ? <Loader2 className="size-5 animate-spin text-(--beheer-text-muted)" /> : <Upload className="size-5 text-(--beheer-text-muted)" />}
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
                {uploadError && <p className="text-xs font-semibold text-red-500">{uploadError}</p>}
            </div>

            {type === 'clothing' && (
                <div className="space-y-6 border-t border-(--beheer-border) pt-6">
                    <p className="text-xs text-(--beheer-text-muted)">Elke maat is in elke kleur verkrijgbaar — er wordt automatisch een variant aangemaakt voor elke combinatie.</p>
                    <ChipListInput label="Maten *" placeholder="Typ een maat en druk op Enter (S, M, L...)" values={sizes} onChange={setSizes} />
                    <ChipListInput label="Kleuren (optioneel)" placeholder="Typ een kleur en druk op Enter" values={colors} onChange={setColors} />
                    {sizes.length === 0 && <p className="text-xs text-(--beheer-text-muted) italic">Voeg minimaal 1 maat toe.</p>}
                </div>
            )}

            <div className="flex flex-col justify-end gap-4 border-t border-(--beheer-border) pt-6 sm:flex-row">
                <button type="button" onClick={onCancel} className="beheer-button cursor-pointer rounded-xl border border-(--beheer-border) px-8 py-4 text-sm font-semibold text-(--beheer-text) transition-all hover:bg-(--beheer-card-soft)">
                    Annuleren
                </button>
                <button type="submit" disabled={isPending} className="beheer-button flex cursor-pointer items-center justify-center gap-3 rounded-xl bg-(--beheer-accent) px-10 py-4 text-sm font-semibold text-white shadow-lg transition-all hover:opacity-90 active:scale-95 disabled:opacity-50">
                    {isPending ? <Loader2 className="size-5 animate-spin" /> : <Save className="size-5" />}
                    <span>{isPending ? 'Bezig...' : product ? 'Opslaan' : 'Product Aanmaken'}</span>
                </button>
            </div>
        </form>
    );
}