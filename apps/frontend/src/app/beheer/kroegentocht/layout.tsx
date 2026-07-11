import AdminGuard from '@/components/ui/admin/AdminGuard';
import type { ReactNode } from 'react';

export default function KroegentochtLayout({ children }: { children: ReactNode }) {
    return (
        <AdminGuard
            feature="kroegentocht"
            title="Kroegentocht Beheer"
            description="Je hebt geen rechten om de Kroegentocht te beheren."
        >
            {children}
        </AdminGuard>
    );
}
