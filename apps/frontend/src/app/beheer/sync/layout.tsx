import AdminGuard from '@/components/ui/admin/AdminGuard';
import type { ReactNode } from 'react';

export default function SyncLayout({ children }: { children: ReactNode }) {
    return (
        <AdminGuard 
            feature="sync" 
            title="Azure Sync" 
            description="Deze systeemfunctie is exclusief gereserveerd voor de ICT-commissie."
        >
            {children}
        </AdminGuard>
    );
}
