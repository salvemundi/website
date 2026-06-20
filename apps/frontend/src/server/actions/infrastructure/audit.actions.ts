'use server';
import { safeConsoleError, logWarn } from '@/server/utils/logger';
import { revalidateTag, revalidatePath, unstable_noStore as noStore } from "next/cache";
import { isSuperAdmin } from "@/lib/auth";
import { type Committee } from "@/shared/lib/permissions";
import { query } from '@/lib/database';
import {
    getPendingSignupsInternal,
    getSystemLogsInternal,
    insertSystemLogInternal,
    getIdNameLookupInternal,
    type SystemLog
} from "@/server/queries/audit.queries";
import { type PendingSignup } from "@salvemundi/validations/schema/audit.zod";
import { getEnrichedSession } from "@/server/auth/auth-utils";
import { type EnrichedUser } from "@/types/auth";
import { sanitizePayload } from "@/server/utils/log-sanitizer";

type ActionResponse<T> = { success: true; data: T } | { success: false; error: string };
type LogsResponse = { success: true; data: SystemLog[]; totalCount: number } | { success: false; error: string };

interface DbFeatureFlag {
    id: number;
    name: string;
    is_active: boolean;
    route_match: string;
}

interface QueueStatusData {
    queues: {
        new_users: {
            count: number;
            samples: {
                retries: number;
                maxRetries: number;
                userId?: string | null;
                email?: string | null;
            }[];
        };
        sync_existing: {
            count: number;
            samples: {
                retries: number;
                maxRetries: number;
                userId?: string | null;
                email?: string | null;
            }[];
        };
    };
    timestamp: string;
    uptime: number;
}

export async function logAdminAction(type: string, status: 'SUCCESS' | 'ERROR' | 'INFO', payload?: unknown) {
    try {
        const session = await getEnrichedSession();
        if (!session) {
            return;
        }

        const safePayload = sanitizePayload(payload as { [key: string]: unknown });
        const user = session.user as unknown as EnrichedUser;
        const impersonatedBy = (session as { impersonatedBy?: { id: string; name: string } }).impersonatedBy;

        const adminId = impersonatedBy?.id || user.id;
        const adminName = impersonatedBy?.name || `${user.first_name || ''} ${user.last_name || ''}`.trim();

        const payloadStr = JSON.stringify(safePayload);
        if (payloadStr.length > 15000) {
            logWarn('[audit.actions][logAdminAction] Log payload too large, dropping.');
            return;
        }

        const impersonationDetails = impersonatedBy ? {
            impersonated_by_id: impersonatedBy.id,
            impersonated_by_name: impersonatedBy.name,
            impersonated_target_id: user.id,
            impersonated_target_name: user.name || user.email
        } : {};

        await insertSystemLogInternal({
            type,
            status,
            payload: {
                ...(safePayload as { [key: string]: unknown }),
                ...impersonationDetails,
                admin_id: adminId,
                admin_name: adminName,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        safeConsoleError('[audit.actions][logAdminAction] Failed to log admin action:', error);
    }
}

async function checkAuditAccess() {
    const session = await getEnrichedSession();
    if (!session) return null;

    const user = session.user as { committees?: Committee[] };
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
    } catch (error) {
        safeConsoleError('[audit.actions][getPendingSignupsAction] Failed to fetch pending signups:', error);
        return { success: false, error: "Kon inschrijvingen niet ophalen." };
    }
}

export async function approveSignupAction(id: string, type: string) {
    const admin = await checkAuditAccess();
    if (!admin) return { success: false, error: "Unauthorized" };

    try {
        const internalToken = (process.env.INTERNAL_SERVICE_TOKEN || '').replace(/^"|"$/g, '').trim();
        const res = await fetch(`${process.env.FINANCE_SERVICE_URL}/api/payments/approve`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${internalToken}`
            },
            body: JSON.stringify({ mollieId: id })
        });

        if (!res.ok) throw new Error(`Finance approval failed: ${await res.text()}`);

        await logAdminAction('admin_signup_approved', 'SUCCESS', {
            context: 'lidmaatschap',
            signup_id: id,
            type: type
        });

        revalidatePath('/beheer/logging');
        return { success: true };
    } catch (error: unknown) {
        safeConsoleError(`[audit.actions][approveSignupAction] Failed to approve signup ${id}:`, error);
        return { success: false, error: "Goedkeuren mislukt." };
    }
}

export async function rejectSignupAction(id: string, type: string) {
    const admin = await checkAuditAccess();
    if (!admin) return { success: false, error: "Unauthorized" };

    try {
        await query('UPDATE transactions SET approval_status = $1 WHERE mollie_id = $2', ['rejected', id]);

        await logAdminAction('admin_signup_rejected', 'SUCCESS', {
            context: 'lidmaatschap',
            signup_id: id,
            type: type
        });

        revalidatePath('/beheer/logging');
        return { success: true };
    } catch (error: unknown) {
        safeConsoleError(`[audit.actions][rejectSignupAction] Failed to reject signup ${id}:`, error);
        return { success: false, error: "Afwijzen mislukt." };
    }
}

export async function getAuditSettingsAction(): Promise<ActionResponse<{ manual_approval: boolean }>> {
    const admin = await checkAuditAccess();
    if (!admin) return { success: false, error: "Unauthorized" };

    try {
        const { rows } = await query<DbFeatureFlag>('SELECT is_active FROM feature_flags WHERE name = $1 LIMIT 1', ['manual_approval']);
        const flag = rows[0] as DbFeatureFlag | undefined;
        return { success: true, data: { manual_approval: !!flag?.is_active } };
    } catch (error: unknown) {
        safeConsoleError('[audit.actions][getAuditSettingsAction] Failed to fetch audit settings:', error);
        return { success: true, data: { manual_approval: false } };
    }
}

export async function updateAuditSettingsAction(manualApproval: boolean) {
    const admin = await checkAuditAccess();
    if (!admin) return { success: false, error: "Unauthorized" };

    try {
        const { rows } = await query<DbFeatureFlag>('SELECT id FROM feature_flags WHERE name = $1 LIMIT 1', ['manual_approval']);
        const flagId = rows[0]?.id;

        if (flagId) {
            await query('UPDATE feature_flags SET is_active = $1 WHERE id = $2', [manualApproval, flagId]);
        } else {
            await query('INSERT INTO feature_flags (name, is_active, route_match) VALUES ($1, $2, $3)',
                ['manual_approval', manualApproval, 'SYSTEM']);
        }

        await logAdminAction('admin_settings_change', 'SUCCESS', {
            context: 'systeem',
            setting: 'manual_approval',
            value: manualApproval
        });

        revalidateTag('audit_settings', 'max');
        return { success: true };
    } catch (error: unknown) {
        safeConsoleError('[audit.actions][updateAuditSettingsAction] Failed to update audit settings:', error);
        return { success: false, error: "Bijwerken instellingen mislukt." };
    }
}

export async function getSystemLogsAction(limit: number = 50, source: 'admin' | 'system' = 'admin'): Promise<LogsResponse> {
    const admin = await checkAuditAccess();
    if (!admin) return { success: false, error: "Unauthorized" };

    try {
        const result = await getSystemLogsInternal(limit, source);
        return { success: true, data: result.logs, totalCount: result.totalCount };
    } catch (error: unknown) {
        safeConsoleError('[audit.actions][getSystemLogsAction] Failed to fetch system logs:', error);
        return { success: false, error: "Kon logs niet ophalen." };
    }
}

export async function getQueueStatusAction(): Promise<ActionResponse<QueueStatusData>> {
    noStore();
    const admin = await checkAuditAccess();
    if (!admin) return { success: false, error: "Unauthorized" };

    try {
        const internalToken = (process.env.INTERNAL_SERVICE_TOKEN || '').replace(/^"|"$/g, '').trim();
        const res = await fetch(`${process.env.AZURE_MANAGEMENT_SERVICE_URL}/api/monitoring/status`, {
            headers: {
                'Authorization': `Bearer ${internalToken}`
            }
        });

        if (!res.ok) throw new Error('Management service monitoring failed');
        const data = (await res.json()) as QueueStatusData;

        return { success: true, data };
    } catch (error: unknown) {
        safeConsoleError('[audit.actions][getQueueStatusAction] Failed to fetch queue status:', error);
        return { success: false, error: "Kon wachtrij status niet ophalen." };
    }
}

async function bulkActionHelper(items: { id: string; type: string }[], actionFn: (id: string, type: string) => Promise<{ success: boolean; error?: string }>) {
    const results = await Promise.allSettled(
        items.map(item => actionFn(item.id, item.type))
    );

    const failures = results.filter(r => r.status === 'rejected' || !r.value.success);

    revalidatePath('/beheer/logging');

    if (failures.length > 0) {
        return { success: false, error: `${failures.length} items konden niet worden verwerkt.` };
    }

    return { success: true };
}

export async function bulkApproveSignupsAction(items: { id: string; type: string }[]) {
    const admin = await checkAuditAccess();
    if (!admin) return { success: false, error: "Unauthorized" };
    return bulkActionHelper(items, approveSignupAction);
}

export async function bulkRejectSignupsAction(items: { id: string; type: string }[]) {
    const admin = await checkAuditAccess();
    if (!admin) return { success: false, error: "Unauthorized" };
    return bulkActionHelper(items, rejectSignupAction);
}

export async function acknowledgeSystemLogAction(logId: string) {
    const admin = await checkAuditAccess();
    if (!admin) return { success: false, error: "Unauthorized" };

    try {
        await query('UPDATE system_logs SET acknowledged_at = NOW() WHERE id = $1', [logId]);
        revalidatePath('/beheer/logging');
        return { success: true };
    } catch (error: unknown) {
        safeConsoleError(`[audit.actions][acknowledgeSystemLogAction] Failed to acknowledge system log ${logId}:`, error);
        return { success: false, error: "Markeren als gezien mislukt." };
    }
}

export async function getIdNameLookupAction(): Promise<ActionResponse<{ [key: string]: string }>> {
    const admin = await checkAuditAccess();
    if (!admin) return { success: false, error: "Unauthorized" };

    try {
        const result = await getIdNameLookupInternal();
        return { success: true, data: result };
    } catch (error: unknown) {
        safeConsoleError('[audit.actions][getIdNameLookupAction] Failed to fetch ID name lookup map:', error);
        return { success: false, error: "Kon ID-namen mapping niet ophalen." };
    }
}