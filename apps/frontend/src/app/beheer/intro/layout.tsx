import AdminGuard from '@/components/ui/admin/AdminGuard';
import type { ReactNode } from 'react';

export default function IntroLayout({ children }: { children: ReactNode }) {
    return (
        <AdminGuard
            feature="intro"
            title="Introductie Beheer"
            description="Je hebt geen rechten om de introductie te beheren."
        >
            {children}
        </AdminGuard>
    );
}
