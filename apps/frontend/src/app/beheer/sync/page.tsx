import React from 'react';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';
import { getSyncStatusAction } from '@/server/actions/azure-sync/sync-monitoring.actions';

// Modular Islands
import SyncStatsIsland from '@/components/islands/admin/sync/SyncStatsIsland';
import SyncControlIsland from '@/components/islands/admin/sync/SyncControlIsland';
import SyncMonitorIsland from '@/components/islands/admin/sync/SyncMonitorIsland';
import { SyncProvider } from '@/components/islands/admin/sync/SyncContext';
import SyncHydrator from '@/components/islands/admin/sync/SyncHydrator';

import AdminPageShell from '@/components/ui/admin/AdminPageShell';

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

export default async function AzureSyncPage() {
    // NUCLEAR SSR: All access and permission checks must happen before flushing the shell
    const hasAccess = await checkSyncAccess();
    if (!hasAccess) redirect('/beheer');

    const status = await getSyncStatusAction().catch(() => null);

    return (
        <AdminPageShell
            title="Azure Sync Monitor"
            subtitle="Beheer de synchronisatie tussen Salve Mundi en Azure AD / Microsoft 365."
            backHref="/beheer"
        >
            <SyncProvider initialStatus={status}>
                <SyncHydrator initialStatus={status} />
                <div className="container mx-auto px-4 py-8 max-w-7xl relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="grid grid-cols-1 gap-8">
                        <SyncStatsIsland />
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                            <div className="lg:col-span-4 h-full">
                                <SyncControlIsland />
                            </div>
                            <div className="lg:col-span-8">
                                <SyncMonitorIsland />
                            </div>
                        </div>
                    </div>
                </div>
            </SyncProvider>
        </AdminPageShell>
    );
}
