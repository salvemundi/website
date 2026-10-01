import type { Metadata } from 'next';
import BeheerPageShell from '@/components/ui/beheer/BeheerPageShell';
import CouponManagementIsland from '@/components/islands/beheer/coupons/CouponManagementIsland';
import { getCoupons } from '@/server/queries/coupon/beheer-coupon.queries';

export const metadata: Metadata = {
    title: 'Coupons Beheer | SV Salve Mundi' 
};

async function CouponDataLoader() {
    const coupons = await getCoupons();
    return <CouponManagementIsland initialCoupons={coupons} />;
}

export default async function BeheerCouponsPage() {
    return (
        <BeheerPageShell
            title="Coupons Beheer"
            backHref="/beheer"
            hideToolbar={true}
        >
            <CouponDataLoader />
        </BeheerPageShell>
    );
}
