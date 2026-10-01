import BeheerGuard from '@/components/ui/beheer/BeheerGuard';
import type { ReactNode } from 'react';

export default function CouponsLayout({ children }: { children: ReactNode }) {
    return (
        <BeheerGuard
            feature="coupons"
            title="Coupon Beheer"
            description="Je hebt geen rechten om coupons te beheren."
        >
            {children}
        </BeheerGuard>
    );
}
