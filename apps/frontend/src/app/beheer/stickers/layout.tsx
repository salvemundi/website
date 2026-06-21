import AdminGuard from '@/components/ui/admin/AdminGuard';
import type { ReactNode } from 'react';

export default function StickersLayout({ children }: { children: ReactNode }) {
    return (
        <AdminGuard 
            permission="canAccessStickers" 
            title="Sticker Beheer" 
            description="Je hebt geen rechten om stickers te beheren. Alleen het Bestuur en ICT hebben deze rechten."
        >
            {children}
        </AdminGuard>
    );
}
