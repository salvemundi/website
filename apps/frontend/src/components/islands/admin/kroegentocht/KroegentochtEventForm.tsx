'use client';

import { useState, useTransition } from 'react';
import type { SyntheticEvent, ChangeEvent } from 'react';
import {
    Save,
    Loader2,
    ArrowLeft,
    Calendar,
    Type,
    FileText,
    Mail,
    ImagePlus,
    X,
    MessageCircle,
    Users,
    Plus
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { upsertPubCrawlEvent, uploadPubCrawlImage } from '@/server/actions/admin/kroegentocht/admin-kroegentocht-core.actions';
import AdminToast from '@/components/ui/admin/AdminToast';
import { useAdminToast } from '@/hooks/use-admin-toast';
import { toLocalISOString } from '@/lib/utils/date-utils';
import MediaAsset from '@/components/ui/media/MediaAsset';
import { type PubCrawlEvent } from '@salvemundi/validations/schema/pub-crawl.zod';
import { safeConsoleError } from '@/server/utils/logger';
import { AdminDatepicker } from '@/components/ui/forms/AdminDatepicker';

const toISODateString = (date: Date | null): string => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

interface KroegentochtEventFormProps {
    event?: PubCrawlEvent;
}

interface GroupLeader {
    name: string;
    signupId?: number | null;
}

interface GroupConfig {
    name: string;
    leaders?: GroupLeader[];
}

export default function KroegentochtEventForm({ event }: KroegentochtEventFormProps) {
    const router = useRouter();
    const { toast, showToast, hideToast } = useAdminToast();
    const [isPending, startTransition] = useTransition();
    const normalizedEventGroups = ((event?.groups || []) as unknown[]).map((g: unknown): GroupConfig => {
        if (typeof g === 'string') return { name: g, leaders: [] };
        const obj = g && typeof g === 'object' ? (g as { name?: unknown; leaders?: unknown }) : {};
        return {
            name: typeof obj.name === 'string' ? obj.name : '',
            leaders: Array.isArray(obj.leaders) ? (obj.leaders as GroupLeader[]) : []
        };
    });

    const [formData, setFormData] = useState({
        name: event?.name || '',
        description: event?.description || '',
        date: toLocalISOString(event?.date) || '',
        email: event?.email || 'feest@salvemundi.nl',
        image: event?.image || null,
        whatsapp_community_url: event?.whatsapp_community_url || '',
        groups: (normalizedEventGroups.length > 0 ? normalizedEventGroups : []) as GroupConfig[]
    });
    const [eventDate, setEventDate] = useState<Date | null>(() => {
        return formData.date ? new Date(formData.date) : null;
    });
    const [uploading, setUploading] = useState(false);

    const isEdit = !!event?.id;

    const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const performUpload = async () => {
            setUploading(true);
            const uploadData = new FormData();
            uploadData.append('file', file);

            try {
                const result: unknown = await uploadPubCrawlImage(uploadData);
                if (result && typeof result === 'object') {
                    const obj = result as { data?: { id?: string }; id?: string };
                    const fileId = obj.data?.id ?? obj.id;
                    if (typeof fileId === 'string') {
                        setFormData(prev => ({ ...prev, image: fileId }));
                    }
                }
                showToast('Afbeelding succesvol geüpload', 'success');
            } catch (error) {
                safeConsoleError('[KroegentochtEventForm.tsx][KroegentochtEventForm] Upload mislukt', error);
                const message = error instanceof Error ? error.message : 'Upload mislukt';
                showToast(message, 'error');
            } finally {
                setUploading(false);
            }
        };

        void performUpload();
    };

    const handleSubmit = (e: SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        startTransition(async () => {
            try {
                await upsertPubCrawlEvent({
                    ...formData,
                    id: event?.id
                });
                showToast('Event succesvol opgeslagen', 'success');
                router.push('/beheer/kroegentocht');
                router.refresh();
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Fout bij opslaan';
                safeConsoleError(`[KroegentochtEventForm.tsx][KroegentochtEventForm] Error:`, error);
                showToast(message, 'error');
            }
        });
    };

    return (
        <>
            <form onSubmit={handleSubmit} className="mx-auto max-w-4xl space-y-8">
                <div className="rounded-2xl bg-(--bg-card) shadow-(--shadow-card) ring-1 ring-(--border-color)/30">
                    <div className="space-y-8 p-8">
                        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                            <div className="space-y-6 md:col-span-2">
                                <div className="space-y-2">
                                    <label className="ml-1 flex items-center gap-2 text-[10px] font-semibold text-(--text-muted)">
                                        <Type className="size-3" /> Event Naam
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="beheer-input w-full rounded-xl border-2 border-(--border-color)/50 bg-(--bg-main)/50 px-5 py-4 font-semibold text-(--text-main) transition-all focus:border-(--theme-purple) focus:ring-4 focus:ring-(--theme-purple)/10"
                                        placeholder="Bijv. Kroegentocht Stratumseind"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <label className="ml-1 flex items-center gap-2 text-[10px] font-semibold text-(--text-muted)">
                                            <Calendar className="size-3" /> Datum
                                        </label>
                                        <AdminDatepicker
                                            value={eventDate}
                                            onChange={(date) => {
                                                setEventDate(date);
                                                setFormData(prev => ({ ...prev, date: date ? toISODateString(date) : '' }));
                                            }}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="ml-1 flex items-center gap-2 text-[10px] font-semibold text-(--text-muted)">
                                            <Mail className="size-3" /> Contact E-mail
                                        </label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="beheer-input w-full rounded-xl border-2 border-(--border-color)/50 bg-(--bg-main)/50 px-5 py-4 font-semibold text-(--text-main) transition-all focus:border-(--theme-purple) focus:ring-4 focus:ring-(--theme-purple)/10"
                                            placeholder="Bijv. feest@salvemundi.nl"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="ml-1 flex items-center gap-2 text-[10px] font-semibold text-(--text-muted)">
                                        <MessageCircle className="size-3" /> WhatsApp Community Link
                                    </label>
                                    <input
                                        type="url"
                                        value={formData.whatsapp_community_url}
                                        onChange={(e) => setFormData({ ...formData, whatsapp_community_url: e.target.value })}
                                        className="beheer-input w-full rounded-xl border-2 border-(--border-color)/50 bg-(--bg-main)/50 px-5 py-4 font-semibold text-(--text-main) transition-all focus:border-(--theme-purple) focus:ring-4 focus:ring-(--theme-purple)/10"
                                        placeholder="Bijv. https://chat.whatsapp.com/..."
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="ml-1 flex items-center gap-2 text-[10px] font-semibold text-(--text-muted)">
                                    <ImagePlus className="size-3" /> Event Afbeelding
                                </label>
                                <div className="group/img relative h-46">
                                    {formData.image ? (
                                        <div className="group relative size-full overflow-hidden rounded-xl border-2 border-(--theme-purple)/30">
                                            <MediaAsset
                                                asset={formData.image}
                                                alt="Preview"
                                                fill
                                                className="object-cover transition-transform duration-500 group-hover:scale-110"
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData(prev => ({ ...prev, image: null }))}
                                                    className="icon-button rounded-full bg-red-500 p-3 text-white shadow-xl transition-transform hover:scale-110"
                                                >
                                                    <X className="size-5" />
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <label className="group flex size-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-(--border-color)/50 bg-(--bg-main)/50 transition-all hover:border-(--theme-purple)/50 hover:bg-(--theme-purple)/5">
                                            {uploading ? (
                                                <Loader2 className="size-8 animate-spin text-(--theme-purple)" />
                                            ) : (
                                                <>
                                                    <div className="mb-2 rounded-full bg-(--bg-card) p-4 transition-transform group-hover:scale-110">
                                                        <ImagePlus className="size-6 text-(--text-muted)" />
                                                    </div>
                                                    <span className="text-[10px] font-semibold text-(--text-muted)">Upload Image</span>
                                                </>
                                            )}
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                                disabled={uploading}
                                            />
                                        </label>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="ml-1 flex items-center gap-2 text-[10px] font-semibold text-(--text-muted)">
                                <FileText className="size-3" /> Beschrijving
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="min-h-40 beheer-input w-full rounded-xl border-2 border-(--border-color)/50 bg-(--bg-main)/50 px-5 py-4 font-semibold text-(--text-main) transition-all focus:border-(--theme-purple) focus:ring-4 focus:ring-(--theme-purple)/10"
                                placeholder="Korte omschrijving voor de deelnemers..."
                            />
                        </div>

                        <div className="space-y-4 border-t border-(--border-color)/20 pt-8">
                            <h3 className="flex items-center gap-2 text-sm font-semibold text-(--text-main)">
                                <Users className="size-4 text-(--theme-purple)" />
                                Groepen Indeling ({formData.groups.length})
                            </h3>
                            <p className="text-xs leading-relaxed text-(--text-muted)">
                                Definieer de groepen voor deze kroegentocht. Deelnemers kunnen vervolgens over deze groepen verdeeld worden.
                            </p>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                                {formData.groups.map((group, index) => (
                                    <div key={index} className="flex flex-col gap-2 rounded-xl border border-(--border-color)/50 bg-(--bg-main)/50 p-3 transition-all focus-within:border-(--theme-purple)/50">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={group.name}
                                                onChange={(e) => {
                                                    setFormData({
                                                        ...formData,
                                                        groups: formData.groups.map((g, i) =>
                                                            i === index ? { ...g, name: e.target.value } : g
                                                        )
                                                    });
                                                }}
                                                className="beheer-input flex-1 border-0 bg-transparent px-2 py-1 text-xs font-semibold text-(--text-main) focus:ring-0 focus:outline-none"
                                                placeholder={`Groep ${index + 1}`}
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const updated = formData.groups.filter((_, i) => i !== index);
                                                    setFormData({ ...formData, groups: updated });
                                                }}
                                                className="icon-button cursor-pointer p-1 text-(--text-muted) transition-colors hover:text-red-500"
                                                title="Verwijder groep"
                                            >
                                                <X className="size-3.5" />
                                            </button>
                                        </div>

                                        {group.leaders && group.leaders.length > 0 && (
                                            <div className="space-y-1 px-2 pb-1">
                                                <p className="text-[9px] font-bold tracking-wider text-(--text-muted) uppercase">Leiders:</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {group.leaders.map((leader, lIdx) => (
                                                        <span key={lIdx} className="inline-flex items-center gap-1 rounded border border-(--border-color)/50 bg-(--bg-card) px-1.5 py-0.5 text-[9px] font-semibold text-(--text-muted)">
                                                            {leader.name}
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setFormData({
                                                                        ...formData,
                                                                        groups: formData.groups.map((g, i) => {
                                                                            if (i !== index) return g;
                                                                            return { ...g, leaders: (g.leaders ?? []).filter((_, li) => li !== lIdx) };
                                                                        })
                                                                    });
                                                                }}
                                                                className="ml-1 icon-button cursor-pointer font-bold text-red-500 hover:text-red-700"
                                                                title="Verwijder leider"
                                                            >
                                                                &times;
                                                            </button>
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}

                                <button
                                    type="button"
                                    onClick={() => {
                                        setFormData({
                                            ...formData,
                                            groups: [...formData.groups, { name: `Groep ${formData.groups.length + 1}`, leaders: [] }]
                                        });
                                    }}
                                    className="beheer-button flex h-fit cursor-pointer items-center justify-center gap-2 self-center rounded-xl border-2 border-dashed border-(--border-color)/50 bg-(--bg-main)/30 p-3 text-xs font-semibold text-(--text-muted) transition-all hover:border-(--theme-purple)/50 hover:bg-(--theme-purple)/5 hover:text-(--theme-purple)"
                                >
                                    <Plus className="size-4" />
                                    Groep toevoegen
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                    <Link
                        href="/beheer/kroegentocht"
                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-(--border-color) bg-(--bg-card) px-8 py-4 text-xs font-semibold text-(--text-muted) transition-all hover:bg-(--bg-main) hover:text-(--text-main) active:scale-95 sm:w-auto"
                    >
                        <ArrowLeft className="size-4" />
                        Annuleren
                    </Link>

                    <button
                        type="submit"
                        disabled={isPending}
                        className="beheer-button flex w-full items-center justify-center gap-3 rounded-xl bg-(--theme-purple) px-12 py-5 text-sm font-semibold text-white shadow-(--shadow-glow) transition-all hover:opacity-95 active:scale-95 disabled:opacity-50 sm:w-auto"
                    >
                        {isPending ? (
                            <Loader2 className="size-5 animate-spin" />
                        ) : (
                            <Save className="size-5" />
                        )}
                        {isEdit ? 'Wijzigingen Opslaan' : 'Event Aanmaken'}
                    </button>
                </div>
            </form>
            <AdminToast toast={toast} onClose={hideToast} />
        </>
    );
}



