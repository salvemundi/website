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
                <div className="relative z-10">
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
