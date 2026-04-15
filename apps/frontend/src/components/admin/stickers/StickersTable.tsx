'use client';

import { useState } from 'react';
import { 
    Search, 
    Trash2, 
    ExternalLink, 
    User, 
    MapPin, 
    Globe, 
    Image as ImageIcon,
    Loader2,
    X
} from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

interface StickersTableProps {
    stickers: any[];
    onDelete: (id: number) => void;
}

const ASSET_URL = '/api/assets';

export default function StickersTable({ stickers, onDelete }: StickersTableProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const filteredStickers = stickers.filter(s => {
        const search = searchQuery.toLowerCase();
        return (
            s.location_name?.toLowerCase().includes(search) ||
            s.city?.toLowerCase().includes(search) ||
            s.country?.toLowerCase().includes(search) ||
            (s.user_created?.first_name + ' ' + s.user_created?.last_name).toLowerCase().includes(search)
        );
    });

    return (
        <div className="space-y-6">
            {/* Search */}
            <div className="bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] p-6 shadow-sm border border-[var(--beheer-border)]">
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--beheer-text-muted)] group-focus-within:text-[var(--beheer-accent)] transition-colors" />
                    <input
                        type="text"
                        placeholder="Zoek op locatie, stad, land of gebruiker..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        suppressHydrationWarning
                        className="w-full pl-12 pr-4 py-3 bg-[var(--bg-main)]/50 border border-[var(--beheer-border)] rounded-[var(--beheer-radius)] focus:ring-4 focus:ring-[var(--beheer-accent)]/10 focus:border-[var(--beheer-accent)] transition-all font-bold text-[10px] uppercase tracking-widest text-[var(--beheer-text)] placeholder:text-[var(--beheer-text-muted)]"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] shadow-xl border border-[var(--beheer-border)] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[var(--bg-main)]/50 border-b border-[var(--beheer-border)]">
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--beheer-text-muted)]">Locatie & Gebruiker</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Stad / Land</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Datum</th>
                                <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Foto</th>
                                <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-[var(--beheer-text-muted)]">Acties</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--beheer-border)]/10">
                            {filteredStickers.map((sticker) => (
                                <tr key={sticker.id} className="hover:bg-[var(--bg-main)]/30 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <span className="font-black text-[var(--beheer-text)] group-hover:text-[var(--beheer-accent)] transition-colors uppercase tracking-tight">
                                                {sticker.location_name === 'Imported' ? (sticker.city || sticker.address || 'Imported') : (sticker.location_name || 'Naamloze locatie')}
                                            </span>
                                            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[var(--beheer-text-muted)]">
                                                <User className="h-3 w-3" />
                                                {`${sticker.user_created?.first_name} ${sticker.user_created?.last_name}`}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-[var(--beheer-text)] flex items-center gap-1.5 uppercase tracking-widest leading-none">
                                                <MapPin className="h-3 w-3 text-red-500" />
                                                {sticker.city || ''}
                                            </span>
                                            <span className="text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest flex items-center gap-1.5 mt-1.5 leading-none">
                                                <Globe className="h-3 w-3 text-blue-500" />
                                                {sticker.country || ''}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest" suppressHydrationWarning>
                                            {sticker.date_created ? format(new Date(sticker.date_created), 'dd MMM yyyy', { locale: nl }) : '-'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div 
                                            className="w-12 h-12 mx-auto rounded-[var(--beheer-radius)] bg-[var(--bg-main)] border border-dashed border-[var(--beheer-border)] flex items-center justify-center text-[var(--beheer-text-muted)] cursor-pointer hover:border-[var(--beheer-accent)] transition-colors overflow-hidden"
                                            onClick={() => sticker.image && setSelectedImage(`${ASSET_URL}/${sticker.image}`)}
                                        >
                                            {!sticker.image ? (
                                                <ImageIcon className="h-4 w-4 opacity-30" />
                                            ) : (
                                                <img 
                                                    src={`${ASSET_URL}/${sticker.image}?width=100&height=100&fit=cover`} 
                                                    alt="Sticker"
                                                    className="w-full h-full object-cover rounded-[var(--beheer-radius)]"
                                                />
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button 
                                                onClick={() => onDelete(sticker.id)}
                                                className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                                title="Verwijderen"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredStickers.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-16 text-center text-[var(--beheer-text-muted)] italic font-bold uppercase tracking-widest text-[10px]">
                                        Geen stickers gevonden voor dit filter.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Image Modal */}
            {selectedImage && (
                <div 
                    className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4"
                    onClick={() => setSelectedImage(null)}
                >
                     <div className="relative max-w-4xl max-h-[90vh] animate-in zoom-in-95 duration-300">
                        <img 
                            src={selectedImage} 
                            alt="Sticker Full" 
                            className="rounded-[var(--beheer-radius)] shadow-2xl border border-[var(--beheer-border)] max-w-full max-h-[85vh] object-contain"
                        />
                        <button 
                            className="absolute -top-4 -right-4 bg-[var(--beheer-card-bg)] text-[var(--beheer-text)] p-2 rounded-full shadow-lg hover:text-[var(--beheer-accent)] transition-colors border border-[var(--beheer-border)]"
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

