import AdminGuard from '@/components/ui/admin/AdminGuard';
import type { ReactNode } from 'react';

export default function LedenLayout({ children }: { children: ReactNode }) {
    return (
        <AdminGuard
            feature="leden"
            title="Leden Beheer"
            description="Je hebt geen rechten om leden te beheren."
        >
            {children}
        </AdminGuard>
    );
}
