import AdminGuard from '@/components/ui/admin/AdminGuard';
import type { ReactNode } from 'react';

export default function ReisLayout({ children }: { children: ReactNode }) {
    return (
        <AdminGuard 
            feature="reis" 
            title="Reis Beheer" 
            description="Je hebt geen rechten om de reis te beheren. Alleen de Reiscommissie, het Bestuur en ICT hebben deze rechten."
        >
            {children}
        </AdminGuard>
    );
}
