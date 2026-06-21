import AdminGuard from '@/components/ui/admin/AdminGuard';
import type { ReactNode } from 'react';

export default function LoggingLayout({ children }: { children: ReactNode }) {
    return (
        <AdminGuard 
            permission="isICT" 
            title="Audit Logboek" 
            description="Deze systeemfunctie is exclusief gereserveerd voor de ICT-commissie."
        >
            {children}
        </AdminGuard>
    );
}
