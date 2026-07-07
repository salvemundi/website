import React from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getEnrichedSession } from '@/server/auth/auth-utils';
import AdminPageShell from '@/components/ui/admin/AdminPageShell';
import AdminUnauthorized from '@/components/ui/admin/AdminUnauthorized';
import { getPermissions } from '@/shared/lib/permissions';
import CouponManagementIsland from '@/components/islands/admin/coupons/CouponManagementIsland';
import { getCoupons } from '@/server/queries/coupon/admin-coupon.queries';

export const metadata: Metadata = {
    title: 'Coupons Beheer | SV Salve Mundi' };

async function CouponDataLoader() {
    const coupons = await getCoupons();
    return <CouponManagementIsland initialCoupons={coupons} />;
}

export default async function BeheerCouponsPage() {
    const session = await getEnrichedSession();
    if (!session?.user) redirect('/?needLogin=true');

    const permissions = getPermissions(session.user.committees);
    if (!permissions.includes('coupons')) {
        return <AdminUnauthorized title="Coupons Beheer" backHref="/beheer" />;
    }

    return (
        <AdminPageShell
            title="Coupons Beheer"
            subtitle="Beheer kortingscodes en acties voor het lidmaatschap"
            backHref="/beheer"
            hideToolbar={true}
        >
            <CouponDataLoader />
        </AdminPageShell>
    );
}
