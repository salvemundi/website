'use client';

import { useState, useTransition } from 'react';
import { 
    MapPin, 
    AlertCircle
} from 'lucide-react';
import AdminToast from '@/components/ui/admin/AdminToast';
import { useAdminToast } from '@/hooks/use-admin-toast';
import { deleteSticker, updateSticker } from '@/server/actions/admin-stickers.actions';
import StickersTable from '@/components/admin/stickers/StickersTable';
import { type StickerPublic } from '@salvemundi/validations';

interface StickerManagementIslandProps {
    initialStickers: StickerPublic[];
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

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">

            <div>
                <div className="flex items-center gap-3 mb-6">
                    <MapPin className="h-5 w-5 text-[var(--beheer-accent)]" />
                    <h2 className="text-lg font-semibold text-[var(--beheer-text)] tracking-tight">
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
                        <p className="text-sm text-[var(--beheer-text-muted)] mt-2 font-semibold text-xs">Er zijn nog geen stickers geregistreerd.</p>
                    </div>
                )}
            </div>
            
            <AdminToast toast={toast} onClose={hideToast} />
        </div>
    );
}
