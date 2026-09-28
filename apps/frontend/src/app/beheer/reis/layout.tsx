import BeheerGuard from '@/components/ui/beheer/BeheerGuard';
import type { ReactNode } from 'react';

export default function ReisLayout({ children }: { children: ReactNode }) {
    return (
        <BeheerGuard
            feature="reis"
            title="Reis Beheer"
            description="Je hebt geen rechten om de reis te beheren."
        >
            {children}
        </BeheerGuard>
    );
}