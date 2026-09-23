import AuditLogIsland from '@/components/islands/admin/AuditLogIsland';
import AdminPageShell from '@/components/ui/admin/AdminPageShell';
import {
    getPendingSignupsAction,
    getAuditSettingsAction,
    getSystemLogsAction,
    getQueueStatusAction
} from '@/server/actions/infrastructure/audit.actions';

export default async function AuditLoggingPage() {
    const [
        signupsRes,
        settingsRes,
        adminLogsRes,
        systemLogsRes,
        queueRes
    ] = await Promise.all([
        getPendingSignupsAction(),
        getAuditSettingsAction(),
        getSystemLogsAction(50, 'admin'),
        getSystemLogsAction(50, 'system'),
        getQueueStatusAction()
    ]);
    
    const combinedResolvedNames = {
        ...(adminLogsRes.success ? adminLogsRes.resolvedNames || {} : {}),
        ...(systemLogsRes.success ? systemLogsRes.resolvedNames || {} : {})
    };

    const initialData = {
        signups: signupsRes.success ? signupsRes.data : [],
        manualApproval: settingsRes.success ? settingsRes.data.manual_approval : false,
        adminLogs: adminLogsRes.success ? adminLogsRes.data : [],
        adminLogsTotal: adminLogsRes.success ? adminLogsRes.totalCount : 0,
        systemLogs: systemLogsRes.success ? systemLogsRes.data : [],
        systemLogsTotal: systemLogsRes.success ? systemLogsRes.totalCount : 0,
        queueData: queueRes.success ? queueRes.data.queues : null,
        idNameLookup: combinedResolvedNames
    };

    return (
        <AdminPageShell
            title="Audit & Logboek"
            backHref="/beheer"
            actions={
                <div className="flex items-center gap-4 rounded-2xl border border-(--beheer-border)/50 bg-(--beheer-card-soft) px-4 py-2 shadow-sm">
                    <div className="flex flex-col items-center px-2">
                        <span className="mb-1 text-[10px] leading-none font-semibold text-(--beheer-text-muted)">Wachtrij</span>
                        <span className="text-sm leading-none font-bold text-(--beheer-text)">{initialData.signups.length}</span>
                    </div>
                    <div className="h-6 w-px bg-(--beheer-border)/20" />
                    <div className="flex flex-col items-center px-2">
                        <span className="mb-1 text-[10px] leading-none font-semibold text-(--beheer-text-muted)">Commissie</span>
                        <span className="text-sm leading-none font-bold text-(--beheer-text)">{initialData.adminLogsTotal}</span>
                    </div>
                    <div className="h-6 w-px bg-(--beheer-border)/20" />
                    <div className="flex flex-col items-center px-2">
                        <span className="mb-1 text-[10px] leading-none font-semibold text-(--beheer-text-muted)">Systeem</span>
                        <span className="text-sm leading-none font-bold text-(--beheer-text)">{initialData.systemLogsTotal}</span>
                    </div>
                </div>
            }
        >
            <AuditLogIsland initialData={initialData} />
        </AdminPageShell>
    );
}
