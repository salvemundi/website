'use server';

import { auth } from "@/server/auth/auth";
import { headers } from "next/headers";
import { revalidateTag, revalidatePath, unstable_noStore as noStore } from "next/cache";
import { isSuperAdmin } from "@/lib/auth";
import { query } from '@/lib/database';
import { 
    getPendingSignupsInternal, 
    getSystemLogsInternal, 
    insertSystemLogInternal 
} from "@/server/queries/audit.queries";
import { type PendingSignup } from "@salvemundi/validations/schema/audit.zod";

type ActionResponse<T> = { success: true; data: T } | { success: false; error: string };
type LogsResponse = { success: true; data: any[]; totalCount: number } | { success: false; error: string };

export async function logAdminAction(type: string, status: 'SUCCESS' | 'ERROR' | 'INFO', payload?: any) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        const user = session?.user as any;
        
        await insertSystemLogInternal({
            type,
            status,
            payload: {
                ...payload,
                admin_id: user?.id || null,
                admin_name: user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : 'Systeem',
                timestamp: new Date().toISOString()
            }
        });
    } catch (e) {
        console.error('[AuditActions] Failed to log admin action:', e);
    }
}

async function checkAuditAccess() {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    if (!session || !session.user) return null;
    
    const user = session.user as any;
    const isAdmin = isSuperAdmin(user.committees);

    if (!isAdmin) return null;
    return session;
}

export async function getPendingSignupsAction(): Promise<ActionResponse<PendingSignup[]>> {
    noStore();
    const admin = await checkAuditAccess();
    if (!admin) return { success: false, error: "Unauthorized" };

    try {
        const aggregated = await getPendingSignupsInternal();
        return { success: true, data: aggregated };
    } catch (err) {
        console.error('[AuditActions] Failed to fetch pending signups:', err);
        return { success: false, error: "Kon inschrijvingen niet ophalen." };
    }
}

export async function approveSignupAction(id: string, type: string) {
    const admin = await checkAuditAccess();
    if (!admin) return { success: false, error: "Unauthorized" };

    try {
        // Internal call to finance-service to release the payment and trigger Azure sync
        const res = await fetch(`${process.env.FINANCE_SERVICE_URL}/api/payments/approve`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.INTERNAL_SERVICE_TOKEN}`
            },
            body: JSON.stringify({ mollieId: id })
        });

        if (!res.ok) throw new Error(`Finance approval failed: ${await res.text()}`);
        
        await logAdminAction('signup_approved', 'SUCCESS', { 
            signup_id: id, 
            type: type 
        });

        revalidatePath('/beheer/logging');
        return { success: true };
    } catch (err) {
        
        return { success: false, error: "Goedkeuren mislukt." };
    }
}

export async function rejectSignupAction(id: string, type: string) {
    const admin = await checkAuditAccess();
    if (!admin) return { success: false, error: "Unauthorized" };

    try {
        // Update transaction to rejected
        await query('UPDATE transactions SET approval_status = $1 WHERE mollie_id = $2', ['rejected', id]);
        
        await logAdminAction('signup_rejected', 'SUCCESS', { 
            signup_id: id, 
            type: type 
        });

        revalidatePath('/beheer/logging');
        return { success: true };
    } catch (err) {
        
        return { success: false, error: "Afwijzen mislukt." };
    }
}

export async function getAuditSettingsAction() {
    const admin = await checkAuditAccess();
    if (!admin) return { success: false, error: "Unauthorized" };

    try {
        const { rows } = await query('SELECT is_active FROM feature_flags WHERE name = $1 LIMIT 1', ['manual_approval']);
        
        const flag = rows?.[0];
        return { success: true, data: { manual_approval: !!flag?.is_active } };
    } catch (e) {
        
        return { success: true, data: { manual_approval: false } };
    }
}

export async function updateAuditSettingsAction(manualApproval: boolean) {
    const admin = await checkAuditAccess();
    if (!admin) return { success: false, error: "Unauthorized" };

    try {
        const { rows } = await query('SELECT id FROM feature_flags WHERE name = $1 LIMIT 1', ['manual_approval']);
        const flagId = rows?.[0]?.id;

        if (flagId) {
            await query('UPDATE feature_flags SET is_active = $1 WHERE id = $2', [manualApproval, flagId]);
            
        } else {
            await query('INSERT INTO feature_flags (name, is_active, route_match) VALUES ($1, $2, $3)', 
                ['manual_approval', manualApproval, 'SYSTEM']);
            
        }
        
        await logAdminAction('settings_change', 'SUCCESS', { 
            setting: 'manual_approval', 
            value: manualApproval 
        });

        revalidateTag('audit_settings', 'default');
        return { success: true };
    } catch (error) {
        
        return { success: false, error: "Bijwerken instellingen mislukt." };
    }
}

export async function getSystemLogsAction(limit: number = 50): Promise<LogsResponse> {
    const admin = await checkAuditAccess();
    if (!admin) return { success: false, error: "Unauthorized" };

    try {
        const result = await getSystemLogsInternal(limit);
        return { success: true, data: result.logs, totalCount: result.totalCount };
    } catch (err) {
        console.error('[AuditActions] Failed to fetch system logs:', err);
        return { success: false, error: "Kon logs niet ophalen." };
    }
}

export async function getQueueStatusAction() {
    noStore();
    const admin = await checkAuditAccess();
    if (!admin) return { success: false, error: "Unauthorized" };

    try {
        const res = await fetch(`${process.env.AZURE_MANAGEMENT_SERVICE_URL}/api/monitoring/status`, {
            headers: {
                'Authorization': `Bearer ${process.env.INTERNAL_SERVICE_TOKEN}`
            }
        });

        if (!res.ok) throw new Error('Management service monitoring failed');
        const data = await res.json();
        
        return { success: true, data };
    } catch (err) {
        return { success: false, error: "Kon wachtrij status niet ophalen." };
    }
}

export async function bulkApproveSignupsAction(items: { id: string; type: string }[]) {
    const admin = await checkAuditAccess();
    if (!admin) return { success: false, error: "Unauthorized" };

    const results = await Promise.allSettled(
        items.map(item => approveSignupAction(item.id, item.type))
    );

    const failures = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success));
    
    revalidatePath('/beheer/logging');
    
    if (failures.length > 0) {
        return { success: false, error: `${failures.length} items konden niet worden goedgekeurd.` };
    }

    return { success: true };
}

export async function bulkRejectSignupsAction(items: { id: string; type: string }[]) {
    const admin = await checkAuditAccess();
    if (!admin) return { success: false, error: "Unauthorized" };

    const results = await Promise.allSettled(
        items.map(item => rejectSignupAction(item.id, item.type))
    );

    const failures = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success));
    
    revalidatePath('/beheer/logging');

    if (failures.length > 0) {
        return { success: false, error: `${failures.length} items konden niet worden afgewezen.` };
    }

    return { success: true };
}
