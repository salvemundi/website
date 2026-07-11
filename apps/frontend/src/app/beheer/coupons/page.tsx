import type { Metadata } from 'next';
import AdminPageShell from '@/components/ui/admin/AdminPageShell';
import CouponManagementIsland from '@/components/islands/admin/coupons/CouponManagementIsland';
import { getCoupons } from '@/server/queries/coupon/admin-coupon.queries';

export const metadata: Metadata = {
    title: 'Coupons Beheer | SV Salve Mundi' 
};

async function CouponDataLoader() {
    const coupons = await getCoupons();
    return <CouponManagementIsland initialCoupons={coupons} />;
}

export default async function BeheerCouponsPage() {
    return (
        <AdminPageShell
            title="Coupons Beheer"
            backHref="/beheer"
            hideToolbar={true}
        >
            <CouponDataLoader />
        </AdminPageShell>
    );
}
