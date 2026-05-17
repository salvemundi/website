import React from 'react';
import AuditLogIsland from '@/components/islands/admin/AuditLogIsland';
import AdminPageShell from '@/components/ui/admin/AdminPageShell';
import { 
    getPendingSignupsAction, 
    getAuditSettingsAction, 
    getSystemLogsAction, 
    getQueueStatusAction,
    getIdNameLookupAction
} from '@/server/actions/infrastructure/audit.actions';

export default async function AuditLoggingPage() {
    const [
        signupsRes, 
        settingsRes, 
        adminLogsRes, 
        systemLogsRes, 
        queueRes,
        idNameLookupRes
    ] = await Promise.all([
        getPendingSignupsAction(),
        getAuditSettingsAction(),
        getSystemLogsAction(50, 'admin'),
        getSystemLogsAction(50, 'system'),
        getQueueStatusAction(),
        getIdNameLookupAction()
    ]);

    const initialData = {
        signups: signupsRes.success ? (signupsRes.data || []) : [],
        manualApproval: settingsRes.success ? (settingsRes.data?.manual_approval ?? false) : false,
        adminLogs: adminLogsRes.success ? (adminLogsRes.data || []) : [],
        adminLogsTotal: adminLogsRes.success ? (adminLogsRes.totalCount || 0) : 0,
        systemLogs: systemLogsRes.success ? (systemLogsRes.data || []) : [],
        systemLogsTotal: systemLogsRes.success ? (systemLogsRes.totalCount || 0) : 0,
        queueData: queueRes.success ? (queueRes.data?.queues || null) : null,
        idNameLookup: idNameLookupRes.success ? (idNameLookupRes.data || {}) : {}
    };

    return (
        <AdminPageShell
            title="Audit & Logboek"
            subtitle="Monitor systeemwijzigingen en beheerdersacties in real-time."
            backHref="/beheer"
            actions={
                <div className="flex items-center gap-4 bg-[var(--beheer-card-soft)] px-4 py-2 rounded-2xl border border-[var(--beheer-border)]/50 shadow-sm">
                    <div className="flex flex-col items-center px-2">
                        <span className="text-[10px] font-semibold text-[var(--beheer-text-muted)] leading-none mb-1">Wachtrij</span>
                        <span className="text-sm font-bold text-[var(--beheer-text)] leading-none">{initialData.signups.length}</span>
                    </div>
                    <div className="w-px h-6 bg-[var(--beheer-border)]/20" />
                    <div className="flex flex-col items-center px-2">
                        <span className="text-[10px] font-semibold text-[var(--beheer-text-muted)] leading-none mb-1">Beheerder</span>
                        <span className="text-sm font-bold text-[var(--beheer-text)] leading-none">{initialData.adminLogsTotal}</span>
                    </div>
                    <div className="w-px h-6 bg-[var(--beheer-border)]/20" />
                    <div className="flex flex-col items-center px-2">
                        <span className="text-[10px] font-semibold text-[var(--beheer-text-muted)] leading-none mb-1">Systeem</span>
                        <span className="text-sm font-bold text-[var(--beheer-text)] leading-none">{initialData.systemLogsTotal}</span>
                    </div>
                </div>
            }
        >
            <AuditLogIsland initialData={initialData} />
        </AdminPageShell>
    );
}

