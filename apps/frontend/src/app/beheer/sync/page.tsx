import React, { Suspense } from 'react';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';
import { getSyncStatusAction } from '@/server/actions/azure-sync/sync-monitoring.actions';

// Modular Islands
import SyncHeaderIsland from '@/components/islands/admin/sync/SyncHeaderIsland';
import SyncStatsIsland from '@/components/islands/admin/sync/SyncStatsIsland';
import SyncControlIsland from '@/components/islands/admin/sync/SyncControlIsland';
import SyncMonitorIsland from '@/components/islands/admin/sync/SyncMonitorIsland';
import { SyncProvider } from '@/components/islands/admin/sync/SyncContext';
import SyncHydrator from '@/components/islands/admin/sync/SyncHydrator';

export const metadata: Metadata = {
    title: 'Beheer Sync | SV Salve Mundi',
};

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

/**
 * Client component-driven hydrator that passes server data into the shared context.
 */
async function SyncDataLayer({ statusPromise }: { statusPromise: Promise<any> }) {
    const status = await statusPromise;
    return <SyncHydrator initialStatus={status} />;
}

export default async function AzureSyncPage() {
    const hasAccess = await checkSyncAccess();

    if (!hasAccess) {
        redirect('/beheer');
    }

    // We fetch the status here to pass it as initialStatus for hydration
    const statusPromise = getSyncStatusAction().catch(() => null);

    return (
        <div className="min-h-screen bg-[var(--bg-main)]">
            <SyncProvider initialStatus={null}>
                <SyncHeaderIsland />
                
                <Suspense fallback={
                    <div className="container mx-auto px-4 py-8 max-w-7xl relative z-10">
                        <div className="space-y-8">
                            <SyncStatsIsland />
                            <SyncControlIsland />
                            <SyncMonitorIsland />
                        </div>
                    </div>
                }>
                    <SyncDataLayer statusPromise={statusPromise} />
                </Suspense>
            </SyncProvider>
        </div>
    );
}
