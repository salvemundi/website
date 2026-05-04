'use client';

import { useState, useTransition } from 'react';
import { 
    MapPin, 
    ChevronLeft, 
    RefreshCcw,
    AlertCircle,
    Globe,
    Clock,
    UserCircle,
    CheckCircle
} from 'lucide-react';
import Link from 'next/link';
import AdminToast from '@/components/ui/admin/AdminToast';
import { useAdminToast } from '@/hooks/use-admin-toast';
import { deleteSticker, updateSticker } from '@/server/actions/admin-stickers.actions';
import AdminToolbar from '@/components/ui/admin/AdminToolbar';
import AdminStatsBar from '@/components/ui/admin/AdminStatsBar';
import StickersTable from '@/components/admin/stickers/StickersTable';

interface StickerManagementIslandProps {
    initialStickers: Record<string, unknown>[];
}

export default function StickerManagementIsland({
    initialStickers
}: StickerManagementIslandProps) {
    const { toast, showToast, hideToast } = useAdminToast();
    const [stickers, setStickers] = useState(initialStickers);
    const [isPending, startTransition] = useTransition();

    const handleDelete = async (id: number) => {
        try {
            await deleteSticker(id);
            setStickers(prev => prev.filter(s => s.id !== id));
            showToast('Sticker succesvol verwijderd', 'success');
        } catch (err) {
            showToast('Fout bij verwijderen: ' + err, 'error');
        }
    };

    const handleApprove = async (id: number) => {
        try {
            await updateSticker(id, { status: 'published' });
            setStickers(prev => prev.map(s => s.id === id ? { ...s, status: 'published' } : s));
            showToast('Sticker succesvol gepubliceerd', 'success');
        } catch (err) {
            showToast('Fout bij publiceren: ' + err, 'error');
        }
    };

    const publishedCount = stickers.filter(s => s.status === 'published').length;
    const draftCount = stickers.filter(s => s.status === 'draft' || !s.status).length;
    const countryCount = new Set(stickers.map(s => s.country).filter(Boolean)).size;

    const adminStats = [
        { label: 'Stickers', value: stickers.length, icon: MapPin, trend: 'Totaal' },
        { label: 'Gepubliceerd', value: publishedCount, icon: CheckCircle, trend: 'Live' },
        { label: 'Landen', value: countryCount, icon: Globe, trend: 'Wereldwijd' },
        { label: 'Afwachting', value: draftCount, icon: Clock, trend: 'Moderatie' },
    ];

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl animate-in fade-in duration-700">
            <AdminStatsBar stats={adminStats} />

            <div className="animate-in fade-in zoom-in-95 duration-500">
                <div className="flex items-center gap-3 mb-6">
                    <MapPin className="h-5 w-5 text-[var(--beheer-accent)]" />
                    <h2 className="text-lg font-semibold text-[var(--beheer-text)] tracking-tight  tracking-widest">
                        Geregistreerde <span className="text-[var(--beheer-accent)]">Locaties</span>
                    </h2>
                </div>

                {stickers.length > 0 ? (
                    <StickersTable 
                        stickers={stickers} 
                        onDelete={handleDelete} 
                        onApprove={handleApprove}
                    />
                ) : (
                    <div className="text-center py-32 bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] border border-dashed border-[var(--beheer-border)]">
                        <AlertCircle className="h-16 w-16 text-[var(--beheer-text-muted)] opacity-20 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold text-[var(--beheer-text)]  tracking-tight">Geen stickers gevonden</h2>
                        <p className="text-sm text-[var(--beheer-text-muted)] mt-2 font-bold  tracking-widest text-xs">Er zijn nog geen stickers geregistreerd.</p>
                    </div>
                )}
            </div>
            
            <AdminToast toast={toast} onClose={hideToast} />
        </div>
    );
}
