import BeheerGuard from '@/components/ui/beheer/BeheerGuard';
import type { ReactNode } from 'react';

export default function KroegentochtLayout({ children }: { children: ReactNode }) {
    return (
        <BeheerGuard
            feature="kroegentocht"
            title="Kroegentocht Beheer"
            description="Je hebt geen rechten om de Kroegentocht te beheren."
        >
            {children}
        </BeheerGuard>
    );
}
