import BeheerGuard from '@/components/ui/beheer/BeheerGuard';
import type { ReactNode } from 'react';

export default function CoboLayout({ children }: { children: ReactNode }) {
    return (
        <BeheerGuard
            feature="cobo"
            title="CoBo Beheer"
            description="Je hebt geen rechten om de CoBo (Constitutieborrel) te beheren."
        >
            {children}
        </BeheerGuard>
    );
}
