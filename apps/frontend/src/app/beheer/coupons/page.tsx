import React from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import AdminPageShell from '@/components/ui/admin/AdminPageShell';
import CouponManagementIsland from '@/components/islands/admin/coupons/CouponManagementIsland';
import { auth } from '@/server/auth/auth';
import { getCoupons } from '@/server/queries/admin-coupon.queries';

export const metadata: Metadata = {
    title: 'Coupons Beheer | SV Salve Mundi',
};

async function CouponDataLoader() {
    const coupons = await getCoupons().catch(() => []);
    return <CouponManagementIsland initialCoupons={coupons} />;
}

export default async function BeheerCouponsPage() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) redirect('/login');

    return (
        <AdminPageShell
            title="Coupons Beheer"
            subtitle="Beheer kortingscodes en acties"
            backHref="/beheer"
            hideToolbar={true}
        >
            <CouponDataLoader />
        </AdminPageShell>
    );
}
