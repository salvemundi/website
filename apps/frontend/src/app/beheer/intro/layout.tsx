import BeheerGuard from '@/components/ui/beheer/BeheerGuard';
import type { ReactNode } from 'react';

export default function IntroLayout({ children }: { children: ReactNode }) {
    return (
        <BeheerGuard
            feature="intro"
            title="Introductie Beheer"
            description="Je hebt geen rechten om de introductie te beheren."
        >
            {children}
        </BeheerGuard>
    );
}
