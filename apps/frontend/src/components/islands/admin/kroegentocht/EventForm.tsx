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
import { upsertPubCrawlEvent, uploadPubCrawlImage } from '@/server/actions/admin/admin-kroegentocht.actions';
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

interface EventFormProps {
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

export default function EventForm({ event }: EventFormProps) {
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
        groups: (normalizedEventGroups.length > 0 ? normalizedEventGroups : [
            { name: 'Pils Panters', leaders: [] },
            { name: 'Tipsy Tijgers', leaders: [] },
            { name: 'Flamingos', leaders: [] },
            { name: 'Krokobillen', leaders: [] },
            { name: 'Jaeger Meisters', leaders: [] },
            { name: 'Lamme Leeuwen', leaders: [] },
            { name: 'Aapjes', leaders: [] },
            { name: 'Zuipende Zebra\'s', leaders: [] }
        ]) as GroupConfig[]
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
                safeConsoleError('[EventForm.tsx][EventForm] Upload mislukt', error);
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
                safeConsoleError(`[EventForm.tsx][EventForm] Error:`, error);
                showToast(message, 'error');
            }
        });
    };

    return (
        <>
            <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl mx-auto">
                <div className="bg-(--bg-card) rounded-2xl shadow-(--shadow-card) ring-1 ring-(--border-color)/30">
                    <div className="p-8 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="md:col-span-2 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-semibold text-(--text-muted) ml-1 flex items-center gap-2">
                                        <Type className="h-3 w-3" /> Event Naam
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-5 py-4 bg-(--bg-main)/50 border-2 border-(--border-color)/50 rounded-xl focus:ring-4 focus:ring-(--theme-purple)/10 focus:border-(--theme-purple) transition-all font-semibold text-(--text-main)"
                                        placeholder="Bijv. Kroegentocht Stratumseind"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-semibold text-(--text-muted) ml-1 flex items-center gap-2">
                                            <Calendar className="h-3 w-3" /> Datum
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
                                        <label className="text-[10px] font-semibold text-(--text-muted) ml-1 flex items-center gap-2">
                                            <Mail className="h-3 w-3" /> Contact E-mail
                                        </label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full px-5 py-4 bg-(--bg-main)/50 border-2 border-(--border-color)/50 rounded-xl focus:ring-4 focus:ring-(--theme-purple)/10 focus:border-(--theme-purple) transition-all font-semibold text-(--text-main)"
                                            placeholder="Bijv. feest@salvemundi.nl"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-semibold text-(--text-muted) ml-1 flex items-center gap-2">
                                        <MessageCircle className="h-3 w-3" /> WhatsApp Community Link
                                    </label>
                                    <input
                                        type="url"
                                        value={formData.whatsapp_community_url}
                                        onChange={(e) => setFormData({ ...formData, whatsapp_community_url: e.target.value })}
                                        className="w-full px-5 py-4 bg-(--bg-main)/50 border-2 border-(--border-color)/50 rounded-xl focus:ring-4 focus:ring-(--theme-purple)/10 focus:border-(--theme-purple) transition-all font-semibold text-(--text-main)"
                                        placeholder="Bijv. https://chat.whatsapp.com/..."
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-semibold text-(--text-muted) ml-1 flex items-center gap-2">
                                    <ImagePlus className="h-3 w-3" /> Event Afbeelding
                                </label>
                                <div className="relative group/img h-[184px]">
                                    {formData.image ? (
                                        <div className="relative w-full h-full rounded-xl overflow-hidden border-2 border-(--theme-purple)/30 group">
                                            <MediaAsset
                                                asset={formData.image}
                                                alt="Preview"
                                                fill
                                                className="object-cover transition-transform duration-500 group-hover:scale-110"
                                            />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData(prev => ({ ...prev, image: null }))}
                                                    className="p-3 bg-red-500 text-white rounded-full shadow-xl hover:scale-110 transition-transform"
                                                >
                                                    <X className="h-5 w-5" />
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <label className="flex flex-col items-center justify-center w-full h-full bg-(--bg-main)/50 border-2 border-dashed border-(--border-color)/50 rounded-xl hover:border-(--theme-purple)/50 hover:bg-(--theme-purple)/5 transition-all cursor-pointer group">
                                            {uploading ? (
                                                <Loader2 className="h-8 w-8 text-(--theme-purple) animate-spin" />
                                            ) : (
                                                <>
                                                    <div className="p-4 rounded-full bg-(--bg-card) mb-2 group-hover:scale-110 transition-transform">
                                                        <ImagePlus className="h-6 w-6 text-(--text-muted)" />
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
                            <label className="text-[10px] font-semibold text-(--text-muted) ml-1 flex items-center gap-2">
                                <FileText className="h-3 w-3" /> Beschrijving
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full px-5 py-4 bg-(--bg-main)/50 border-2 border-(--border-color)/50 rounded-xl focus:ring-4 focus:ring-(--theme-purple)/10 focus:border-(--theme-purple) transition-all font-semibold text-(--text-main) min-h-[160px]"
                                placeholder="Korte omschrijving voor de deelnemers..."
                            />
                        </div>

                        <div className="border-t border-(--border-color)/20 pt-8 space-y-4">
                            <h3 className="text-sm font-semibold text-(--text-main) flex items-center gap-2">
                                <Users className="h-4 w-4 text-(--theme-purple)" />
                                Groepen Indeling ({formData.groups.length})
                            </h3>
                            <p className="text-xs text-(--text-muted) leading-relaxed">
                                Definieer de groepen voor deze kroegentocht. Deelnemers kunnen vervolgens over deze groepen verdeeld worden.
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                {formData.groups.map((group, index) => (
                                    <div key={index} className="flex flex-col gap-2 bg-(--bg-main)/50 p-3 border border-(--border-color)/50 rounded-xl focus-within:border-(--theme-purple)/50 transition-all">
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
                                                className="flex-1 bg-transparent border-0 focus:ring-0 text-xs font-semibold text-(--text-main) px-2 py-1 focus:outline-none"
                                                placeholder={`Groep ${index + 1}`}
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const updated = formData.groups.filter((_, i) => i !== index);
                                                    setFormData({ ...formData, groups: updated });
                                                }}
                                                className="p-1 text-(--text-muted) hover:text-red-500 transition-colors cursor-pointer"
                                                title="Verwijder groep"
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </button>
                                        </div>

                                        {group.leaders && group.leaders.length > 0 && (
                                            <div className="px-2 pb-1 space-y-1">
                                                <p className="text-[9px] font-bold text-(--text-muted) uppercase tracking-wider">Leiders:</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {group.leaders.map((leader, lIdx) => (
                                                        <span key={lIdx} className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-(--bg-card) border border-(--border-color)/50 rounded text-[9px] font-semibold text-(--text-muted)">
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
                                                                className="text-red-500 hover:text-red-700 font-bold ml-1 cursor-pointer"
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
                                    className="flex items-center justify-center gap-2 p-3 bg-(--bg-main)/30 border-2 border-dashed border-(--border-color)/50 rounded-xl hover:border-(--theme-purple)/50 hover:bg-(--theme-purple)/5 transition-all text-xs font-semibold text-(--text-muted) hover:text-(--theme-purple) cursor-pointer h-fit self-center"
                                >
                                    <Plus className="h-4 w-4" />
                                    Groep toevoegen
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <Link
                        href="/beheer/kroegentocht"
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-(--bg-card) border border-(--border-color) rounded-xl text-xs font-semibold text-(--text-muted) hover:text-(--text-main) hover:bg-(--bg-main) transition-all active:scale-95"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Annuleren
                    </Link>

                    <button
                        type="submit"
                        disabled={isPending}
                        className="w-full sm:w-auto flex items-center justify-center gap-3 px-12 py-5 bg-(--theme-purple) text-white font-semibold text-sm rounded-xl shadow-(--shadow-glow) hover:opacity-95 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {isPending ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <Save className="h-5 w-5" />
                        )}
                        {isEdit ? 'Wijzigingen Opslaan' : 'Event Aanmaken'}
                    </button>
                </div>
            </form>
            <AdminToast toast={toast} onClose={hideToast} />
        </>
    );
}



