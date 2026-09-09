import AdminGuard from '@/components/ui/admin/AdminGuard';
import type { ReactNode } from 'react';

export default function WebshopAfhalenLayout({ children }: { children: ReactNode }) {
    return (
        <AdminGuard
            feature="webshop_pickup"
            title="Afhaallijst"
            description="Alleen het bestuur kan de afhaallijst inzien."
        >
            {children}
        </AdminGuard>
    );
}
