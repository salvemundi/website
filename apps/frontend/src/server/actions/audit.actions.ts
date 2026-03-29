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
import { 
    PendingSignup, 
    EVENT_SIGNUP_FIELDS,
    TRIP_SIGNUP_FIELDS,
    PUB_CRAWL_SIGNUP_FIELDS,
    SYSTEM_LOG_FIELDS
} from "@salvemundi/validations";
import { isSuperAdmin } from "@/lib/auth-utils";

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
            fields: [...EVENT_SIGNUP_FIELDS, { event_id: ['name'] }] as any,
            filter: { payment_status: { _eq: 'open' } },
            sort: ['-created_at'] as any
        }))) as any[];

        // 2. Pub Crawl
        const pubCrawlSignups = (await getSystemDirectus().request(readItems('pub_crawl_signups' as any, {
            fields: [...PUB_CRAWL_SIGNUP_FIELDS, { pub_crawl_event_id: ['name'] }] as any,
            filter: { payment_status: { _eq: 'open' } },
            sort: ['-created_at'] as any
        }))) as any[];

        // 3. Trips
        const tripSignups = (await getSystemDirectus().request(readItems('trip_signups' as any, {
            fields: [...TRIP_SIGNUP_FIELDS, { trip_id: ['name'] }] as any,
            filter: { status: { _eq: 'registered' } },
            sort: ['-created_at'] as any
        }))) as any[];

        // Aggregate and map
        const aggregated: PendingSignup[] = [
            ...eventSignups.map((s: any) => ({
                id: s.id.toString(),
                created_at: s.created_at,
                email: s.participant_email,
                first_name: s.participant_name.split(' ')[0],
                last_name: s.participant_name.split(' ').slice(1).join(' '),
                product_name: s.event_id?.name || 'Onbekend Event',
                amount: 0,
                approval_status: 'pending' as any,
                payment_status: s.payment_status,
                type: 'event' as const
            })),
            ...pubCrawlSignups.map((s: any) => ({
                id: s.id.toString(),
                created_at: s.created_at,
                email: s.email,
                first_name: s.name.split(' ')[0],
                last_name: s.name.split(' ').slice(1).join(' '),
                product_name: s.pub_crawl_event_id?.name || 'Kroegentocht',
                amount: 0,
                approval_status: 'pending' as any,
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
        const items = await getSystemDirectus().request(readItems('feature_flags', {
            filter: { name: { _eq: 'manual_approval' } },
            fields: ['id', 'is_active'],
            limit: 1
        }));
        
        const flag = items?.[0];
        return { success: true, data: { manual_approval: !!flag?.is_active } };
    } catch (e) {
        console.error("[AuditAction] Settings fetch error:", e);
        return { success: true, data: { manual_approval: false } };
    }
}

export async function updateAuditSettingsAction(manualApproval: boolean) {
    const admin = await checkAuditAccess();
    if (!admin) return { success: false, error: "Unauthorized" };

    try {
        const client = getSystemDirectus();
        
        // 1. Find the flag
        const items = await client.request(readItems('feature_flags', {
            filter: { name: { _eq: 'manual_approval' } },
            fields: ['id'],
            limit: 1
        }));
        const flagId = items?.[0]?.id;

        if (flagId) {
            // 2a. Update existing
            await client.request(updateItem('feature_flags', flagId as any, { is_active: manualApproval }));
        } else {
            // 2b. Create new
            await client.request(createItem('feature_flags', { 
                name: 'manual_approval', 
                is_active: manualApproval,
                route_match: 'SYSTEM'
            }));
        }
        
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

export async function getSystemLogsAction(limit: number = 50) {
    const admin = await checkAuditAccess();
    if (!admin) return { success: false, error: "Unauthorized" };

    try {
        const logs = await getSystemDirectus().request(readItems('system_logs' as any, {
            fields: [...SYSTEM_LOG_FIELDS],
            sort: ['-created_at'],
            limit
        }));
        
        return { success: true, data: logs };
    } catch (err) {
        console.error("[AuditAction] Logs fetch error:", err);
        return { success: false, error: "Kon logs niet ophalen." };
    }
}
