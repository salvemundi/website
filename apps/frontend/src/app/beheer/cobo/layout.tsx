import AdminGuard from '@/components/ui/admin/AdminGuard';
import type { ReactNode } from 'react';

export default function CoboLayout({ children }: { children: ReactNode }) {
    return (
        <AdminGuard
            feature="cobo"
            title="CoBo Beheer"
            description="Je hebt geen rechten om de CoBo (Constitutieborrel) te beheren."
        >
            {children}
        </AdminGuard>
    );
}
