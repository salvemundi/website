import AdminGuard from '@/components/ui/admin/AdminGuard';
import type { ReactNode } from 'react';

export default function BijbanenbankAdminLayout({ children }: { children: ReactNode }) {
    return (
        <AdminGuard
            feature="vacatures"
            title="Bijbanenbank Beheer"
            description="Je hebt geen rechten om de bijbanenbank te beheren."
        >
            {children}
        </AdminGuard>
    );
}
