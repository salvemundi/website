import { Suspense } from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { Ticket, Loader2 } from 'lucide-react';

import CouponManagementIsland from '@/components/islands/admin/coupons/CouponManagementIsland';
import { auth } from '@/server/auth/auth';
import { getCoupons } from '@/server/queries/admin-coupon.queries';

export const metadata: Metadata = {
    title: 'Coupons Beheer | SV Salve Mundi',
};

export default async function BeheerCouponsPage() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) redirect('/login');

    return (
        <main className="min-h-screen bg-[var(--bg-main)]">
            <Suspense fallback={<CouponPageLoader />}>
                <CouponDataLoader />
            </Suspense>
        </main>
    );
}

async function CouponDataLoader() {
    const coupons = await getCoupons().catch(() => []);
    return <CouponManagementIsland initialCoupons={coupons} />;
}

function CouponPageLoader() {
    return (
        <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[var(--beheer-accent)]/20 border-t-[var(--beheer-accent)] mb-4" />
            <p className="text-[var(--beheer-text-muted)] font-bold uppercase tracking-widest text-xs">Coupons laden...</p>
        </div>
    );
}
