import { Suspense } from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { Ticket, Loader2 } from 'lucide-react';

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
        <main className="min-h-screen bg-[var(--bg-main)]">
            {/* Page Header Area - Tokenized */}
            <div className="bg-[var(--beheer-card-bg)] border-b border-[var(--beheer-border)]">
                <div className="container mx-auto px-4 py-16 max-w-7xl">
                    <div className="flex items-center gap-5 mb-4">
                        <div className="h-14 w-14 rounded-[var(--radius-2xl)] bg-[var(--beheer-accent)]/10 text-[var(--beheer-accent)] flex items-center justify-center shadow-2xl shadow-[var(--beheer-accent)]/10 animate-pulse">
                            <Ticket className="h-8 w-8" />
                        </div>
                        <h1 className="text-5xl font-black text-[var(--beheer-text)] tracking-widest uppercase">
                            Cou<span className="text-[var(--beheer-accent)]">pons</span>
                        </h1>
                    </div>
                    <p className="text-[var(--beheer-text-muted)] text-xl max-w-3xl leading-relaxed font-medium">
                        Beheer kortingscodes en acties voor het lidmaatschap.
                    </p>
                </div>
            </div>
            
            <Suspense fallback={<CouponPageLoader />}>
                <CouponManagementIsland initialCoupons={coupons} />
            </Suspense>
        </main>
    );
}

function CouponPageLoader() {
    return (
        <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[var(--beheer-accent)]/20 border-t-[var(--beheer-accent)] mb-4" />
            <p className="text-[var(--beheer-text-muted)] font-bold uppercase tracking-widest text-xs">Coupons laden...</p>
        </div>
    );
}
