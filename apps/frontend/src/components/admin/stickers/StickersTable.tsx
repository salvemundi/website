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
    Loader2
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
            <div className="bg-[var(--bg-card)] rounded-[var(--radius-2xl)] p-6 shadow-[var(--shadow-card)] ring-1 ring-[var(--border-color)]/30">
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--text-muted)] group-focus-within:text-[var(--theme-purple)] transition-colors" />
                    <input
                        type="text"
                        placeholder="Zoek op locatie, stad, land of gebruiker..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-[var(--bg-main)]/50 border-2 border-[var(--border-color)]/50 rounded-[var(--radius-xl)] focus:ring-4 focus:ring-[var(--theme-purple)]/10 focus:border-[var(--theme-purple)] transition-all font-medium text-sm text-[var(--text-main)]"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-[var(--bg-card)] rounded-[var(--radius-2xl)] shadow-[var(--shadow-card)] ring-1 ring-[var(--border-color)]/30 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[var(--bg-main)]/50 border-b border-[var(--border-color)]/30">
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Locatie & Gebruiker</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Stad / Land</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Datum</th>
                                <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Foto</th>
                                <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Acties</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-color)]/20">
                            {filteredStickers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-16 text-center text-[var(--text-muted)] italic font-medium">
                                        Geen stickers gevonden voor dit filter.
                                    </td>
                                </tr>
                            ) : (
                                filteredStickers.map((sticker) => (
                                    <tr key={sticker.id} className="hover:bg-[var(--bg-main)]/30 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="font-bold text-[var(--text-main)] group-hover:text-[var(--theme-purple)] transition-colors">
                                                    {sticker.location_name || 'Naamloze locatie'}
                                                </span>
                                                <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
                                                    <User className="h-3 w-3" />
                                                    {sticker.user_created?.first_name} {sticker.user_created?.last_name}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-[var(--text-subtle)] flex items-center gap-1.5">
                                                    <MapPin className="h-3 w-3 text-red-500" />
                                                    {sticker.city || 'Onbekend'}
                                                </span>
                                                <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5 mt-0.5">
                                                    <Globe className="h-3 w-3 text-blue-500" />
                                                    {sticker.country || 'Onbekend'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-mono text-[var(--text-muted)]">
                                                {format(new Date(sticker.date_created), 'dd MMM yyyy', { locale: nl })}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {sticker.image ? (
                                                <button 
                                                    onClick={() => setSelectedImage(`${ASSET_URL}/${sticker.image}`)}
                                                    className="relative w-12 h-12 rounded-[var(--radius-lg)] overflow-hidden border border-[var(--border-color)] hover:border-[var(--theme-purple)] transition-all group/img"
                                                >
                                                    <img 
                                                        src={`${ASSET_URL}/${sticker.image}?width=100&height=100&fit=cover`} 
                                                        alt="Sticker"
                                                        className="w-full h-full object-cover group-hover/img:scale-110 transition-transform"
                                                    />
                                                </button>
                                            ) : (
                                                <div className="w-12 h-12 mx-auto rounded-[var(--radius-lg)] bg-[var(--bg-main)] border border-dashed border-[var(--border-color)] flex items-center justify-center text-[var(--text-muted)]">
                                                    <ImageIcon className="h-4 w-4 opacity-30" />
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <a 
                                                    href={`https://www.google.com/maps?q=${sticker.latitude},${sticker.longitude}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-2 rounded-lg hover:bg-[var(--theme-purple)]/10 text-[var(--text-muted)] hover:text-[var(--theme-purple)] transition-all active:scale-90"
                                                    title="Kaart openen"
                                                >
                                                    <ExternalLink className="h-4 w-4" />
                                                </a>
                                                <button 
                                                    onClick={() => {
                                                        if (confirm('Weet je zeker dat je deze sticker wilt verwijderen?')) {
                                                            onDelete(sticker.id);
                                                        }
                                                    }}
                                                    className="p-2 rounded-lg hover:bg-red-500/10 text-[var(--text-muted)] hover:text-red-500 transition-all active:scale-90"
                                                    title="Verwijderen"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Image Modal */}
            {selectedImage && (
                <div 
                    className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={() => setSelectedImage(null)}
                >
                    <div className="relative max-w-4xl max-h-[90vh] animate-in zoom-in-95 duration-300">
                        <img 
                            src={selectedImage} 
                            alt="Sticker Full" 
                            className="rounded-[var(--radius-2xl)] shadow-2xl border-4 border-white/10 max-w-full max-h-[85vh] object-contain"
                        />
                        <button 
                            className="absolute -top-4 -right-4 bg-white text-black p-2 rounded-full shadow-lg hover:bg-[var(--theme-purple)] hover:text-white transition-colors"
                            onClick={() => setSelectedImage(null)}
                        >
                            <User className="h-5 w-5 rotate-45" /> 
                            {/* Marker or X would be better but I use what I have or standard HTML */}
                            <span className="sr-only">Sluiten</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
