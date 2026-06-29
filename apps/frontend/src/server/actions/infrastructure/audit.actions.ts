'use server';
import { safeConsoleError, logWarn } from '@/server/utils/logger';
import { revalidateTag, revalidatePath, unstable_noStore as noStore } from "next/cache";
import { isSuperAdmin } from "@/lib/auth";
import { type Committee } from "@/shared/lib/permissions";
import { db, schema } from '@salvemundi/db';
import { eq, sql } from 'drizzle-orm';
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
            logWarn('[audit.actions.ts][logAdminAction] Log payload too large, dropping.');
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
        safeConsoleError('[audit.actions.ts][logAdminAction] Failed to log admin action:', error);
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
        safeConsoleError('[audit.actions.ts][getPendingSignupsAction] Failed to fetch pending signups:', error);
        return { success: false, error: "Kon inschrijvingen niet ophalen." };
    }
}

export async function approveSignupAction(id: string, type: string) {
    const admin = await checkAuditAccess();
    if (!admin) return { success: false, error: "Unauthorized" };

    try {
        const internalToken = (process.env.INTERNAL_SERVICE_TOKEN || '').replace(/^"|"$/g, '').trim();
        const res = await fetch(`${process.env.FINANCE_SERVICE_URL}/api/finance/approve`, {
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
        safeConsoleError(`[audit.actions.ts][approveSignupAction] Failed to approve signup ${id}:`, error);
        return { success: false, error: "Goedkeuren mislukt." };
    }
}

export async function rejectSignupAction(id: string, type: string) {
    const admin = await checkAuditAccess();
    if (!admin) return { success: false, error: "Unauthorized" };

    try {
        await db.update(schema.transactions)
            .set({ approval_status: 'rejected' })
            .where(eq(schema.transactions.mollie_id, id));

        await logAdminAction('admin_signup_rejected', 'SUCCESS', {
            context: 'lidmaatschap',
            signup_id: id,
            type: type
        });

        revalidatePath('/beheer/logging');
        return { success: true };
    } catch (error: unknown) {
        safeConsoleError(`[audit.actions.ts][rejectSignupAction] Failed to reject signup ${id}:`, error);
        return { success: false, error: "Afwijzen mislukt." };
    }
}

export async function getAuditSettingsAction(): Promise<ActionResponse<{ manual_approval: boolean }>> {
    const admin = await checkAuditAccess();
    if (!admin) return { success: false, error: "Unauthorized" };

    try {
        const rows = await db.select({
            is_active: schema.feature_flags.is_active
        }).from(schema.feature_flags)
        .where(eq(schema.feature_flags.name, 'manual_approval'))
        .limit(1);
        return { success: true, data: { manual_approval: rows.length > 0 ? !!rows[0].is_active : false } };
    } catch (error: unknown) {
        safeConsoleError('[audit.actions.ts][getAuditSettingsAction] Failed to fetch audit settings:', error);
        return { success: true, data: { manual_approval: false } };
    }
}

export async function updateAuditSettingsAction(manualApproval: boolean) {
    const admin = await checkAuditAccess();
    if (!admin) return { success: false, error: "Unauthorized" };

    try {
        const rows = await db.select({
            id: schema.feature_flags.id
        }).from(schema.feature_flags)
        .where(eq(schema.feature_flags.name, 'manual_approval'))
        .limit(1);

        if (rows.length > 0) {
            await db.update(schema.feature_flags).set({ is_active: manualApproval }).where(eq(schema.feature_flags.id, rows[0].id));
        } else {
            await db.insert(schema.feature_flags).values({
                name: 'manual_approval',
                is_active: manualApproval,
                route_match: 'SYSTEM'
            });
        }

        await logAdminAction('admin_settings_change', 'SUCCESS', {
            context: 'systeem',
            setting: 'manual_approval',
            value: manualApproval
        });

        revalidateTag('audit_settings', 'max');
        return { success: true };
    } catch (error: unknown) {
        safeConsoleError('[audit.actions.ts][updateAuditSettingsAction] Failed to update audit settings:', error);
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
        safeConsoleError('[audit.actions.ts][getSystemLogsAction] Failed to fetch system logs:', error);
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
        safeConsoleError('[audit.actions.ts][getQueueStatusAction] Failed to fetch queue status:', error);
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
        await db.update(schema.system_logs)
            .set({ acknowledged_at: sql`NOW()` })
            .where(eq(schema.system_logs.id, logId));
        revalidatePath('/beheer/logging');
        return { success: true };
    } catch (error: unknown) {
        safeConsoleError(`[audit.actions.ts][acknowledgeSystemLogAction] Failed to acknowledge system log ${logId}:`, error);
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
        safeConsoleError('[audit.actions.ts][getIdNameLookupAction] Failed to fetch ID name lookup map:', error);
        return { success: false, error: "Kon ID-namen mapping niet ophalen." };
    }
}