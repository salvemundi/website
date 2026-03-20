import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

import PageHeader from '@/components/ui/layout/PageHeader';
import CouponManagementIsland from '@/components/islands/admin/CouponManagementIsland';
import { auth } from '@/server/auth/auth';
import { getCoupons } from '@/server/actions/admin-coupons.actions';

export const metadata: Metadata = {
    title: 'Coupons Beheer | SV Salve Mundi',
};

export default async function BeheerCouponsPage() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) redirect('/login');

    const coupons = await getCoupons().catch(() => []);

    return (
        <div className="min-h-screen bg-[var(--bg-main)]">
            <PageHeader
                title="Coupons Beheer"
                description="Beheer kortingscodes en acties voor het lidmaatschap."
                backLink="/beheer"
            />
            <CouponManagementIsland initialCoupons={coupons} />
        </div>
    );
}
