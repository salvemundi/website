import AdminGuard from '@/components/ui/admin/AdminGuard';
import type { ReactNode } from 'react';

export default function LedenLayout({ children }: { children: ReactNode }) {
    return (
        <AdminGuard 
            permission="canAccessMembers" 
            title="Leden Beheer" 
            description="Je hebt geen rechten om leden te beheren. Alleen het Bestuur en ICT hebben deze rechten."
        >
            {children}
        </AdminGuard>
    );
}
