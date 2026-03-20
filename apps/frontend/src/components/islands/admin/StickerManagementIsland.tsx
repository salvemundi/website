'use client';

import { useState, useTransition } from 'react';
import { 
    MapPin, 
    ChevronLeft, 
    RefreshCcw,
    AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { deleteSticker } from '@/server/actions/admin-stickers.actions';

import StickerStats from '@/components/admin/stickers/StickerStats';
import StickersTable from '@/components/admin/stickers/StickersTable';

interface StickerManagementIslandProps {
    initialStickers: any[];
}

export default function StickerManagementIsland({
    initialStickers
}: StickerManagementIslandProps) {
    const [stickers, setStickers] = useState(initialStickers);
    const [isPending, startTransition] = useTransition();

    const handleDelete = async (id: number) => {
        try {
            await deleteSticker(id);
            setStickers(prev => prev.filter(s => s.id !== id));
        } catch (err) {
            alert('Fout bij verwijderen: ' + err);
        }
    };

    const handleRefresh = () => {
        startTransition(() => {
            // refresh logic is handled via router.refresh in server component usually,
            // but for simple local state update we can just trigger a re-fetch if we had a get function here.
            // For now, we rely on the initialStickers prop being updated via server refresh.
            window.location.reload();
        });
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Top Toolbar */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                <div className="flex items-center gap-4">
                    <Link 
                        href="/beheer" 
                        className="p-3 rounded-[var(--radius-xl)] bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--theme-purple)] transition-all active:scale-90"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black text-[var(--text-main)] tracking-tighter uppercase">Sticker <span className="text-[var(--theme-purple)]">Beheer</span></h1>
                        <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Moderatie van geplakte stickers wereldwijd</p>
                    </div>
                </div>

                <button
                    onClick={handleRefresh}
                    disabled={isPending}
                    className="flex items-center gap-2 px-6 py-3 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[var(--radius-xl)] text-xs font-black uppercase tracking-widest text-[var(--text-subtle)] hover:border-[var(--theme-purple)]/50 transition-all active:scale-95 disabled:opacity-50"
                >
                    <RefreshCcw className={`h-4 w-4 ${isPending ? 'animate-spin' : ''}`} />
                    Vernieuwen
                </button>
            </div>

            {/* Stats */}
            <StickerStats stickers={stickers} />

            {/* Table */}
            <div className="animate-in fade-in zoom-in-95 duration-500">
                <div className="flex items-center gap-3 mb-6">
                    <MapPin className="h-6 w-6 text-[var(--theme-purple)]" />
                    <h2 className="text-2xl font-black text-[var(--text-main)] tracking-tight uppercase">
                        Geregistreerde <span className="text-[var(--theme-purple)]">Locaties</span>
                    </h2>
                </div>

                {stickers.length > 0 ? (
                    <StickersTable 
                        stickers={stickers} 
                        onDelete={handleDelete} 
                    />
                ) : (
                    <div className="text-center py-32 bg-[var(--bg-card)]/40 rounded-[var(--radius-2xl)] border-2 border-dashed border-[var(--border-color)]/30">
                        <AlertCircle className="h-16 w-16 text-[var(--text-muted)] opacity-20 mx-auto mb-4" />
                        <h2 className="text-xl font-black text-[var(--text-main)] uppercase tracking-tight">Geen stickers gevonden</h2>
                        <p className="text-sm text-[var(--text-subtle)] mt-2">Er zijn nog geen stickers geregistreerd in het systeem.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
