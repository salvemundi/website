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
            <div className="bg-(--beheer-card-bg) rounded-(--beheer-radius) p-6 shadow-sm border border-(--beheer-border)">
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-(--beheer-text-muted) group-focus-within:text-(--beheer-accent) transition-colors" />
                    <input
                        type="text"
                        placeholder="Zoek op locatie, stad, land of gebruiker..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        suppressHydrationWarning
                        className="w-full pl-12 pr-4 py-3 bg-(--bg-main)/50 border border-(--beheer-border) rounded-(--beheer-radius) focus:ring-4 focus:ring-(--beheer-accent)/10 focus:border-(--beheer-accent) transition-all font-bold text-[10px] uppercase tracking-widest text-(--beheer-text) placeholder:text-(--beheer-text-muted)"
                    />
                </div>
            </div>

            <div className="bg-(--beheer-card-bg) rounded-(--beheer-radius) shadow-xl border border-(--beheer-border) overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-(--bg-main)/50 border-b border-(--beheer-border)">
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-(--beheer-text-muted)">Locatie & Gebruiker</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-(--text-muted)">Stad / Land</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-(--text-muted)">Datum</th>
                                <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest text-(--text-muted)">Foto</th>
                                <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-(--beheer-text-muted)">Acties</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-(--beheer-border)/10">
                            {filteredStickers.map((sticker) => (
                                <tr key={sticker.id} className="hover:bg-(--bg-main)/30 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-black text-(--beheer-text) group-hover:text-(--beheer-accent) transition-colors uppercase tracking-tight">
                                                    {sticker.user_created
                                                        ? `${sticker.user_created.first_name || ''} ${sticker.user_created.last_name || ''}`
                                                        : 'Systeem'}                                              </span>
                                                {sticker.status === 'published' ? (
                                                    <span className="px-1.5 py-0.5 rounded-md bg-green-500/10 text-green-500 text-[8px] font-black uppercase tracking-widest border border-green-500/20">
                                                        Live
                                                    </span>
                                                ) : (
                                                    <span className="px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-500 text-[8px] font-black uppercase tracking-widest border border-amber-500/20">
                                                        Draft
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-(--beheer-text-muted)">
                                                <User className="h-3 w-3" />
                                                {sticker.user_created
                                                    ? `${sticker.user_created.first_name || ''} ${sticker.user_created.last_name || ''}`
                                                    : 'Systeem'}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-(--beheer-text) flex items-center gap-1.5 uppercase tracking-widest leading-none">
                                                <MapPin className="h-3 w-3 text-red-500" />
                                                {sticker.city || ''}
                                            </span>
                                            <span className="text-[10px] font-black text-(--beheer-text-muted) uppercase tracking-widest flex items-center gap-1.5 mt-1.5 leading-none">
                                                <Globe className="h-3 w-3 text-blue-500" />
                                                {sticker.country || ''}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-[10px] font-black text-(--beheer-text-muted) uppercase tracking-widest" suppressHydrationWarning>
                                            {formatDate(sticker.date_created, 'dd MMM yyyy')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div
                                            className="w-12 h-12 mx-auto rounded-(--beheer-radius) bg-(--bg-main) border border-dashed border-(--beheer-border) flex items-center justify-center text-(--beheer-text-muted) cursor-pointer hover:border-(--beheer-accent) transition-colors overflow-hidden"
                                            onClick={() => sticker.image && setSelectedImage(`${ASSET_URL}/${sticker.image}`)}
                                        >
                                            {!sticker.image ? (
                                                <ImageIcon className="h-4 w-4 opacity-30" />
                                            ) : (
                                                <MediaAsset
                                                    asset={getImageUrl(sticker.image, { width: 100, height: 100, fit: 'cover' }) || ''}
                                                    alt="Sticker"
                                                    width={48}
                                                    height={48}
                                                    className="w-full h-full object-cover rounded-(--beheer-radius)"
                                                />
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            {sticker.status !== 'published' && (
                                                <button
                                                    onClick={() => onApprove(sticker.id)}
                                                    className="p-2 bg-green-500/10 text-green-500 rounded-lg hover:bg-green-500 hover:text-white transition-all shadow-sm"
                                                    title="Publiceren"
                                                >
                                                    <CheckCircle className="h-4 w-4" />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => onDelete(sticker.id)}
                                                className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                                title="Verwijderen"
                                            >
                                                <Trash className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredStickers.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-16 text-center text-(--beheer-text-muted) italic font-bold uppercase tracking-widest text-[10px]">
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
                    className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4"
                    onClick={() => setSelectedImage(null)}
                >
                    <div className="relative max-w-4xl max-h-[90vh] animate-in zoom-in-95 duration-300">
                        <div className="relative w-full h-full min-h-[50vh] min-w-[50vw]">
                            <MediaAsset
                                asset={selectedImage}
                                alt="Sticker Full"
                                fill
                                className="rounded-(--beheer-radius) shadow-2xl border border-(--beheer-border) object-contain"
                            />
                        </div>
                        <button
                            className="absolute -top-4 -right-4 bg-(--beheer-card-bg) text-(--beheer-text) p-2 rounded-full shadow-lg hover:text-(--beheer-accent) transition-colors border border-(--beheer-border)"
                            onClick={() => setSelectedImage(null)}
                        >
                            <X className="h-5 w-5" />
                            <span className="sr-only">Sluiten</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

