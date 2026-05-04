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

import AdminPageShell from '@/components/ui/admin/AdminPageShell';
import { type EnrichedUser } from '@/types/auth';
import { type Committee } from '@/shared/lib/permissions';

export const metadata: Metadata = {
    title: 'Beheer Sync | SV Salve Mundi',
};

async function checkSyncAccess() {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    if (!session || !session.user) return false;
    
    const user = session.user as unknown as EnrichedUser;
    const memberships = (user.committees as Committee[]) || [];
    return memberships.some((c: Committee) => {
        const name = (c?.name || '').toString().toLowerCase();
        return name.includes('bestuur') || name.includes('ict') || name.includes('kandi');
    });
}

export default async function AzureSyncPage() {
    // SECURITY: Still check access server-side to prevent unauthorized shell rendering
    const hasAccess = await checkSyncAccess();
    if (!hasAccess) redirect('/beheer');

    // NUCLEAR SSR: Pre-fetch sync status to avoid flickering and empty states
    const statusData = await getSyncStatusAction();
    const initialStatus = statusData && !('success' in statusData && statusData.success === false) 
        ? statusData 
        : null;

    return (
        <AdminPageShell
            title="Azure Sync Monitor"
            subtitle="Beheer de synchronisatie tussen Salve Mundi en Azure AD / Microsoft 365."
            backHref="/beheer"
        >
            <SyncProvider initialStatus={initialStatus}>
                <div className="container mx-auto px-4 py-8 max-w-7xl relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                    <div className="flex flex-col gap-10">
                        <SyncStatsIsland />
                        
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                            <div className="lg:col-span-4 lg:sticky lg:top-8">
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
