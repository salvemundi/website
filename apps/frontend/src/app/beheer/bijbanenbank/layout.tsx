import BeheerGuard from '@/components/ui/beheer/BeheerGuard';
import type { ReactNode } from 'react';

export default function BijbanenbankAdminLayout({ children }: { children: ReactNode }) {
    return (
        <BeheerGuard
            feature="vacatures"
            title="Bijbanenbank Beheer"
            description="Je hebt geen rechten om de bijbanenbank te beheren."
        >
            {children}
        </BeheerGuard>
    );
}
