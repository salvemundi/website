import React from 'react';
import { redirect } from 'next/navigation';
import AuditLogIsland from '@/components/islands/admin/AuditLogIsland';
import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';
import AdminPageShell from '@/components/ui/admin/AdminPageShell';
import { type Committee } from '@/shared/lib/permissions';

async function checkAuditAccess() {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    if (!session || !session.user) return false;
    
    const user = session.user as { committees?: Committee[] };
    const memberships = user.committees || [];
    return memberships.some((c) => {
        const name = (c?.name || '').toString().toLowerCase();
        return name.includes('bestuur') || name.includes('ict') || name.includes('kas') || name.includes('kandi');
    });
}

import { 
    getPendingSignupsAction, 
    getAuditSettingsAction, 
    getSystemLogsAction, 
    getQueueStatusAction 
} from '@/server/actions/audit.actions';

/**
 * AuditLoggingPage: Nuclear SSR Modernization.
 * Wrapped in AdminPageShell for instant header rendering.
 * All data is fetched concurrently at the top-level to ensure Zero-Drift.
 */
export default async function AuditLoggingPage() {
    const hasAccess = await checkAuditAccess();

    if (!hasAccess) {
        redirect('/beheer');
    }

    // Fetch all audit data concurrently
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

    const initialData = {
        signups: signupsRes.success ? (signupsRes.data || []) : [],
        manualApproval: settingsRes.success ? (settingsRes.data?.manual_approval ?? false) : false,
        adminLogs: adminLogsRes.success ? (adminLogsRes.data || []) : [],
        adminLogsTotal: adminLogsRes.success ? (adminLogsRes.totalCount || 0) : 0,
        systemLogs: systemLogsRes.success ? (systemLogsRes.data || []) : [],
        systemLogsTotal: systemLogsRes.success ? (systemLogsRes.totalCount || 0) : 0,
        queueData: queueRes.success ? (queueRes.data?.queues || null) : null
    };

    return (
        <AdminPageShell
            title="Audit & Logboek"
            subtitle="Monitor systeemwijzigingen en beheerdersacties in real-time."
            backHref="/beheer"
        >
            <AuditLogIsland initialData={initialData} />
        </AdminPageShell>
    );
}
