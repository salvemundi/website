import AdminGuard from '@/components/ui/admin/AdminGuard';
import type { ReactNode } from 'react';

export default function ImpersonateLayout({ children }: { children: ReactNode }) {
    return (
        <AdminGuard 
            permission="isICT" 
            title="Test Modus" 
            description="Deze systeemfunctie is exclusief gereserveerd voor de ICT-commissie."
        >
            {children}
        </AdminGuard>
    );
}
