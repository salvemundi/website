'use client';

import { useState } from 'react';
import { getImageUrl } from '@/lib/utils/image-utils';
import MediaAsset from '@/components/ui/media/MediaAsset';
import {
    Search,
    Trash,
    User,
    MapPin,
    Globe,
    Image as ImageIcon,
    X,
    CheckCircle
} from 'lucide-react';
import { formatDate } from '@/shared/lib/utils/date';

import { type StickerPublic } from '@salvemundi/validations';

type AdminSticker = Omit<StickerPublic, 'user_updated' | 'date_updated'>;

interface StickersTableProps {
    stickers: AdminSticker[];
    onDelete: (id: number) => void;
    onApprove: (id: number) => void;
}

const ASSET_URL = '/api/assets';

export default function StickersTable({ stickers, onDelete, onApprove }: StickersTableProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const filteredStickers = stickers.filter(s => {
        const search = searchQuery.toLowerCase();

        const userFullName = s.user_created
            ? `${s.user_created.first_name || ''} ${s.user_created.last_name || ''}`.toLowerCase()
            : '';

        return (
            (s.location_name || '').toLowerCase().includes(search) ||
            s.city?.toLowerCase().includes(search) ||
            s.country?.toLowerCase().includes(search) ||
            userFullName.includes(search)
        );
    });

    return (
        <div className="space-y-6">
            <div className="rounded-(--beheer-radius) border border-(--beheer-border) bg-(--beheer-card-bg) p-6 shadow-sm">
                <div className="flex items-center gap-3 rounded-(--beheer-radius) border border-(--beheer-border) bg-(--beheer-card-bg) px-4 py-3 shadow-sm transition-all focus-within:border-(--beheer-accent) focus-within:ring-2 focus-within:ring-(--beheer-accent)/20">
                    <Search className="size-4 shrink-0 text-(--beheer-text-muted)" />
                    <input
                        type="text"
                        placeholder="Zoek op locatie, stad, land of gebruiker..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        suppressHydrationWarning
                        className="beheer-input w-full border-none bg-transparent p-0 text-xs font-semibold text-(--beheer-text) placeholder:text-(--beheer-text-muted)/40 focus:outline-none"
                    />
                </div>
            </div>

            <div className="overflow-hidden rounded-(--beheer-radius) border border-(--beheer-border) bg-(--beheer-card-bg) shadow-sm">
                <div className="custom-scrollbar overflow-x-auto">
                    <table className="w-full min-w-200 border-collapse text-left">
                        <thead>
                            <tr className="border-b border-(--beheer-border) bg-(--beheer-card-soft) text-xs font-semibold text-(--beheer-text-muted)">
                                <th className="px-6 py-4">Locatie & Gebruiker</th>
                                <th className="px-6 py-4">Stad / Land</th>
                                <th className="px-6 py-4">Datum</th>
                                <th className="px-6 py-4 text-center">Foto</th>
                                <th className="px-6 py-4 text-right">Acties</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-(--beheer-border)/10">
                            {filteredStickers.map((sticker) => (
                                <tr key={sticker.id} className="group transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-700/20">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2">
                                                <span className="leading-tight font-semibold text-(--beheer-text) transition-colors group-hover:text-(--beheer-accent)">
                                                    {sticker.location_name || 'Onbekende Locatie'}
                                                </span>
                                                {sticker.status === 'published' ? (
                                                    <span className="rounded-md border border-green-500/20 bg-green-500/10 px-2 py-0.5 text-[10px] font-semibold text-green-600 dark:text-green-400">
                                                        Live
                                                    </span>
                                                ) : (
                                                    <span className="rounded-md border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                                                        Draft
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs font-medium text-(--beheer-text-muted)">
                                                <User className="size-3.5 opacity-60" />
                                                <span>
                                                    Geüpload door:{' '}
                                                    {sticker.user_created
                                                        ? `${sticker.user_created.first_name || ''} ${sticker.user_created.last_name || ''}`
                                                        : 'Systeem'}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <span className="flex items-center gap-1.5 text-sm leading-none font-semibold text-(--beheer-text)">
                                                <MapPin className="size-3.5 text-red-500/80" />
                                                {sticker.city || 'Onbekende stad'}
                                            </span>
                                            <span className="flex items-center gap-1.5 text-xs leading-none font-medium text-(--beheer-text-muted)">
                                                <Globe className="size-3.5 text-blue-500/80" />
                                                {sticker.country || 'Onbekend land'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium text-(--beheer-text-muted)">
                                        <span suppressHydrationWarning>
                                            {formatDate(sticker.date_created, 'dd MMM yyyy', '-')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div
                                            className="mx-auto flex size-12 cursor-pointer items-center justify-center overflow-hidden rounded-(--beheer-radius) border border-dashed border-(--beheer-border) bg-(--beheer-card-soft) text-(--beheer-text-muted) transition-colors hover:border-(--beheer-accent)"
                                            onClick={() => sticker.image && setSelectedImage(`${ASSET_URL}/${sticker.image}`)}
                                        >
                                            {!sticker.image ? (
                                                <ImageIcon className="size-4 opacity-30" />
                                            ) : (
                                                <MediaAsset
                                                    asset={getImageUrl(sticker.image, { width: 100, height: 100, fit: 'cover' }) || ''}
                                                    alt="Sticker"
                                                    width={48}
                                                    height={48}
                                                    className="size-full rounded-(--beheer-radius) object-cover"
                                                />
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            {sticker.status !== 'published' && (
                                                <button
                                                    onClick={() => onApprove(sticker.id)}
                                                    className="icon-button rounded-lg bg-green-500/10 p-2 text-green-600 shadow-sm transition-all hover:bg-green-600 hover:text-white dark:text-green-400"
                                                    title="Publiceren"
                                                >
                                                    <CheckCircle className="size-4" />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => onDelete(sticker.id)}
                                                className="icon-button rounded-lg bg-red-500/10 p-2 text-red-600 shadow-sm transition-all hover:bg-red-500 hover:text-white dark:text-red-400"
                                                title="Verwijderen"
                                            >
                                                <Trash className="size-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredStickers.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-16 text-center text-sm font-semibold text-(--beheer-text-muted) italic">
                                        Geen stickers gevonden voor dit filter.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedImage && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md"
                    onClick={() => setSelectedImage(null)}
                >
                    <div className="animate-in zoom-in-95 relative max-h-[90vh] max-w-4xl duration-300">
                        <div className="relative size-full min-h-[50vh] min-w-[50vw]">
                            <MediaAsset
                                asset={selectedImage}
                                alt="Sticker Full"
                                fill
                                className="rounded-(--beheer-radius) border border-(--beheer-border) object-contain shadow-2xl"
                            />
                        </div>
                        <button
                            className="absolute -top-4 -right-4 icon-button rounded-full border border-(--beheer-border) bg-(--beheer-card-bg) p-2 text-(--beheer-text) shadow-lg transition-colors hover:text-(--beheer-accent)"
                            onClick={() => setSelectedImage(null)}
                        >
                            <X className="size-5" />
                            <span className="sr-only">Sluiten</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

