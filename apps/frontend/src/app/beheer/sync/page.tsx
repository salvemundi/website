import { Metadata } from 'next';
import { getSyncStatusAction, type SyncStatus } from '@/server/actions/infrastructure/azure-sync/sync-monitoring.actions';
import SyncControlIsland from '@/components/islands/admin/sync/SyncControlIsland';
import SyncMonitorIsland from '@/components/islands/admin/sync/SyncMonitorIsland';
import { SyncProvider } from '@/components/islands/admin/sync/SyncContext';
import AdminPageShell from '@/components/ui/admin/AdminPageShell';

export const metadata: Metadata = {
    title: 'Beheer Sync | SV Salve Mundi'
};


export default async function AzureSyncPage() {

    const statusData = await getSyncStatusAction();
    const initialStatus = !('success' in statusData)
        ? (statusData as SyncStatus)
        : null;

    const issuesCount = (initialStatus?.errorCount || 0) + (initialStatus?.warningCount || 0) + (initialStatus?.missingDataCount || 0);
    const updatedCount = Math.max(0, (initialStatus?.successCount || 0) - (initialStatus?.createdCount || 0)) + (initialStatus?.movedExpiredCount || 0);

    return (
        <AdminPageShell
            title="Azure Sync Monitor"
            backHref="/beheer"
            actions={
                <div className="flex items-center gap-4 rounded-2xl border border-border-color/50 bg-bg-soft px-4 py-2 shadow-sm">
                    <div className="flex flex-col items-center px-2">
                        <span className="mb-1 text-[10px] leading-none font-semibold text-text-muted">Status</span>
                        <span className={`text-sm leading-none font-bold ${initialStatus?.active ? 'text-beheer-active' : 'text-text-main'}`}>
                            {initialStatus?.status || 'Idle'}
                        </span>
                    </div>
                    <div className="h-6 w-px bg-border-color/20" />
                    <div className="flex flex-col items-center px-2">
                        <span className="mb-1 text-[10px] leading-none font-semibold text-text-muted">Opgeslagen</span>
                        <span className="text-sm leading-none font-bold text-text-main">{updatedCount}</span>
                    </div>
                    <div className="h-6 w-px bg-border-color/20" />
                    <div className="flex flex-col items-center px-2">
                        <span className="mb-1 text-[10px] leading-none font-semibold text-text-muted">Issues</span>
                        <span className={`text-sm leading-none font-bold ${issuesCount > 0 ? 'text-beheer-inactive' : 'text-text-main'}`}>
                            {issuesCount}
                        </span>
                    </div>
                    <div className="h-6 w-px bg-border-color/20" />
                    <div className="flex flex-col items-center px-2">
                        <span className="mb-1 text-[10px] leading-none font-semibold text-text-muted">Nieuw</span>
                        <span className="text-sm leading-none font-bold text-text-main">{initialStatus?.createdCount || 0}</span>
                    </div>
                </div>
            }
        >
            <SyncProvider initialStatus={initialStatus}>
                <div className="relative z-10">
                    <div className="flex flex-col gap-6">
                        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
                            <div className="lg:sticky lg:top-8 lg:col-span-4">
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
