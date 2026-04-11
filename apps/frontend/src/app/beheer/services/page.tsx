'use client';

import React, { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { authClient } from '@/lib/auth';
import { COMMITTEES } from '@/shared/lib/permissions-config';
import ServicesStatusIsland from '@/components/islands/admin/ServicesStatusIsland';
import SyncSkeleton from '@/components/ui/admin/SyncSkeleton';

export default function ServicesStatusPage() {
    const { data: session, isPending } = authClient.useSession();

    if (isPending) return <SyncSkeleton />;
    
    if (!session || !session.user) {
        redirect('/beheer');
    }
    
    const user = session.user as any;
    const memberships = user.committees || [];
    
    const hasAccess = memberships.some((c: any) => 
        c.id === COMMITTEES.ICT || c.id === COMMITTEES.BESTUUR
    );

    if (!hasAccess) {
        redirect('/beheer');
    }

    return (
        <div className="min-h-screen bg-[var(--bg-main)]">
            <div className="container mx-auto px-4 py-8 max-w-7xl relative z-10">
                <Suspense fallback={<SyncSkeleton />}>
                    <ServicesStatusIsland />
                </Suspense>
            </div>
        </div>
    );
}
