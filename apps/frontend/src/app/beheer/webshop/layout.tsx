import BeheerGuard from '@/components/ui/beheer/BeheerGuard';
import type { ReactNode } from 'react';

export default function WebshopLayout({ children }: { children: ReactNode }) {
    return (
        <BeheerGuard
            feature="webshop"
            title="Webshop Beheer"
            description="Je hebt geen rechten om de webshop te beheren."
        >
            {children}
        </BeheerGuard>
    );
}
