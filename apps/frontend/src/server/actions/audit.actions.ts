'use server';

import { auth } from "@/server/auth/auth";
import { headers } from "next/headers";
import { revalidateTag, revalidatePath } from "next/cache";
import { getSystemDirectus } from "@/lib/directus";
import { 
    readItems, 
    updateItem,
    readSingleton,
    updateSingleton,
    createItem
} from "@directus/sdk";
import { PendingSignup } from "@salvemundi/validations";
import { isSuperAdmin } from "@/lib/auth-utils";

/**
 * Helper to log admin actions to the system_logs collection.
 * This is the new designated logging collection.
 */
export async function logAdminAction(type: string, status: 'SUCCESS' | 'ERROR' | 'INFO', payload?: any) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        const user = session?.user as any;
        
        await getSystemDirectus().request(createItem('system_logs' as any, {
            type,
            status,
            payload: {
                ...payload,
                admin_id: user?.id || null,
                admin_name: user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : 'Systeem',
                timestamp: new Date().toISOString()
            }
        }));
    } catch (e) {
        console.warn('[Audit] Failed to log action:', e);
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

export async function getPendingSignupsAction() {
    const admin = await checkAuditAccess();
    if (!admin) return { success: false, error: "Unauthorized" };

    try {
        // Fetch from all 3 collections
        // 1. Events
        const eventSignups = (await getSystemDirectus().request(readItems('event_signups', {
            fields: ['id', 'date_created', 'participant_name', 'participant_email', 'approval_status', 'payment_status', { event_id: ['name'] }] as any,
            filter: { approval_status: { _eq: 'pending' } },
            sort: ['-date_created']
        }))) as any[];

        // 2. Pub Crawl
        const pubCrawlSignups = (await getSystemDirectus().request(readItems('pub_crawl_signups' as any, {
            fields: ['id', 'date_created', 'name', 'email', 'approval_status', 'payment_status', { pub_crawl_event_id: ['name'] }] as any,
            filter: { approval_status: { _eq: 'pending' } },
            sort: ['-date_created']
        }))) as any[];

        // 3. Trips
        const tripSignups = (await getSystemDirectus().request(readItems('trip_signups' as any, {
            fields: ['id', 'date_created', 'first_name', 'last_name', 'email', 'approval_status', 'payment_status', { trip_id: ['name'] }] as any,
            filter: { approval_status: { _eq: 'pending' } },
            sort: ['-date_created']
        }))) as any[];

        // Aggregate and map
        const aggregated: PendingSignup[] = [
            ...eventSignups.map((s: any) => ({
                id: s.id.toString(),
                created_at: s.date_created,
                email: s.participant_email,
                first_name: s.participant_name.split(' ')[0],
                last_name: s.participant_name.split(' ').slice(1).join(' '),
                product_name: s.event_id?.name || 'Onbekend Event',
                amount: 0, // In V7 prices are on the event, not the signup
                approval_status: s.approval_status as any,
                payment_status: s.payment_status,
                type: 'event' as const
            })),
            ...pubCrawlSignups.map((s: any) => ({
                id: s.id.toString(),
                created_at: s.date_created,
                email: s.email,
                first_name: s.name.split(' ')[0],
                last_name: s.name.split(' ').slice(1).join(' '),
                product_name: s.pub_crawl_event_id?.name || 'Kroegentocht',
                amount: 0,
                approval_status: s.approval_status as any,
                payment_status: s.payment_status,
                type: 'pub_crawl' as const
            })),
            ...tripSignups.map((s: any) => ({
                id: s.id.toString(),
                created_at: s.date_created,
                email: s.email,
                first_name: s.first_name,
                last_name: s.last_name,
                product_name: s.trip_id?.name || 'Studiereis',
                amount: 0,
                approval_status: s.approval_status as any,
                payment_status: s.payment_status,
                type: 'trip' as const
            }))
        ];

        return { success: true, data: aggregated.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) };
    } catch (err) {
        console.error("[AuditAction] Fetch error:", err);
        return { success: false, error: "Kon inschrijvingen niet ophalen." };
    }
}

export async function approveSignupAction(id: string, type: string) {
    const admin = await checkAuditAccess();
    if (!admin) return { success: false, error: "Unauthorized" };

    const collection = type === 'event' ? 'event_signups' : type === 'pub_crawl' ? 'pub_crawl_signups' : 'trip_signups';

    try {
        await getSystemDirectus().request(updateItem(collection as any, id as any, { approval_status: 'approved' }));
        
        // Log the approval
        await logAdminAction('signup_approved', 'SUCCESS', { 
            signup_id: id, 
            type: type 
        });

        revalidatePath('/beheer/logging');
        return { success: true };
    } catch (err) {
        console.error("[AuditAction] Approve error:", err);
        return { success: false, error: "Goedkeuren mislukt." };
    }
}

export async function rejectSignupAction(id: string, type: string) {
    const admin = await checkAuditAccess();
    if (!admin) return { success: false, error: "Unauthorized" };

    const collection = type === 'event' ? 'event_signups' : type === 'pub_crawl' ? 'pub_crawl_signups' : 'trip_signups';

    try {
        await getSystemDirectus().request(updateItem(collection as any, id as any, { approval_status: 'rejected' }));
        
        // Log the rejection
        await logAdminAction('signup_rejected', 'SUCCESS', { 
            signup_id: id, 
            type: type 
        });

        revalidatePath('/beheer/logging');
        return { success: true };
    } catch (err) {
        console.error("[AuditAction] Reject error:", err);
        return { success: false, error: "Afwijzen mislukt." };
    }
}

export async function getAuditSettingsAction() {
    const admin = await checkAuditAccess();
    if (!admin) return { success: false, error: "Unauthorized" };

    try {
        const url = `${process.env.DIRECTUS_SERVICE_URL}/items/feature_flags?filter[name][_eq]=manual_approval&fields=id,is_active`;
        const res = await fetch(url, {
            headers: { Authorization: `Bearer ${process.env.DIRECTUS_STATIC_TOKEN}` },
            cache: 'no-store'
        });
        
        if (res.ok) {
            const data = await res.json();
            const flag = data.data?.[0];
            return { success: true, data: { manual_approval: !!flag?.is_active } };
        }
        return { success: true, data: { manual_approval: false } };
    } catch {
        return { success: true, data: { manual_approval: false } };
    }
}

export async function updateAuditSettingsAction(manualApproval: boolean) {
    const admin = await checkAuditAccess();
    if (!admin) return { success: false, error: "Unauthorized" };

    try {
        const token = process.env.DIRECTUS_STATIC_TOKEN;
        const baseUrl = process.env.DIRECTUS_SERVICE_URL;
        
        // 1. Find the flag
        const listUrl = `${baseUrl}/items/feature_flags?filter[name][_eq]=manual_approval&fields=id`;
        const listRes = await fetch(listUrl, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const listData = await listRes.json();
        const flagId = listData.data?.[0]?.id;

        if (flagId) {
            // 2a. Update existing
            await fetch(`${baseUrl}/items/feature_flags/${flagId}`, {
                method: 'PATCH',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ is_active: manualApproval })
            });
        } else {
            // 2b. Create new
            await fetch(`${baseUrl}/items/feature_flags`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    name: 'manual_approval', 
                    is_active: manualApproval,
                    route_match: 'SYSTEM'
                })
            });
        }
        
        // Log the change
        await logAdminAction('settings_change', 'SUCCESS', { 
            setting: 'manual_approval', 
            value: manualApproval 
        });

        revalidateTag('audit_settings', 'default');
        return { success: true };
    } catch (error) {
        console.error("[AuditAction] Settings update error:", error);
        return { success: false, error: "Bijwerken instellingen mislukt." };
    }
}

/**
 * Fetches recent system logs for the audit dashboard.
 */
export async function getSystemLogsAction(limit: number = 50) {
    const admin = await checkAuditAccess();
    if (!admin) return { success: false, error: "Unauthorized" };

    try {
        const logs = await getSystemDirectus().request(readItems('system_logs' as any, {
            fields: ['id', 'type', 'status', 'payload', 'created_at'],
            sort: ['-created_at'],
            limit
        }));
        
        return { success: true, data: logs };
    } catch (err) {
        console.error("[AuditAction] Logs fetch error:", err);
        return { success: false, error: "Kon logs niet ophalen." };
    }
}
