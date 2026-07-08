import AdminGuard from '@/components/ui/admin/AdminGuard';
import type { ReactNode } from 'react';

export default function WebshopLayout({ children }: { children: ReactNode }) {
    return (
        <AdminGuard
            feature="webshop"
            title="Webshop Beheer"
            description="Je hebt geen rechten om de webshop te beheren."
        >
            {children}
        </AdminGuard>
    );
}
