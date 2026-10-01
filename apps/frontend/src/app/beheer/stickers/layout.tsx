import BeheerGuard from '@/components/ui/beheer/BeheerGuard';
import type { ReactNode } from 'react';

export default function StickersLayout({ children }: { children: ReactNode }) {
    return (
        <BeheerGuard 
            feature="stickers" 
            title="Sticker Beheer" 
            description="Je hebt geen rechten om stickers te beheren."
        >
            {children}
        </BeheerGuard>
    );
}
