import AuditLogIsland from '@/components/islands/beheer/AuditLogIsland';
import BeheerPageShell from '@/components/ui/beheer/BeheerPageShell';
import {
    getPendingSignupsAction,
    getAuditSettingsAction,
    getSystemLogsAction
} from '@/server/actions/infrastructure/audit.actions';

export default async function AuditLoggingPage() {
    const [
        signupsRes,
        settingsRes,
        adminLogsRes,
        systemLogsRes
    ] = await Promise.all([
        getPendingSignupsAction(),
        getAuditSettingsAction(),
        getSystemLogsAction(50, 'admin'),
        getSystemLogsAction(50, 'system')
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
        idNameLookup: combinedResolvedNames
    };

    return (
        <BeheerPageShell
            title="Audit & Logboek"
            backHref="/beheer"
            actions={
                <div className="beheer-stat-strip">
                    <div className="flex flex-col items-center px-2">
                        <span className="stat-label-muted">Wachtrij</span>
                        <span className="text-sm leading-none font-bold text-beheer-text">{initialData.signups.length}</span>
                    </div>
                    <div className="v-divider-sm" />
                    <div className="flex flex-col items-center px-2">
                        <span className="stat-label-muted">Commissie</span>
                        <span className="text-sm leading-none font-bold text-beheer-text">{initialData.adminLogsTotal}</span>
                    </div>
                    <div className="v-divider-sm" />
                    <div className="flex flex-col items-center px-2">
                        <span className="stat-label-muted">Systeem</span>
                        <span className="text-sm leading-none font-bold text-beheer-text">{initialData.systemLogsTotal}</span>
                    </div>
                </div>
            }
        >
            <AuditLogIsland initialData={initialData} />
        </BeheerPageShell>
    );
}
