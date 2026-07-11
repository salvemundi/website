import AdminGuard from '@/components/ui/admin/AdminGuard';
import type { ReactNode } from 'react';

export default function CommissiesLayout({ children }: { children: ReactNode }) {
    return (
        <AdminGuard
            feature="commissies"
            title="Commissie Beheer"
            description="Je hebt geen rechten om commissies te beheren."
        >
            {children}
        </AdminGuard>
    );
}
