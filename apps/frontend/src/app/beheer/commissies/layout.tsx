import BeheerGuard from '@/components/ui/beheer/BeheerGuard';
import type { ReactNode } from 'react';

export default function CommissiesLayout({ children }: { children: ReactNode }) {
    return (
        <BeheerGuard
            feature="commissies"
            title="Commissie Beheer"
            description="Je hebt geen rechten om commissies te beheren."
        >
            {children}
        </BeheerGuard>
    );
}
