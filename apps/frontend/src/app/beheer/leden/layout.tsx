import BeheerGuard from '@/components/ui/beheer/BeheerGuard';
import type { ReactNode } from 'react';

export default function LedenLayout({ children }: { children: ReactNode }) {
    return (
        <BeheerGuard
            feature="leden"
            title="Leden Beheer"
            description="Je hebt geen rechten om leden te beheren."
        >
            {children}
        </BeheerGuard>
    );
}
