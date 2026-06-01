import React from 'react';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getEnrichedSession } from '@/server/auth/auth-utils';
import { getSyncStatusAction, type SyncStatus } from '@/server/actions/infrastructure/azure-sync/sync-monitoring.actions';

// Modular Islands
import SyncControlIsland from '@/components/islands/admin/sync/SyncControlIsland';
import SyncMonitorIsland from '@/components/islands/admin/sync/SyncMonitorIsland';
import { SyncProvider } from '@/components/islands/admin/sync/SyncContext';

import AdminPageShell from '@/components/ui/admin/AdminPageShell';
import { type Committee } from '@/shared/lib/permissions';

export const metadata: Metadata = {
    title: 'Beheer Sync | SV Salve Mundi'
};

async function checkSyncAccess() {
    const session = await getEnrichedSession();
    if (!session) return false;

    const user = session.user;
    const memberships = user.committees || [];
    return memberships.some((c: Committee) => {
        const name = (c.name || '').toString().toLowerCase();
        return name.includes('bestuur') || name.includes('ict') || name.includes('kandi');
    });
}

export default async function AzureSyncPage() {
    // SECURITY: Still check access server-side to prevent unauthorized shell rendering
    const hasAccess = await checkSyncAccess();
    if (!hasAccess) redirect('/beheer');

    const statusData = await getSyncStatusAction();
    const initialStatus = !('success' in statusData)
        ? (statusData as SyncStatus)
        : null;

    const issuesCount = (initialStatus?.errorCount || 0) + (initialStatus?.warningCount || 0) + (initialStatus?.missingDataCount || 0);
    const updatedCount = Math.max(0, (initialStatus?.successCount || 0) - (initialStatus?.createdCount || 0)) + (initialStatus?.movedExpiredCount || 0);

    return (
        <AdminPageShell
            title="Azure Sync Monitor"
            subtitle="Beheer de synchronisatie tussen Salve Mundi en Azure AD / Microsoft 365."
            backHref="/beheer"
            actions={
                <div className="flex items-center gap-4 bg-bg-soft px-4 py-2 rounded-2xl border border-border-color/50 shadow-sm">
                    <div className="flex flex-col items-center px-2">
                        <span className="text-[10px] font-semibold text-text-muted leading-none mb-1">Status</span>
                        <span className={`text-sm font-bold leading-none ${initialStatus?.active ? 'text-beheer-active' : 'text-text-main'}`}>
                            {initialStatus?.status || 'Idle'}
                        </span>
                    </div>
                    <div className="w-px h-6 bg-border-color/20" />
                    <div className="flex flex-col items-center px-2">
                        <span className="text-[10px] font-semibold text-text-muted leading-none mb-1">Opgeslagen</span>
                        <span className="text-sm font-bold text-text-main leading-none">{updatedCount}</span>
                    </div>
                    <div className="w-px h-6 bg-border-color/20" />
                    <div className="flex flex-col items-center px-2">
                        <span className="text-[10px] font-semibold text-text-muted leading-none mb-1">Issues</span>
                        <span className={`text-sm font-bold leading-none ${issuesCount > 0 ? 'text-beheer-inactive' : 'text-text-main'}`}>
                            {issuesCount}
                        </span>
                    </div>
                    <div className="w-px h-6 bg-border-color/20" />
                    <div className="flex flex-col items-center px-2">
                        <span className="text-[10px] font-semibold text-text-muted leading-none mb-1">Nieuw</span>
                        <span className="text-sm font-bold text-text-main leading-none">{initialStatus?.createdCount || 0}</span>
                    </div>
                </div>
            }
        >
            <SyncProvider initialStatus={initialStatus}>
                <div className="container mx-auto px-4 py-8 max-w-7xl relative z-10">
                    <div className="flex flex-col gap-6">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
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
