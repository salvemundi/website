import React, { Suspense } from 'react';
import { redirect } from 'next/navigation';
import PageHeader from '@/components/ui/layout/PageHeader';
import AzureSyncIsland from '@/components/islands/admin/AzureSyncIsland';
import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';
import { Loader2 } from 'lucide-react';

async function checkSyncAccess() {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    if (!session || !session.user) return false;
    
    const user = session.user as any;
    const memberships = user.committees || [];
    return memberships.some((c: any) => {
        const name = (c?.name || '').toString().toLowerCase();
        return name.includes('bestuur') || name.includes('ict') || name.includes('kandi');
    });
}

import SyncSkeleton from '@/components/ui/admin/SyncSkeleton';

export default async function AzureSyncPage() {
    const hasAccess = await checkSyncAccess();

    if (!hasAccess) {
        redirect('/beheer');
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20">
            <PageHeader
                title="Azure AD Synchronisatie"
                description="Synchroniseer gebruikersgegevens en commissierechten met Microsoft Azure AD."
                backLink="/beheer"
                className="mb-0"
                contentPadding="pt-0 pb-2 sm:pt-0 sm:pb-2"
                titleClassName="text-sm sm:text-base md:text-xl"
            />

            <div className="container mx-auto px-4 py-8 max-w-7xl relative z-10">
                <Suspense fallback={<SyncSkeleton />}>
                    <AzureSyncIsland />
                </Suspense>
            </div>
        </div>
    );
}
