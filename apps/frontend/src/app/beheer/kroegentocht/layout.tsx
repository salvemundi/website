import AdminGuard from '@/components/ui/admin/AdminGuard';
import type { ReactNode } from 'react';

export default function KroegentochtLayout({ children }: { children: ReactNode }) {
    return (
        <AdminGuard 
            permission="canAccessKroegentocht" 
            title="Kroegentocht Beheer" 
            description="Je hebt geen rechten om de Kroegentocht te beheren. Alleen de Feestcommissie, het Bestuur en ICT hebben deze rechten."
        >
            {children}
        </AdminGuard>
    );
}
