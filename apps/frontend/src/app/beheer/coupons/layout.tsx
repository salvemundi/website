import AdminGuard from '@/components/ui/admin/AdminGuard';
import type { ReactNode } from 'react';

export default function CouponsLayout({ children }: { children: ReactNode }) {
    return (
        <AdminGuard
            feature="coupons"
            title="Coupon Beheer"
            description="Je hebt geen rechten om coupons te beheren."
        >
            {children}
        </AdminGuard>
    );
}
